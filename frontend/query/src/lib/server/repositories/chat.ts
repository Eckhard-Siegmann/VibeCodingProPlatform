import { getDatabase, generateId, nowIso } from '../db';

// ============================================================================
// Types
// ============================================================================

export interface ChatMessage {
	message_id: string;
	user_id: string;
	author_display_name: string;
	author_role: string;
	problem_id: string | null;
	problem_version_id: string | null;
	major_version: number;
	minor_version: number | null;
	event_id: string | null;
	team_id: string | null;
	context_situation: string;
	content: string;
	reply_to_message_id: string | null;
	url_disclosed: boolean;
	valuable_insight: boolean;
	valuable_link: boolean;
	is_bot: boolean;
	visible: boolean;
	created_at: string;
	edited_at: string | null;
	// Aggregated from reactions
	reaction_summary?: ReactionSummary[];
}

export interface ReactionSummary {
	emoji: string;
	count: number;
	users: { user_id: string; display_name: string }[];
	user_reacted: boolean; // Did the current user react with this emoji?
}

export interface ChatReaction {
	reaction_id: string;
	message_id: string;
	user_id: string;
	emoji: string;
	created_at: string;
}

export interface EmojiOption {
	emoji: string;
	display_name: string;
}

export interface GetChatMessagesOptions {
	majorVersion?: number;
	includeAllVersions?: boolean;
	teamOnly?: boolean;
	limit?: number;
	currentUserId?: string; // For reaction user_reacted flag
}

// ============================================================================
// Row types (internal, for SQLite boolean conversion)
// ============================================================================

interface ChatMessageRow {
	message_id: string;
	user_id: string;
	author_display_name: string;
	author_role: string;
	problem_id: string | null;
	problem_version_id: string | null;
	major_version: number;
	minor_version: number | null;
	event_id: string | null;
	team_id: string | null;
	context_situation: string;
	content: string;
	reply_to_message_id: string | null;
	url_disclosed: number;
	valuable_insight: number;
	valuable_link: number;
	is_bot: number;
	visible: number;
	created_at: string;
	edited_at: string | null;
}

interface ReactionRow {
	emoji: string;
	user_id: string;
	display_name: string;
}

// ============================================================================
// URL Detection
// ============================================================================

