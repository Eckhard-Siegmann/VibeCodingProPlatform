/**
 * Recognition repository — contributor points, star awards, milestones.
 * Ticket: TICKET-14
 * Spec: Ch.33.6, Ch.17.9, Ch.19.3.35–19.3.42
 * Design: frontend/pagedesign/recognition_design.md
 */

import { getDatabase, generateId, nowIso } from '../db';

// ── Types ────────────────────────────────────────────────────────────────────

export interface ContributionBreakdownRow {
	actionKey: string;
	displayName: string;
	totalPoints: number;
}

export interface StarAwardRow {
	place: number;
	starsAwarded: number;
	problemTitle: string;
	problemSlug: string;
	eventName: string;
	awardedAt: string;
}

export interface PersonalContributions {
	allTimePoints: number;
	recentPoints: number; // last 6 weeks
	allTimeStars: number;
	breakdown: ContributionBreakdownRow[];
	recentAwards: StarAwardRow[];
}

export interface ReviewScoreRow {
	problemId: string;
	problemTitle: string;
	problemSlug: string;
	teamMembers: string; // comma-separated display_names
	weightedScore: number | null; // null = no review responses yet
	responseCount: number;
}

export interface ExistingStarAward {
	awardId: string;
	problemId: string;
	problemTitle: string;
	userId: string;
	userDisplayName: string;
	place: number;
	starsAwarded: number;
	awardedByDisplayName: string;
	awardedAt: string;
}

export interface MilestoneResult {
	key: string;
	title: string;
	message: string;
}

// ── Milestone toast copy ─────────────────────────────────────────────────────

const MILESTONE_MESSAGES: Record<string, { title: string; message: string }> = {
	first_problem_submitted: {
		title: 'First problem submitted!',
		message: 'Moderators will review soon.'
	},
	first_problem_accepted: {
		title: 'Problem accepted!',
		message: 'Your problem is ready for pitching.'
	},
	first_assessment_completed: {
		title: 'First rating submitted!',
		message: 'Your input shapes decisions.'
	},
	first_team_joined: {
		title: "You're on the team!",
		message: 'Check the chat to connect.'
	},
	first_event_attended: {
		title: 'Welcome to the community!',
		message: 'Great to have you here.'
	},
	first_lesson_learned: {
		title: 'Insight captured!',
		message: 'Others can learn from this.'
	},
	first_star_earned: {
		title: 'First star earned!',
		message: 'Outstanding solution — well done.'
	}
};

// ── Point awarding ────────────────────────────────────────────────────────────

/**
 * Award contribution points to a user for a qualifying action.
 * Idempotent: the UNIQUE constraint on (user_id, action_key, source_type, source_id)
 * silently ignores duplicate awards.
 *
 * Returns true if points were awarded, false if already awarded (duplicate).
 */
