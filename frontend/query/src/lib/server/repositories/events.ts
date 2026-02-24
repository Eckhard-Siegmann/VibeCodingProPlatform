import { getDatabase, generateId, nowIso } from '../db';
import { addToQueue, removeFromQueueRaw, updateQueueState } from './queue';
import {
    EJECTION_DECISIONS,
    CLOSING_DECISIONS,
    MODE_CLOSE_DECISION,
    type DecisionTypeKey
} from '$lib/constants/decisions';

export interface LiveContext {
    event_id: string;
    current_problem_id: string | null;
    current_mode: 'idle' | 'pitch' | 'review';
    mode_opened_at: string | null;
    timer_duration_minutes: number | null;
    timer_ends_at: string | null;
    updated_at: string;
    // Joined info
    problem_title?: string;
    problem_slug?: string;
}

export interface RecordDecisionParams {
    eventId: string;
    problemId: string;
    decisionType: string;
    actorUserId: string;
    rationale?: string;
    timerDurationMinutes?: number;
}

export interface RecordDecisionResult {
    success: boolean;
    decision_id?: string;
    auto_closed_decision_id?: string;
    assessment_id?: string;
    new_readiness_state?: string;
    new_action_state?: string;
    new_live_mode?: string;
    error?: string;
}

const PITCH_INVENTORY_ID = '4c9a2b1d-8f7e-4c1a-9b3e-2d7e8f9a0b03';
const REVIEW_INVENTORY_ID = '9f0a1b2c-3d4e-4f5a-9b6c-3e4f5a6b0b04';

export function getEventById(eventId: string) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM events WHERE event_id = ?').get(eventId);
}

export function ensureLiveContext(eventId: string): void {
    const db = getDatabase();
    const now = nowIso();

    const exists = db.prepare('SELECT event_id FROM event_live_context WHERE event_id = ?').get(eventId);
    if (!exists) {
        db.prepare(`
			INSERT INTO event_live_context (event_id, current_mode, updated_at)
			VALUES (?, 'idle', ?)
		`).run(eventId, now);
    }
}

export function getLiveContext(eventId: string): LiveContext | null {
    const db = getDatabase();

    ensureLiveContext(eventId);

    // Ch.14 §14.5.1.1: Lazy timer evaluation before returning context
    checkAndCloseExpiredTimer(eventId);

    const context = db.prepare(`
		SELECT
			c.*,
			pv.title as problem_title,
			p.public_slug as problem_slug
		FROM event_live_context c
		LEFT JOIN problems p ON c.current_problem_id = p.problem_id
		LEFT JOIN problem_versions pv ON p.problem_id = pv.problem_id AND pv.is_current = 1
		WHERE c.event_id = ?
	`).get(eventId) as LiveContext | undefined;

    return context || null;
}

/**
 * Lazy timer evaluation (Ch.14 §14.5.1.1).
 * If timer_ends_at is in the past and current_mode is not idle,
 * auto-close via recordDecision with the event host as actor.
 */
function checkAndCloseExpiredTimer(eventId: string): boolean {
    const db = getDatabase();

    const ctx = db.prepare(`
        SELECT current_mode, current_problem_id, timer_ends_at
        FROM event_live_context
        WHERE event_id = ?
    `).get(eventId) as { current_mode: string; current_problem_id: string | null; timer_ends_at: string | null } | undefined;

    if (!ctx || ctx.current_mode === 'idle' || !ctx.timer_ends_at || !ctx.current_problem_id) {
        return false;
    }

    const now = new Date();
    const timerEnd = new Date(ctx.timer_ends_at);

    if (timerEnd >= now) {
        return false; // Timer still running
    }

    // Timer expired — determine close decision type
    const closeDecision = MODE_CLOSE_DECISION[ctx.current_mode];
    if (!closeDecision) {
        return false; // Unknown mode, shouldn't happen
    }

    // Get event host as the actor for auto-close
    const event = db.prepare('SELECT host_user_id FROM events WHERE event_id = ?').get(eventId) as { host_user_id: string } | undefined;
    const actorUserId = event?.host_user_id || 'system';

    // Use recordDecision for full side-effect chain
    const result = recordDecision({
        eventId,
        problemId: ctx.current_problem_id,
        decisionType: closeDecision,
        actorUserId,
        rationale: 'Timer expired (auto-closed)'
    });

    return result.success;
}