const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^[\]`]+/gi;

export function detectUrl(content: string): boolean {
	return URL_REGEX.test(content);
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Get chat messages for a problem with optional filtering.
 */
export function getChatMessages(
	problemId: string,
	options: GetChatMessagesOptions = {}
): ChatMessage[] {
	const db = getDatabase();
	const { majorVersion, includeAllVersions, teamOnly, limit, currentUserId } = options;

	let whereClause = 'WHERE cm.problem_id = ? AND cm.visible = 1';
	const params: (string | number)[] = [problemId];

	// Version filtering
	if (!includeAllVersions && majorVersion !== undefined) {
		whereClause += ' AND cm.major_version = ?';
		params.push(majorVersion);
	}

	// Team-only filtering
	if (teamOnly) {
		whereClause += ' AND cm.team_id IS NOT NULL';
	}

	const query = `
		SELECT
			cm.message_id,
			cm.user_id,
			u.display_name as author_display_name,
			cm.author_role,
			cm.problem_id,
			cm.problem_version_id,
			cm.major_version,
			cm.minor_version,
			cm.event_id,
			cm.team_id,
			cm.context_situation,
			cm.content,
			cm.reply_to_message_id,
			cm.url_disclosed,
			cm.valuable_insight,
			cm.valuable_link,
			cm.is_bot,
			cm.visible,
			cm.created_at,
			cm.edited_at
		FROM chat_messages cm
		JOIN users u ON cm.user_id = u.user_id
		${whereClause}
		ORDER BY cm.created_at ASC
		${limit ? `LIMIT ${limit}` : ''}
	`;

	const rows = db.prepare(query).all(...params) as ChatMessageRow[];

	const messages = rows.map((row) => convertRowToMessage(row));

	// Load reactions for all messages
	if (messages.length > 0) {
		const messageIds = messages.map((m) => m.message_id);
		const reactionsByMessage = getReactionsForMessages(messageIds, currentUserId);

		for (const message of messages) {
			message.reaction_summary = reactionsByMessage.get(message.message_id) ?? [];
		}
	}

	return messages;
}

/**
 * Get a single chat message by ID.
 */
export function getChatMessage(messageId: string): ChatMessage | null {
	const db = getDatabase();

	const row = db
		.prepare(
			`
		SELECT
			cm.message_id,
			cm.user_id,
			u.display_name as author_display_name,
			cm.author_role,
			cm.problem_id,
			cm.problem_version_id,
			cm.major_version,
			cm.minor_version,
			cm.event_id,
			cm.team_id,
			cm.context_situation,
			cm.content,
			cm.reply_to_message_id,
			cm.url_disclosed,
			cm.valuable_insight,
			cm.valuable_link,
			cm.is_bot,
			cm.visible,
			cm.created_at,
			cm.edited_at
		FROM chat_messages cm
		JOIN users u ON cm.user_id = u.user_id
		WHERE cm.message_id = ?
	`
		)
		.get(messageId) as ChatMessageRow | undefined;

	return row ? convertRowToMessage(row) : null;
}

/**
 * Get reactions for multiple messages, grouped by message_id.
 */
function getReactionsForMessages(
	messageIds: string[],
	currentUserId?: string
): Map<string, ReactionSummary[]> {
	const db = getDatabase();

	const placeholders = messageIds.map(() => '?').join(',');
	const rows = db
		.prepare(
			`
		SELECT
			cr.message_id,
			cr.emoji,
			cr.user_id,
			u.display_name
		FROM chat_reactions cr
		JOIN users u ON cr.user_id = u.user_id
		WHERE cr.message_id IN (${placeholders})
		ORDER BY cr.created_at ASC
	`
		)
		.all(...messageIds) as (ReactionRow & { message_id: string })[];

	// Group by message_id, then by emoji
	const result = new Map<string, ReactionSummary[]>();

	for (const messageId of messageIds) {
		const messageReactions = rows.filter((r) => r.message_id === messageId);
		const emojiMap = new Map<
			string,
			{ emoji: string; users: { user_id: string; display_name: string }[] }
		>();

		for (const reaction of messageReactions) {
			if (!emojiMap.has(reaction.emoji)) {
				emojiMap.set(reaction.emoji, { emoji: reaction.emoji, users: [] });
			}
			emojiMap.get(reaction.emoji)!.users.push({
				user_id: reaction.user_id,
				display_name: reaction.display_name
			});
		}

		const summaries: ReactionSummary[] = Array.from(emojiMap.values()).map((entry) => ({
			emoji: entry.emoji,
			count: entry.users.length,
			users: entry.users,
			user_reacted: currentUserId ? entry.users.some((u) => u.user_id === currentUserId) : false
		}));

		result.set(messageId, summaries);
	}

	return result;
}

/**
 * Get available emojis for reactions.
 */
export function getAvailableEmojis(): EmojiOption[] {
	const db = getDatabase();

	return db
		.prepare(
			`
		SELECT emoji, display_name
		FROM emoji_catalog
		WHERE is_active = 1
		ORDER BY sort_order ASC
	`
		)
		.all() as EmojiOption[];
}

// ============================================================================
// Mutation Functions
// ============================================================================

/**
 * Post a new chat message.
 */
export function postChatMessage(data: {
	userId: string;
	userRole: string;
	problemId: string;
	problemVersionId: string;
	majorVersion: number;
	minorVersion?: number | null;
	eventId?: string | null;
	teamId?: string | null;
	contextSituation: string;
	content: string;
	replyToMessageId?: string | null;
	isBot?: boolean;
}): { success: boolean; message_id: string } {
	const db = getDatabase();
	const messageId = generateId();
	const now = nowIso();

	// Enforce max length
	if (data.content.length > 2000) {
		throw new Error('Message content exceeds 2000 character limit');
	}

	const urlDisclosed = detectUrl(data.content) ? 1 : 0;

	db.prepare(
		`
		INSERT INTO chat_messages (
			message_id, user_id, problem_id, problem_version_id,
			major_version, minor_version, event_id, team_id,
			context_situation, content, reply_to_message_id,
			url_disclosed, valuable_insight, valuable_link,
			is_bot, author_role, visible, created_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, 1, ?)
	`
	).run(
		messageId,
		data.userId,
		data.problemId,
		data.problemVersionId,
		data.majorVersion,
		data.minorVersion ?? null,
		data.eventId ?? null,
		data.teamId ?? null,
		data.contextSituation,
		data.content,
		data.replyToMessageId ?? null,
		urlDisclosed,
		data.isBot ? 1 : 0,
		data.userRole,
		now
	);

	return { success: true, message_id: messageId };
}

/**
 * Post a system message (is_bot = true).
 */
export function postSystemMessage(data: {
	problemId: string;
	problemVersionId: string;
	majorVersion: number;
	eventId?: string | null;
	teamId?: string | null;
	contextSituation: string;
	content: string;
	botUserId: string;
	botRole: string;
}): { success: boolean; message_id: string } {
	return postChatMessage({
		userId: data.botUserId,
		userRole: data.botRole,
		problemId: data.problemId,
		problemVersionId: data.problemVersionId,
		majorVersion: data.majorVersion,
		eventId: data.eventId,
		teamId: data.teamId,
		contextSituation: data.contextSituation,
		content: data.content,
		isBot: true
	});
}

/**
 * Edit a chat message (only allowed within 15 minutes of creation).
 */
export function editChatMessage(
	messageId: string,
	newContent: string,
	userId: string
): { success: boolean; error?: string } {
	const db = getDatabase();

	// Enforce max length
	if (newContent.length > 2000) {
		return { success: false, error: 'Message content exceeds 2000 character limit' };
	}

	// Get the message
	const message = getChatMessage(messageId);
	if (!message) {
		return { success: false, error: 'Message not found' };
	}

	// Check ownership
	if (message.user_id !== userId) {
		return { success: false, error: 'Not authorized to edit this message' };
	}

	// Check time window (15 minutes)
	const createdAt = new Date(message.created_at);
	const now = new Date();
	const minutesElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60);

	if (minutesElapsed > 15) {
		return { success: false, error: 'Edit window expired (15 minutes)' };
	}

	// Update
	const urlDisclosed = detectUrl(newContent) ? 1 : 0;

	db.prepare(
		`
		UPDATE chat_messages
		SET content = ?, url_disclosed = ?, edited_at = ?
		WHERE message_id = ?
	`
	).run(newContent, urlDisclosed, nowIso(), messageId);

	return { success: true };
}

/**
 * Soft delete a chat message.
 */
export function softDeleteMessage(
	messageId: string,
	userId: string,
	isModerator: boolean
): { success: boolean; error?: string } {
	const db = getDatabase();

	// Get the message
	const message = getChatMessage(messageId);
	if (!message) {
		return { success: false, error: 'Message not found' };
	}

	// Check authorization (owner or moderator)
	if (message.user_id !== userId && !isModerator) {
		return { success: false, error: 'Not authorized to delete this message' };
	}

	db.prepare(
		`
		UPDATE chat_messages
		SET visible = 0
		WHERE message_id = ?
	`
	).run(messageId);

	return { success: true };
}

/**
 * Add a reaction to a message.
 */
export function addReaction(
	messageId: string,
	userId: string,
	emoji: string
): { success: boolean; error?: string } {
	const db = getDatabase();
	const reactionId = generateId();
	const now = nowIso();

	try {
		db.prepare(
			`
			INSERT INTO chat_reactions (reaction_id, message_id, user_id, emoji, created_at)
			VALUES (?, ?, ?, ?, ?)
		`
		).run(reactionId, messageId, userId, emoji, now);

		return { success: true };
	} catch (error) {
		// Unique constraint violation = already reacted with this emoji
		if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
			return { success: false, error: 'Already reacted with this emoji' };
		}
		throw error;
	}
}

/**
 * Remove a reaction from a message.
 */
export function removeReaction(
	messageId: string,
	userId: string,
	emoji: string
): { success: boolean } {
	const db = getDatabase();

	const result = db
		.prepare(
			`
		DELETE FROM chat_reactions
		WHERE message_id = ? AND user_id = ? AND emoji = ?
	`
		)
		.run(messageId, userId, emoji);

	return { success: result.changes > 0 };
}

/**
 * Toggle valuable_insight flag on a message.
 */
export function toggleValuableInsight(
	messageId: string,
	userId: string,
	isModerator: boolean
): { success: boolean; error?: string; new_value?: boolean } {
	const db = getDatabase();

	const message = getChatMessage(messageId);
	if (!message) {
		return { success: false, error: 'Message not found' };
	}

	// Only author or moderator can toggle
	if (message.user_id !== userId && !isModerator) {
		return { success: false, error: 'Not authorized' };
	}

	const newValue = message.valuable_insight ? 0 : 1;

	db.prepare(
		`
		UPDATE chat_messages
		SET valuable_insight = ?
		WHERE message_id = ?
	`
	).run(newValue, messageId);

	return { success: true, new_value: Boolean(newValue) };
}

/**
 * Toggle valuable_link flag on a message.
 */
export function toggleValuableLink(
	messageId: string,
	userId: string,
	isModerator: boolean
): { success: boolean; error?: string; new_value?: boolean } {
	const db = getDatabase();

	const message = getChatMessage(messageId);
	if (!message) {
		return { success: false, error: 'Message not found' };
	}

	// Only author or moderator can toggle
	if (message.user_id !== userId && !isModerator) {
		return { success: false, error: 'Not authorized' };
	}

	const newValue = message.valuable_link ? 0 : 1;

	db.prepare(
		`
		UPDATE chat_messages
		SET valuable_link = ?
		WHERE message_id = ?
	`
	).run(newValue, messageId);

	return { success: true, new_value: Boolean(newValue) };
}

// ============================================================================
// Helper Functions
// ============================================================================

function convertRowToMessage(row: ChatMessageRow): ChatMessage {
	return {
		...row,
		url_disclosed: Boolean(row.url_disclosed),
		valuable_insight: Boolean(row.valuable_insight),
		valuable_link: Boolean(row.valuable_link),
		is_bot: Boolean(row.is_bot),
		visible: Boolean(row.visible)
	};
}
