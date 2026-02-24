/**
 * Centralized decision type vocabulary.
 *
 * Mirrors the 26 entries in `decision_type_catalog` (seed_reference_data.sql).
 * All UI components and repository functions MUST import from here —
 * no inline string literals for decision types.
 *
 * See: Ch.19 §19.2.3 implementation requirement.
 */

// ── Union type of all decision type keys ────────────────────────────

export type DecisionTypeKey =
	// lifecycle (5)
	| 'problem_created'
	| 'problem_cloned'
	| 'problem_submitted'
	| 'problem_updated'
	| 'problem_archived'
	// quality_gate (3)
	| 'quality_gate_accepted'
	| 'quality_gate_rejected'
	| 'quality_gate_needs_changes'
	// planning (2)
	| 'selected_for_event'
	| 'deselected_for_event'
	// sprint (2)
	| 'selected_for_coding'
	| 'deselected_for_coding'
	// deferral (6)
	| 'deferred_po_absent'
	| 'deferred_low_priority'
	| 'deferred_skipped'
	| 'deferred_too_complex'
	| 'deferred_needs_refinement'
	| 'deferred_future_capability'
	// drop (2)
	| 'dropped_low_relevance'
	| 'dropped_low_quality'
	// close (2)
	| 'closed_complete'
	| 'closed_partial'
	// live (4)
	| 'opened_for_pitch_assessment'
	| 'closed_for_pitch_assessment'
	| 'opened_for_review'
	| 'closed_for_review';

// ── Category type ───────────────────────────────────────────────────

export type DecisionCategory =
	| 'lifecycle'
	| 'quality_gate'
	| 'planning'
	| 'sprint'
	| 'deferral'
	| 'drop'
	| 'close'
	| 'live';

// ── Per-type metadata ───────────────────────────────────────────────

export interface DecisionTypeMeta {
	key: DecisionTypeKey;
	displayName: string;
	category: DecisionCategory;
	requiresComment: boolean;
}

// ── Full catalog ────────────────────────────────────────────────────

export const DECISION_TYPES: Record<DecisionTypeKey, DecisionTypeMeta> = {
	// lifecycle
	problem_created: {
		key: 'problem_created',
		displayName: 'Problem Created',
		category: 'lifecycle',
		requiresComment: false
	},
	problem_cloned: {
		key: 'problem_cloned',
		displayName: 'Problem Cloned',
		category: 'lifecycle',
		requiresComment: false
	},
	problem_submitted: {
		key: 'problem_submitted',
		displayName: 'Problem Submitted',
		category: 'lifecycle',
		requiresComment: false
	},
	problem_updated: {
		key: 'problem_updated',
		displayName: 'Problem Updated',
		category: 'lifecycle',
		requiresComment: false
	},
	problem_archived: {
		key: 'problem_archived',
		displayName: 'Problem Archived',
		category: 'lifecycle',
		requiresComment: false
	},

	// quality_gate
	quality_gate_accepted: {
		key: 'quality_gate_accepted',
		displayName: 'Quality Gate Accepted',
		category: 'quality_gate',
		requiresComment: false
	},
	quality_gate_rejected: {
		key: 'quality_gate_rejected',
		displayName: 'Quality Gate Rejected',
		category: 'quality_gate',
		requiresComment: true
	},
	quality_gate_needs_changes: {
		key: 'quality_gate_needs_changes',
		displayName: 'Quality Gate Needs Changes',
		category: 'quality_gate',
		requiresComment: true
	},

	// planning
	selected_for_event: {
		key: 'selected_for_event',
		displayName: 'Selected for Event',
		category: 'planning',
		requiresComment: false
	},
	deselected_for_event: {
		key: 'deselected_for_event',
		displayName: 'Deselected for Event',
		category: 'planning',
		requiresComment: false
	},

	// sprint
	selected_for_coding: {
		key: 'selected_for_coding',
		displayName: 'Selected for Coding',
		category: 'sprint',
		requiresComment: false
	},
	deselected_for_coding: {
		key: 'deselected_for_coding',
		displayName: 'Deselected for Coding',
		category: 'sprint',
		requiresComment: false
	},

	// deferral
	deferred_po_absent: {
		key: 'deferred_po_absent',
		displayName: 'Deferred: PO Absent',
		category: 'deferral',
		requiresComment: false
	},
	deferred_low_priority: {
		key: 'deferred_low_priority',
		displayName: 'Deferred: Low Priority',
		category: 'deferral',
		requiresComment: false
	},
	deferred_skipped: {
		key: 'deferred_skipped',
		displayName: 'Deferred: Skipped',
		category: 'deferral',
		requiresComment: false
	},
	deferred_too_complex: {
		key: 'deferred_too_complex',
		displayName: 'Deferred: Too Complex',
		category: 'deferral',
		requiresComment: true
	},
	deferred_needs_refinement: {
		key: 'deferred_needs_refinement',
		displayName: 'Deferred: Needs Refinement',
		category: 'deferral',
		requiresComment: true
	},
	deferred_future_capability: {
		key: 'deferred_future_capability',
		displayName: 'Deferred: Future Capability',
		category: 'deferral',
		requiresComment: false
	},

	// drop
	dropped_low_relevance: {
		key: 'dropped_low_relevance',
		displayName: 'Dropped: Low Relevance',
		category: 'drop',
		requiresComment: false
	},
	dropped_low_quality: {
		key: 'dropped_low_quality',
		displayName: 'Dropped: Low Quality',
		category: 'drop',
		requiresComment: true
	},

	// close
	closed_complete: {
		key: 'closed_complete',
		displayName: 'Closed: Complete',
		category: 'close',
		requiresComment: false
	},
	closed_partial: {
		key: 'closed_partial',
		displayName: 'Closed: Partial',
		category: 'close',
		requiresComment: true
	},

	// live
	opened_for_pitch_assessment: {
		key: 'opened_for_pitch_assessment',
		displayName: 'Opened for Pitch',
		category: 'live',
		requiresComment: false
	},
	closed_for_pitch_assessment: {
		key: 'closed_for_pitch_assessment',
		displayName: 'Closed for Pitch',
		category: 'live',
		requiresComment: false
	},
	opened_for_review: {
		key: 'opened_for_review',
		displayName: 'Opened for Review',
		category: 'live',
		requiresComment: false
	},
	closed_for_review: {
		key: 'closed_for_review',
		displayName: 'Closed for Review',
		category: 'live',
		requiresComment: false
	}
} as const;

// ── Semantic groupings for code use ─────────────────────────────────

/** Decisions that remove a problem from the event queue (Ch.19 §19.3.20) */
export const EJECTION_DECISIONS: ReadonlySet<DecisionTypeKey> = new Set([
	'deselected_for_event',
	'quality_gate_rejected',
	'dropped_low_relevance',
	'dropped_low_quality'
]);

/** Decisions that transition queue_state to 'completed' */
export const CLOSING_DECISIONS: ReadonlySet<DecisionTypeKey> = new Set([
	'closed_complete',
	'closed_partial'
]);

/** The 4 live-mode decision types */
export const LIVE_DECISIONS: ReadonlySet<DecisionTypeKey> = new Set([
	'opened_for_pitch_assessment',
	'closed_for_pitch_assessment',
	'opened_for_review',
	'closed_for_review'
]);

/** Maps current_mode to the correct close decision type (Ch.14 §14.5.1.1) */
export const MODE_CLOSE_DECISION: Record<string, DecisionTypeKey> = {
	pitch: 'closed_for_pitch_assessment',
	review: 'closed_for_review'
};