export function recordDecision(params: RecordDecisionParams): RecordDecisionResult {
    const db = getDatabase();

    try {
        return db.transaction(() => {
            const now = nowIso();

            // 1. Fetch problem
            const problem = db.prepare(`
				SELECT current_readiness_state, current_action_state, current_major_version
				FROM problems WHERE problem_id = ?
			`).get(params.problemId) as any;

            if (!problem) {
                throw new Error("Problem not found");
            }

            // 2. Fetch decision_state_effects
            const effects = db.prepare(`
				SELECT new_readiness_state, new_action_state, new_live_mode
				FROM decision_state_effects WHERE decision_type = ?
			`).get(params.decisionType) as any;

            if (!effects) {
                throw new Error(`Invalid decision type: ${params.decisionType}`);
            }

            // Ensure event live context exists
            ensureLiveContext(params.eventId);
            const currentContext = db.prepare('SELECT * FROM event_live_context WHERE event_id = ?').get(params.eventId) as any;

            let autoClosedDecisionId: string | undefined;

            // 4. Auto-close (S8) for Opened Pitch
            if (params.decisionType === 'opened_for_pitch_assessment') {
                if (currentContext.current_mode === 'pitch' && currentContext.current_problem_id !== params.problemId) {
                    // Auto close the previous pitch
                    autoClosedDecisionId = generateId();
                    db.prepare(`
						INSERT INTO decisions (decision_id, problem_id, major_version, event_id, decision_type, is_binding, actor_user_id, rationale, created_at)
						VALUES (?, ?, (SELECT current_major_version FROM problems WHERE problem_id = ?), ?, 'closed_for_pitch_assessment', 1, ?, 'Auto-closed to open new pitch', ?)
					`).run(autoClosedDecisionId, currentContext.current_problem_id, currentContext.current_problem_id, params.eventId, params.actorUserId, now);

                    // Close assessment
                    db.prepare(`
						UPDATE assessments 
						SET closed_at = ? 
						WHERE problem_id = ? AND inventory_id = ? AND event_id = ? AND closed_at IS NULL
					`).run(now, currentContext.current_problem_id, PITCH_INVENTORY_ID, params.eventId);
                }
            }

            // 5. INSERT new decision
            const decisionId = generateId();
            db.prepare(`
				INSERT INTO decisions (decision_id, problem_id, major_version, event_id, decision_type, is_binding, actor_user_id, rationale, created_at)
				VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)
			`).run(decisionId, params.problemId, problem.current_major_version, params.eventId, params.decisionType, params.actorUserId, params.rationale || null, now);

            // 6. Apply state effects
            if (effects.new_readiness_state || effects.new_action_state) {
                const readiness = effects.new_readiness_state || problem.current_readiness_state;
                const action = effects.new_action_state || problem.current_action_state;
                db.prepare(`
					UPDATE problems SET current_readiness_state = ?, current_action_state = ? WHERE problem_id = ?
				`).run(readiness, action, params.problemId);
            }

            // 6b. Safety: if ejecting the currently active problem, force live context to idle
            if (EJECTION_DECISIONS.has(params.decisionType as DecisionTypeKey)
                && currentContext.current_problem_id === params.problemId
                && currentContext.current_mode !== 'idle') {
                db.prepare(`
                    UPDATE event_live_context
                    SET current_mode = 'idle', current_problem_id = NULL,
                        timer_duration_minutes = NULL, timer_ends_at = NULL, updated_at = ?
                    WHERE event_id = ?
                `).run(now, params.eventId);

                // Close any open assessment for this problem at this event
                db.prepare(`
                    UPDATE assessments SET closed_at = ?
                    WHERE problem_id = ? AND event_id = ? AND closed_at IS NULL
                `).run(now, params.problemId, params.eventId);
            }

            // 7. Live context update
            if (effects.new_live_mode) {
                if (effects.new_live_mode === 'idle') {
                    db.prepare(`
						UPDATE event_live_context 
						SET current_mode = 'idle', current_problem_id = NULL, timer_duration_minutes = NULL, timer_ends_at = NULL, updated_at = ?
						WHERE event_id = ?
					`).run(now, params.eventId);
                } else {
                    let timerEndsAt = null;
                    if (params.timerDurationMinutes) {
                        const expiryDate = new Date();
                        expiryDate.setMinutes(expiryDate.getMinutes() + params.timerDurationMinutes);
                        timerEndsAt = expiryDate.toISOString();
                    }

                    db.prepare(`
						UPDATE event_live_context 
						SET current_mode = ?, current_problem_id = ?, mode_opened_at = ?, timer_duration_minutes = ?, timer_ends_at = ?, updated_at = ?
						WHERE event_id = ?
					`).run(effects.new_live_mode, params.problemId, now, params.timerDurationMinutes || null, timerEndsAt, now, params.eventId);
                }
            }

            // 8 & 9. Assessment creation and closing
            let assessmentId: string | undefined;
            if (params.decisionType === 'opened_for_pitch_assessment') {
                assessmentId = generateId();
                db.prepare(`
					INSERT INTO assessments (assessment_id, problem_id, major_version, inventory_id, event_id, opened_at)
					VALUES (?, ?, ?, ?, ?, ?)
				`).run(assessmentId, params.problemId, problem.current_major_version, PITCH_INVENTORY_ID, params.eventId, now);
            } else if (params.decisionType === 'opened_for_review') {
                assessmentId = generateId();
                db.prepare(`
					INSERT INTO assessments (assessment_id, problem_id, major_version, inventory_id, event_id, opened_at)
					VALUES (?, ?, ?, ?, ?, ?)
				`).run(assessmentId, params.problemId, problem.current_major_version, REVIEW_INVENTORY_ID, params.eventId, now);
            } else if (params.decisionType === 'closed_for_pitch_assessment') {
                db.prepare(`
					UPDATE assessments SET closed_at = ? WHERE problem_id = ? AND inventory_id = ? AND event_id = ? AND closed_at IS NULL
				`).run(now, params.problemId, PITCH_INVENTORY_ID, params.eventId);
            } else if (params.decisionType === 'closed_for_review') {
                db.prepare(`
					UPDATE assessments SET closed_at = ? WHERE problem_id = ? AND inventory_id = ? AND event_id = ? AND closed_at IS NULL
				`).run(now, params.problemId, REVIEW_INVENTORY_ID, params.eventId);
            }

            // 10. Queue sync (Ch.19 §19.3.20 ejection cleanup invariant)
            if (params.decisionType === 'selected_for_event') {
                addToQueue(params.eventId, params.problemId);
            } else if (EJECTION_DECISIONS.has(params.decisionType as DecisionTypeKey)) {
                removeFromQueueRaw(params.eventId, params.problemId);
            } else if (CLOSING_DECISIONS.has(params.decisionType as DecisionTypeKey)) {
                updateQueueState(params.eventId, params.problemId, 'completed');
            } else if (params.decisionType === 'selected_for_coding') {
                updateQueueState(params.eventId, params.problemId, 'selected_for_coding');
            }

            return {
                success: true,
                decision_id: decisionId,
                auto_closed_decision_id: autoClosedDecisionId,
                assessment_id: assessmentId,
                new_readiness_state: effects.new_readiness_state,
                new_action_state: effects.new_action_state,
                new_live_mode: effects.new_live_mode
            };
        })();
    } catch (err: any) {
        console.error("Error recording decision:", err);
        return { success: false, error: err.message };
    }
}
