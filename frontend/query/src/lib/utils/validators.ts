import { z } from 'zod';

export const RoleSchema = z.enum(['problem_owner', 'developer', 'observer']);
export type Role = z.infer<typeof RoleSchema>;

export const TimeContextSchema = z.enum([
	'pre_event',
	'pitch',
	'review',
	'post_event',
	'late_reflection'
]);
export type TimeContext = z.infer<typeof TimeContextSchema>;

export const ResponseItemSchema = z.object({
	item_id: z.string().uuid(),
	rating_value: z.number().int().min(1).max(5) // Unified 5-point scale per Ch.7.3
});

export const SubmitResponsesSchema = z.object({
	session_hash: z.string().min(8), // Relaxed for dev (fallback hashes are shorter)
	role: RoleSchema,
	time_context: TimeContextSchema,
	in_presence: z.boolean(),
	responses: z.array(ResponseItemSchema)
});

export type SubmitResponsesPayload = z.infer<typeof SubmitResponsesSchema>;

export const ScaleHeaderSchema = z.object({
	rating_value: z.number().int(),
	label: z.string()
});

export const ItemRowSchema = z.object({
	position_index: z.number().int(),
	item_id: z.string().uuid(),
	item_key: z.string(),
	short_label: z.string(),
	full_text: z.string(),
	max_rating: z.number().int().positive(),
	current_rating: z.number().int().nullable()
});

export const MatrixSchema = z.object({
	max_rating: z.number().int().positive(),
	common_headers: z.array(ScaleHeaderSchema),
	rows: z.array(ItemRowSchema)
});

export const RenderStructureSchema = z.object({
	assessment_id: z.string(),
	inventory_id: z.string(),
	inventory_key: z.string(),
	inventory_name: z.string(),
	problem_id: z.string().nullable(),
	problem_title: z.string(),
	major_version: z.number().int().nullable(),
	time_context: TimeContextSchema,
	is_open: z.boolean(),
	render_type: z.enum(['single_matrix', 'mixed_matrices']),
	matrix: MatrixSchema
});

export type RenderStructure = z.infer<typeof RenderStructureSchema>;
export type Matrix = z.infer<typeof MatrixSchema>;
export type ItemRow = z.infer<typeof ItemRowSchema>;
export type ScaleHeader = z.infer<typeof ScaleHeaderSchema>;