export function awardContributionPoints(
	userId: string,
	actionKey: string,
	sourceType: string,
	sourceId: string,
	eventId: string | null = null
): boolean {
	const db = getDatabase();

	// Snapshot current_points at award time (immune to later admin changes)
	const catalog = db
		.prepare(
			`SELECT current_points, is_active FROM contribution_action_catalog WHERE action_key = ?`
		)
		.get(actionKey) as { current_points: number; is_active: number } | undefined;

	if (!catalog || !catalog.is_active || catalog.current_points <= 0) {
		return false;
	}

	try {
		db.prepare(
			`INSERT INTO contribution_points
        (contribution_id, user_id, action_key, points_awarded, source_type, source_id, event_id, awarded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			generateId(),
			userId,
			actionKey,
			catalog.current_points,
			sourceType,
			sourceId,
			eventId,
			nowIso()
		);
		return true;
	} catch (e: unknown) {
		// UNIQUE constraint violation = already awarded — that's fine
		if (e instanceof Error && e.message.includes('UNIQUE constraint failed')) {
			return false;
		}
		throw e;
	}
}

// ── Milestone tracking ────────────────────────────────────────────────────────

/**
 * Record a first-time milestone for a user if not already achieved.
 * Returns the milestone toast payload if this is the first time,
 * or null if it was already recorded.
 */
export function checkAndAwardMilestone(
	userId: string,
	milestoneKey: string,
	contextId: string | null = null,
	contextType: string | null = null
): MilestoneResult | null {
	const db = getDatabase();

	// Check if already achieved
	const existing = db
		.prepare(`SELECT milestone_id FROM user_milestones WHERE user_id = ? AND milestone_key = ?`)
		.get(userId, milestoneKey);

	if (existing) {
		return null;
	}

	// Record the milestone
	try {
		db.prepare(
			`INSERT INTO user_milestones (milestone_id, user_id, milestone_key, achieved_at, context_id, context_type)
       VALUES (?, ?, ?, ?, ?, ?)`
		).run(generateId(), userId, milestoneKey, nowIso(), contextId, contextType);
	} catch (e: unknown) {
		// Race condition: another request beat us to it
		if (e instanceof Error && e.message.includes('UNIQUE constraint failed')) {
			return null;
		}
		throw e;
	}

	const copy = MILESTONE_MESSAGES[milestoneKey];
	if (!copy) return null;

	return { key: milestoneKey, ...copy };
}

// ── Personal contributions ────────────────────────────────────────────────────

/**
 * Get personal contribution summary for the dashboard.
 * Shows all-time totals, 6-week recent totals, breakdown by action, recent awards.
 */
export function getPersonalContributions(userId: string): PersonalContributions {
	const db = getDatabase();
	const sixWeeksAgo = new Date(Date.now() - 42 * 24 * 60 * 60 * 1000).toISOString();

	const allTimePoints = (
		db
			.prepare(`SELECT COALESCE(SUM(points_awarded), 0) AS total FROM contribution_points WHERE user_id = ?`)
			.get(userId) as { total: number }
	).total;

	const recentPoints = (
		db
			.prepare(
				`SELECT COALESCE(SUM(points_awarded), 0) AS total
         FROM contribution_points
         WHERE user_id = ? AND awarded_at >= ?`
			)
			.get(userId, sixWeeksAgo) as { total: number }
	).total;

	const allTimeStars = (
		db
			.prepare(`SELECT COALESCE(SUM(stars_awarded), 0) AS total FROM star_awards WHERE user_id = ?`)
			.get(userId) as { total: number }
	).total;

	// Breakdown by action (only actions with > 0 points)
	const breakdown = db
		.prepare(
			`SELECT
        cp.action_key AS actionKey,
        cac.display_name AS displayName,
        SUM(cp.points_awarded) AS totalPoints
       FROM contribution_points cp
       JOIN contribution_action_catalog cac ON cac.action_key = cp.action_key
       WHERE cp.user_id = ?
       GROUP BY cp.action_key, cac.display_name
       ORDER BY totalPoints DESC`
		)
		.all(userId) as ContributionBreakdownRow[];

	// Recent awards (last 5)
	const recentAwards = db
		.prepare(
			`SELECT
        sa.place,
        sa.stars_awarded AS starsAwarded,
        pv.title AS problemTitle,
        p.public_slug AS problemSlug,
        e.title AS eventName,
        sa.awarded_at AS awardedAt
       FROM star_awards sa
       JOIN problems p ON p.problem_id = sa.problem_id
       JOIN problem_versions pv ON pv.problem_id = p.problem_id AND pv.is_current = 1
       JOIN events e ON e.event_id = sa.event_id
       WHERE sa.user_id = ?
       ORDER BY sa.awarded_at DESC
       LIMIT 5`
		)
		.all(userId) as StarAwardRow[];

	return { allTimePoints, recentPoints, allTimeStars, breakdown, recentAwards };
}

// ── Star award score aggregation ──────────────────────────────────────────────

/**
 * Get weighted review scores for all coded problems at an event.
 * Used by the moderator to rank solutions for star awards.
 *
 * Formula (Ch.33.6.4):
 *   weighted_score = Σ(rating_value × weight_multiplier) / Σ(weight_multiplier)
 *   over all non-NULL rating_value responses in current (non-superseded) review
 *   assessments for that problem at that event, where review_weight_key IS NOT NULL.
 */
export function getReviewScoresForEvent(eventId: string): ReviewScoreRow[] {
	const db = getDatabase();

	// Find all problems that have a closed review assessment at this event
	// and join to get team members + weighted scores
	const rows = db
		.prepare(
			`SELECT
        p.problem_id AS problemId,
        pv.title AS problemTitle,
        p.public_slug AS problemSlug,
        GROUP_CONCAT(DISTINCT u.display_name) AS teamMembers,
        -- Weighted average: Σ(rating × weight) / Σ(weight)
        CASE
          WHEN SUM(rwc.weight_multiplier) > 0
          THEN ROUND(
            SUM(r.rating_value * rwc.weight_multiplier) * 1.0
            / SUM(rwc.weight_multiplier),
            2
          )
          ELSE NULL
        END AS weightedScore,
        COUNT(DISTINCT r.response_id) AS responseCount
       FROM problems p
       JOIN problem_versions pv ON pv.problem_id = p.problem_id AND pv.is_current = 1
       -- Must have a closed review assessment for this event
       JOIN assessments a ON a.problem_id = p.problem_id
                          AND a.event_id = ?
                          AND a.closed_at IS NOT NULL
       -- Join responses (only current, with a review weight)
       LEFT JOIN responses r ON r.assessment_id = a.assessment_id
                             AND r.rating_value IS NOT NULL
                             AND r.review_weight_key IS NOT NULL
                             AND r.superseded_at IS NULL
       LEFT JOIN review_weight_catalog rwc ON rwc.weight_key = r.review_weight_key
                                          AND rwc.is_active = 1
       -- Team members
       LEFT JOIN problem_teams pt ON pt.problem_id = p.problem_id AND pt.event_id = ?
       LEFT JOIN problem_team_members ptm ON ptm.team_id = pt.team_id
       LEFT JOIN users u ON u.user_id = ptm.user_id
       GROUP BY p.problem_id, pv.title, p.public_slug
       ORDER BY weightedScore DESC NULLS LAST, responseCount DESC`
		)
		.all(eventId, eventId) as ReviewScoreRow[];

	return rows;
}

// ── Star awards CRUD ──────────────────────────────────────────────────────────

/**
 * Get existing star awards for an event.
 */
export function getEventStarAwards(eventId: string): ExistingStarAward[] {
	const db = getDatabase();

	return db
		.prepare(
			`SELECT
        sa.award_id AS awardId,
        sa.problem_id AS problemId,
        pv.title AS problemTitle,
        sa.user_id AS userId,
        u.display_name AS userDisplayName,
        sa.place,
        sa.stars_awarded AS starsAwarded,
        awarder.display_name AS awardedByDisplayName,
        sa.awarded_at AS awardedAt
       FROM star_awards sa
       JOIN users u ON u.user_id = sa.user_id
       JOIN users awarder ON awarder.user_id = sa.awarded_by_user_id
       JOIN problems p ON p.problem_id = sa.problem_id
       JOIN problem_versions pv ON pv.problem_id = p.problem_id AND pv.is_current = 1
       WHERE sa.event_id = ?
       ORDER BY sa.place ASC, sa.awarded_at ASC`
		)
		.all(eventId) as ExistingStarAward[];
}

/**
 * Award stars to all team members of a problem at an event.
 * Inserts one star_awards row per team member.
 * Idempotent per (problem_id, event_id, user_id) unique constraint.
 *
 * place: 1 (1st), 2 (2nd), 3 (3rd)
 * starsAwarded: 3 / 2 / 1 respectively
 *
 * Returns the list of user IDs that received awards (for milestone checking).
 */
export function awardStarsToTeam(
	awardedByUserId: string,
	problemId: string,
	eventId: string,
	place: 1 | 2 | 3
): string[] {
	const db = getDatabase();

	const starsAwarded = place === 1 ? 3 : place === 2 ? 2 : 1;
	const now = nowIso();

	// Get all team members for this problem at this event
	const members = db
		.prepare(
			`SELECT ptm.user_id
       FROM problem_team_members ptm
       JOIN problem_teams pt ON pt.team_id = ptm.team_id
       WHERE pt.problem_id = ? AND pt.event_id = ?`
		)
		.all(problemId, eventId) as { user_id: string }[];

	// Also include the problem owner if not already in team
	const problem = db
		.prepare(`SELECT created_by_user_id FROM problems WHERE problem_id = ?`)
		.get(problemId) as { created_by_user_id: string } | undefined;

	const userIds = new Set(members.map((m) => m.user_id));
	if (problem) {
		userIds.add(problem.created_by_user_id);
	}

	const awardedUserIds: string[] = [];

	const insertAward = db.prepare(
		`INSERT OR IGNORE INTO star_awards
      (award_id, user_id, problem_id, event_id, place, stars_awarded, awarded_by_user_id, awarded_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
	);

	for (const userId of userIds) {
		const result = insertAward.run(
			generateId(),
			userId,
			problemId,
			eventId,
			place,
			starsAwarded,
			awardedByUserId,
			now
		);
		if (result.changes > 0) {
			awardedUserIds.push(userId);
		}
	}

	return awardedUserIds;
}

/**
 * Award stars for multiple problems at once (full event star award confirmation).
 * Input: array of { problemId, place } — problems without a place entry are skipped.
 * Wraps all inserts in a single transaction.
 *
 * Returns milestone results for users who earned their first star.
 */
export function confirmEventStarAwards(
	awardedByUserId: string,
	eventId: string,
	awards: Array<{ problemId: string; place: 1 | 2 | 3 }>
): MilestoneResult[] {
	const db = getDatabase();
	const milestones: MilestoneResult[] = [];

	db.transaction(() => {
		for (const { problemId, place } of awards) {
			const awardedUserIds = awardStarsToTeam(awardedByUserId, problemId, eventId, place);

			// Check first_star_earned milestone for each newly awarded user
			for (const userId of awardedUserIds) {
				const ms = checkAndAwardMilestone(userId, 'first_star_earned', problemId, 'problem');
				if (ms) {
					milestones.push(ms);
				}
			}
		}
	})();

	return milestones;
}
