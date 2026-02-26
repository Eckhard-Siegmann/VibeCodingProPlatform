import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	findProblemBySlug,
	getProblemVersions,
	getCurrentVersion,
	getAssessmentsForProblem,
	getDecisionHistory,
	getLatestSnapshot
} from '$lib/server/repositories/problems';
import { getTeam, getTeamMembers, isTeamMember } from '$lib/server/repositories/teams';
import { getResourcesForProblem } from '$lib/server/repositories/resources';
import { getChatMessages } from '$lib/server/repositories/chat';
import { getLessonsForProblem } from '$lib/server/repositories/lessons';
import { getLiveContext } from '$lib/server/repositories/events';
import { getDatabase } from '$lib/server/db';
import { getAuthenticatedUser, canAccessPrivateView, isDeputyOwner } from '$lib/server/auth';

export const load: PageServerLoad = async ({ params, url, cookies }) => {
	const { slug } = params;
	const db = getDatabase();

	// Get authenticated user from session (falls back to demo user in dev)
	const user = getAuthenticatedUser(cookies);

	// Find problem by slug (determines view type)
	const problem = findProblemBySlug(slug);

	if (!problem) {
		throw error(404, 'Problem not found');
	}

	// If private slug but user cannot access private view, redirect to public view
	if (problem.view_type === 'private' && !canAccessPrivateView(cookies, problem.created_by_user_id, problem.deputy_owner_user_id)) {
		throw redirect(302, `/problem/${problem.public_slug}`);
	}

	// Get version data
	const versions = getProblemVersions(problem.problem_id);
	const currentVersion = getCurrentVersion(problem.problem_id);

	if (!currentVersion) {
		throw error(500, 'Problem has no current version');
	}

	// Check for version query param (archive mode)
	const selectedVersionParam = url.searchParams.get('v');
	const selectedMajorVersion = selectedVersionParam
		? parseInt(selectedVersionParam, 10)
		: problem.current_major_version;

	// Get the selected version (or current if not specified/invalid)
	let selectedVersion =
		versions.find((v) => v.major_version === selectedMajorVersion) ?? currentVersion;

	// If the selected version doesn't exist, fall back to current
	if (!selectedVersion) {
		selectedVersion = currentVersion;
	}

	const isArchivedView = selectedMajorVersion !== problem.current_major_version;

	// Get assessments, decision history, resources, and snapshot
	const assessments = getAssessmentsForProblem(problem.problem_id);
	const decisions = getDecisionHistory(problem.problem_id);

	// Resources (Ch.6.2, Ch.13.1)
	const allResources = getResourcesForProblem(problem.problem_id);
	const directResources = allResources
		.filter((r) => r.resource_type === 'direct')
		.map((r) => ({
			resourceId: r.resource_id,
			label: r.title,
			url: r.url,
			resourceType: r.resource_type as 'direct' | 'helpful',
			isPending: !r.approved,
			suggestedBy: !r.approved ? r.added_by_display_name : undefined
		}));
	const helpfulResources = allResources
		.filter((r) => r.resource_type === 'helpful')
		.map((r) => ({
			resourceId: r.resource_id,
			label: r.title,
			url: r.url,
			resourceType: r.resource_type as 'direct' | 'helpful',
			isPending: !r.approved,
			suggestedBy: !r.approved ? r.added_by_display_name : undefined
		}));

	// Latest repo snapshot (Ch.5.2)
	const latestSnapshot = getLatestSnapshot(problem.problem_id, selectedMajorVersion);

	// Compute visibility flags — gated on identity, not URL slug (Ch.13.2)
	const readinessState = problem.current_readiness_state;
	const isOwner = user.user_id === problem.created_by_user_id;
	const isDeputy = isDeputyOwner(user.user_id, problem.deputy_owner_user_id);
	const elevated = isOwner || isDeputy;
	const userRoleRecord = db.prepare('SELECT role FROM users WHERE user_id = ?').get(user.user_id) as any;
	const isModerator = userRoleRecord?.role === 'moderator' || userRoleRecord?.role === 'admin';

	// ── Team data (Ch.13.3, Ch.31.7) ──────────────────────────────────
	const eventId = 'event-feb-2026';
	const team = getTeam(problem.problem_id, eventId);

	let teamMembers: Array<{
		userId: string;
		displayName: string;
		memberRole: 'po' | 'po_deputy' | 'coder';
		status: 'active' | 'retired';
	}> = [];
	let breakoutUrl: string | null = null;
	let userMembership: ReturnType<typeof isTeamMember> = null;

	if (team) {
		// Load members for the selected version (shows both active + retired)
		const repoMembers = getTeamMembers(team.team_id, selectedVersion.problem_version_id);
		teamMembers = repoMembers.map((m) => ({
			userId: m.user_id,
			displayName: m.display_name,
			memberRole: m.member_role,
			status: m.status
		}));
		breakoutUrl = team.breakout_room_url;
		userMembership = isTeamMember(team.team_id, user.user_id, selectedVersion.problem_version_id);
	}

	const isActiveMember = userMembership?.status === 'active';
	const isMember = userMembership !== null;
	const actionState = problem.current_action_state;

	// Ch.13.4: "Join as Dev" visible when authenticated + not active member + selected_for_coding + not archived
	const canJoinTeam =
		!isActiveMember &&
		!isArchivedView &&
		(actionState === 'selected_for_coding' || actionState === 'selected_for_event');

	// Ch.31.7: Any active team member can edit breakout URL
	const canEditBreakout = isActiveMember && !isArchivedView;

	// Ch.31.7: Moderator joining as coder loses moderator powers for this problem
	const effectiveModerator = isModerator && !(userMembership?.member_role === 'coder');

	// Resource permissions (Ch.6.2)
	const canAddResources = (elevated || isActiveMember || isModerator) && !isArchivedView;
	const canEditResources = elevated && !isArchivedView;
	const canSuggestResources = !elevated && !isActiveMember && !isModerator && !isArchivedView;
	const canApproveResources = elevated && !isArchivedView;

	const flags = {
		showOwnerBanner: elevated,
		isDeputy: isDeputy,
		showBestPracticesLink: elevated && readinessState === 'draft',
		canEdit: elevated && readinessState === 'draft' && !isArchivedView,
		showSubmitButton: elevated && readinessState === 'draft',
		showModifyButton: elevated && readinessState !== 'draft',
		showCloneButton: elevated,
		isReadOnly: !elevated || readinessState !== 'draft' || isArchivedView,
		isModerator: effectiveModerator,
		isOwner: isOwner,
		isMember: isMember,
		canJoinTeam: canJoinTeam,
		canEditBreakout: canEditBreakout,
		canAddResources: canAddResources,
		canEditResources: canEditResources,
		canSuggestResources: canSuggestResources,
		canApproveResources: canApproveResources
	};

	// ── Live context (Ch.14, TICKET-27) ─────────────────────────────
	const liveContext = getLiveContext(eventId);

	// ── Lessons learned (Ch.4.2, Ch.13.1, TICKET-15) ─────────────────
	const rawLessons = getLessonsForProblem(problem.problem_id);
	const lessons = rawLessons.map((l) => ({
		lessonId: l.lesson_id,
		category: l.category as 'tooling' | 'architecture' | 'process' | 'gotcha' | 'performance' | 'testing',
		content: l.content,
		tags: l.tags,
		authorName: l.author_name,
		authorId: l.author_id,
		eventName: l.event_name ?? undefined,
		createdAt: l.created_at,
		valuable: l.valuable
	}));

	// ── Chat messages (Ch.31.8) ───────────────────────────────────────
	const rawMessages = getChatMessages(problem.problem_id, {
		majorVersion: selectedMajorVersion,
		includeAllVersions: false,
		currentUserId: user.user_id
	});

	// Build reply count map from flat messages (count direct children per parent)
	const replyCountMap = new Map<string, number>();
	for (const m of rawMessages) {
		if (m.reply_to_message_id) {
			replyCountMap.set(
				m.reply_to_message_id,
				(replyCountMap.get(m.reply_to_message_id) ?? 0) + 1
			);
		}
	}

	// Transform to ChatMessageData format for the component
	const chatMessages = rawMessages.map((m) => ({
		messageId: m.message_id,
		content: m.content,
		authorId: m.user_id,
		authorName: m.author_display_name,
		authorRole: m.author_role as 'observer' | 'developer' | 'problem_owner' | 'moderator' | 'admin' | 'agent',
		isBot: m.is_bot,
		isOwn: m.user_id === user.user_id,
		createdAt: m.created_at,
		editedAt: m.edited_at,
		reactions: (m.reaction_summary ?? []).map((r) => ({
			emoji: r.emoji,
			count: r.count,
			userReacted: r.user_reacted,
			users: r.users.map((u) => u.display_name)
		})),
		replyToMessageId: m.reply_to_message_id,
		replyCount: replyCountMap.get(m.message_id) ?? 0
	}));

	return {
		problem: {
			problem_id: problem.problem_id,
			created_by_user_id: problem.created_by_user_id,
			public_slug: problem.public_slug,
			private_slug: problem.private_slug,
			view_type: problem.view_type,
			readiness_state: problem.current_readiness_state,
			action_state: problem.current_action_state,
			current_major_version: problem.current_major_version
		},
		currentVersion: selectedVersion,
		versions,
		decisions,
		assessments,
		flags,
		isArchivedView,
		selectedMajorVersion,
		user,
		eventId,
		teamMembers,
		breakoutUrl,
		currentUserId: user.user_id,
		chatMessages,
		lessons,
		directResources,
		helpfulResources,
		latestSnapshot,
		liveContext: liveContext ? {
			currentMode: liveContext.current_mode,
			currentProblemId: liveContext.current_problem_id,
			timerEndsAt: liveContext.timer_ends_at,
			problemTitle: liveContext.problem_title ?? null,
			problemSlug: liveContext.problem_slug ?? null
		} : null
	};
};
