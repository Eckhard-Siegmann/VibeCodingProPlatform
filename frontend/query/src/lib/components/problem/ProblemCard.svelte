<script lang="ts">
	/**
	 * ProblemCard - Main Problem Card component with all sections.
	 *
	 * Per Ch.13.1 and problem_card_design.md Decision #28:
	 * - Mobile (<768px): Collapsible sections reduce scroll length
	 * - Desktop (>=768px): All sections always visible, no collapse
	 * - Default collapsed: Lessons Learned, Decision History
	 * - Default open: Description, Resources, Assessments, Team, Chat
	 * - EtchedSeparator between major Card sections
	 */
	import type { ProblemVersion, Decision, AssessmentSummary } from '$lib/server/repositories/problems';
	import PrivateWarningBanner from './PrivateWarningBanner.svelte';
	import BestPracticesLink from './BestPracticesLink.svelte';
	import ClassificationBadge from './ClassificationBadge.svelte';
	import ProblemHeader from './ProblemHeader.svelte';
	import ProblemContent from './ProblemContent.svelte';
	import VisualJourneyMap from './VisualJourneyMap.svelte';
	import NextStepsGuidance from './NextStepsGuidance.svelte';
	import VersionNav from './VersionNav.svelte';
	import DecisionTimeline from './DecisionTimeline.svelte';
	import AssessmentLinks from './AssessmentLinks.svelte';
	import LessonsLearnedLog from './LessonsLearnedLog.svelte';
	import DualStateExplanation from './DualStateExplanation.svelte';
	import ModeratorControls from './ModeratorControls.svelte';
	import POActionBar from './POActionBar.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import { Card, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { AccordionSection } from '$lib/components/ui/accordion-section';
	import { EtchedSeparator } from '$lib/components/ui/etched-separator';
	import { TeamSection } from '$lib/components/team';
	import { ChatPanel } from '$lib/components/chat';
	import type { Lesson } from './LessonCard.svelte';
	import type { TeamMember } from '$lib/components/team/TeamMemberList.svelte';
	import type { ChatMessageData, MentionUser } from '$lib/components/chat';

	type ProblemType =
		| 'explorative'
		| 'greenfield'
		| 'advanced_greenfield'
		| 'brownfield'
		| 'reverse_engineering'
		| 'other';

	interface Problem {
		problem_id: string;
		public_slug: string;
		private_slug: string;
		view_type: 'public' | 'private';
		readiness_state: string;
		action_state: string;
		current_major_version: number;
		problem_type?: ProblemType;
	}

	interface ProblemOwner {
		userId: string;
		displayName: string;
	}

	interface Flags {
		showWarningBanner: boolean;
		showBestPracticesLink: boolean;
		canEdit: boolean;
		showSubmitButton: boolean;
		showModifyButton: boolean;
		showCloneButton: boolean;
		isReadOnly: boolean;
		isModerator?: boolean;
		isOwner?: boolean;
		isMember?: boolean;
		canJoinTeam?: boolean;
		canEditBreakout?: boolean;
	}

	interface Props {
		problem: Problem;
		currentVersion: ProblemVersion;
		versions: ProblemVersion[];
		decisions: Decision[];
		assessments: AssessmentSummary[];
		flags: Flags;
		isArchivedView: boolean;
		selectedMajorVersion: number;
		// Optional extended data
		owner?: ProblemOwner;
		lessons?: Lesson[];
		teamMembers?: TeamMember[];
		chatMessages?: ChatMessageData[];
		breakoutUrl?: string | null;
		currentUserId?: string;
		isPitchOpen?: boolean;
		isReviewOpen?: boolean;
		// Handlers
		onVersionSelect: (majorVersion: number) => void;
		onFieldUpdate?: (field: string, value: string | number) => Promise<boolean>;
		onSubmit: () => void;
		onModify: () => void;
		onClone: () => void;
		onAddLesson?: () => void;
		onFlagValuable?: (lessonId: string) => void;
		onJoinTeam?: () => void;
		onRetireFromTeam?: () => void;
		onRejoinTeam?: () => void;
		onUpdateBreakout?: (url: string) => void;
		onSendMessage?: (message: string, replyToId?: string) => void;
		onReactToMessage?: (messageId: string, emoji: string) => void;
		onDecision?: (decisionType: string, comment?: string) => void;
	}

	let {
		problem,
		currentVersion,
		versions,
		decisions,
		assessments,
		flags,
		isArchivedView,
		selectedMajorVersion,
		owner,
		lessons = [],
		teamMembers = [],
		chatMessages = [],
		breakoutUrl,
		currentUserId,
		isPitchOpen = false,
		isReviewOpen = false,
		onVersionSelect,
		onFieldUpdate,
		onSubmit,
		onModify,
		onClone,
		onAddLesson,
		onFlagValuable,
		onJoinTeam,
		onRetireFromTeam,
		onRejoinTeam,
		onUpdateBreakout,
		onSendMessage,
		onReactToMessage,
		onDecision
	}: Props = $props();

	// Dialog state
	let showSubmitConfirm = $state(false);
	let showCloneConfirm = $state(false);
	let actionInProgress = $state(false);
	let showStateHelp = $state(false);

	// User role for guidance
	const userRole = $derived(
		flags.isModerator
			? 'moderator'
			: flags.isOwner
				? 'problem_owner'
				: flags.isMember
					? 'developer'
					: 'observer'
	) as 'moderator' | 'problem_owner' | 'developer' | 'observer';

	function handleSubmitClick() {
		showSubmitConfirm = true;
	}

	function handleCloneClick() {
		showCloneConfirm = true;
	}

	async function confirmSubmit() {
		showSubmitConfirm = false;
		actionInProgress = true;
		try {
			await onSubmit();
		} finally {
			actionInProgress = false;
		}
	}

	async function confirmClone() {
		showCloneConfirm = false;
		actionInProgress = true;
		try {
			await onClone();
		} finally {
			actionInProgress = false;
		}
	}

	async function handleModify() {
		actionInProgress = true;
		try {
			await onModify();
		} finally {
			actionInProgress = false;
		}
	}

	// Convert versions for ChatPanel
	const chatVersions = $derived(
		versions.map((v) => ({
			majorVersion: v.major_version,
			label: `v${v.major_version}.00`
		}))
	);

	// Convert teamMembers for ChatPanel mention users
	const mentionUsers = $derived(
		teamMembers.map((m) => ({
			userId: m.userId,
			displayName: m.displayName
		})) as MentionUser[]
	);
</script>

<div class="space-y-4">
	<!-- Private View Warning Banner -->
	{#if flags.showWarningBanner}
		<PrivateWarningBanner />
	{/if}

	<!-- Best Practices Link (draft mode only) -->
	{#if flags.showBestPracticesLink}
		<BestPracticesLink />
	{/if}

	<!-- Classification Badge (at very top) -->
	{#if problem.problem_type}
		<ClassificationBadge type={problem.problem_type} />
	{/if}

	<!-- Version Navigation -->
	<VersionNav
		{versions}
		{selectedMajorVersion}
		currentMajorVersion={problem.current_major_version}
		{onVersionSelect}
	/>

	<!-- Header with Title, Owner Avatar, and States -->
	<ProblemHeader
		title={currentVersion.title}
		readinessState={problem.readiness_state}
		actionState={problem.action_state}
		majorVersion={selectedMajorVersion}
		isArchived={isArchivedView}
		canEdit={flags.canEdit}
		{owner}
		onTitleUpdate={async (value) => {
			if (onFieldUpdate) {
				return await onFieldUpdate('title', value);
			}
			return false;
		}}
	/>

	<!-- Visual Journey Map (below header, collapsible on mobile) -->
	<VisualJourneyMap
		currentReadiness={problem.readiness_state as any}
		currentAction={problem.action_state as any}
		collapsible={true}
	/>

	<!-- Next Steps Guidance (role-specific) -->
	<NextStepsGuidance
		readinessState={problem.readiness_state as any}
		actionState={problem.action_state as any}
		{userRole}
		{isPitchOpen}
		{isReviewOpen}
		isOwner={flags.isOwner}
		isMember={flags.isMember}
		onSubmit={flags.showSubmitButton ? handleSubmitClick : undefined}
		onEdit={flags.canEdit ? handleModify : undefined}
		onJoinTeam={flags.canJoinTeam ? onJoinTeam : undefined}
	/>

	<EtchedSeparator class="my-4" />

	<!-- Description & Resources Section (collapsible on mobile, open by default) -->
	<div class="md:hidden">
		<AccordionSection title="Description & Resources" defaultOpen={true}>
			<ProblemContent version={currentVersion} canEdit={flags.canEdit} {onFieldUpdate} />
		</AccordionSection>
	</div>
	<div class="hidden md:block">
		<Card elevation="resting">
			<CardHeader>
				<CardTitle>Description</CardTitle>
			</CardHeader>
			<ProblemContent version={currentVersion} canEdit={flags.canEdit} {onFieldUpdate} />
		</Card>
	</div>

	<EtchedSeparator class="my-4" />

	<!-- Assessments Section (collapsible on mobile, open by default) -->
	<div class="md:hidden">
		<AccordionSection title="Assessments" defaultOpen={true}>
			<AssessmentLinks {assessments} isPrivateView={problem.view_type === 'private'} />
		</AccordionSection>
	</div>
	<div class="hidden md:block">
		<AssessmentLinks {assessments} isPrivateView={problem.view_type === 'private'} />
	</div>

	<EtchedSeparator class="my-4" />

	<!-- Lessons Learned Section (collapsible on mobile, CLOSED by default) -->
	<div class="md:hidden">
		<AccordionSection title="Lessons Learned" defaultOpen={false}>
			<LessonsLearnedLog
				{lessons}
				canAddLesson={!isArchivedView}
				canFlagValuable={flags.isModerator || flags.isOwner}
				{currentUserId}
				onAddLesson={onAddLesson}
				{onFlagValuable}
			/>
		</AccordionSection>
	</div>
	<div class="hidden md:block">
		<LessonsLearnedLog
			{lessons}
			canAddLesson={!isArchivedView}
			canFlagValuable={flags.isModerator || flags.isOwner}
			{currentUserId}
			onAddLesson={onAddLesson}
			{onFlagValuable}
		/>
	</div>

	<EtchedSeparator class="my-4" />

	<!-- Team Section (collapsible on mobile, open by default) -->
	<div class="md:hidden">
		<AccordionSection title="Team" defaultOpen={true}>
			<Card elevation="resting">
				<div class="p-4">
					<TeamSection
						members={teamMembers}
						{breakoutUrl}
						{currentUserId}
						canJoin={flags.canJoinTeam}
						canEditBreakout={flags.canEditBreakout}
						onJoin={onJoinTeam}
						onRetire={onRetireFromTeam}
						onRejoin={onRejoinTeam}
						onUpdateBreakout={onUpdateBreakout}
					/>
				</div>
			</Card>
		</AccordionSection>
	</div>
	<div class="hidden md:block">
		<Card elevation="resting">
			<CardHeader>
				<CardTitle>Team</CardTitle>
			</CardHeader>
			<div class="px-4 md:px-5 pb-4 md:pb-5">
				<TeamSection
					members={teamMembers}
					{breakoutUrl}
					{currentUserId}
					canJoin={flags.canJoinTeam}
					canEditBreakout={flags.canEditBreakout}
					onJoin={onJoinTeam}
					onRetire={onRetireFromTeam}
					onRejoin={onRejoinTeam}
					onUpdateBreakout={onUpdateBreakout}
				/>
			</div>
		</Card>
	</div>

	<EtchedSeparator class="my-4" />

	<!-- Team Chat Section (collapsible on mobile, open by default) -->
	<div class="md:hidden">
		<AccordionSection title="Team Chat" defaultOpen={true}>
			<Card elevation="resting" padding="none">
				<div class="h-[400px]">
					<ChatPanel
						messages={chatMessages}
						teamMembers={mentionUsers}
						versions={chatVersions}
						currentMajorVersion={problem.current_major_version}
						isArchiveView={isArchivedView}
						isAuthenticated={Boolean(currentUserId)}
						onSend={onSendMessage}
						onReact={onReactToMessage}
					/>
				</div>
			</Card>
		</AccordionSection>
	</div>
	<div class="hidden md:block">
		<Card elevation="resting" padding="none">
			<CardHeader class="px-4 md:px-5 pt-4 md:pt-5">
				<CardTitle>Team Chat</CardTitle>
			</CardHeader>
			<div class="h-[500px]">
				<ChatPanel
					messages={chatMessages}
					teamMembers={mentionUsers}
					versions={chatVersions}
					currentMajorVersion={problem.current_major_version}
					isArchiveView={isArchivedView}
					isAuthenticated={Boolean(currentUserId)}
					onSend={onSendMessage}
					onReact={onReactToMessage}
				/>
			</div>
		</Card>
	</div>

	<EtchedSeparator class="my-4" />

	<!-- Decision History Section (collapsible on mobile, CLOSED by default) -->
	<div class="md:hidden">
		<AccordionSection title="Decision History" defaultOpen={false}>
			<DecisionTimeline {decisions} />
		</AccordionSection>
	</div>
	<div class="hidden md:block">
		<DecisionTimeline {decisions} />
	</div>

	<!-- Dual State Explanation (help section) -->
	{#if showStateHelp}
		<DualStateExplanation expanded={true} onDismiss={() => (showStateHelp = false)} />
	{/if}

	<EtchedSeparator class="my-4" />

	<!-- Moderator Controls (moderator/admin only) -->
	{#if flags.isModerator && onDecision}
		<ModeratorControls
			problemId={problem.problem_id}
			currentReadinessState={problem.readiness_state}
			currentActionState={problem.action_state}
			{onDecision}
			disabled={isArchivedView}
		/>
	{/if}

	<!-- PO Action Bar (private view only) -->
	{#if problem.view_type === 'private'}
		<POActionBar
			showSubmit={flags.showSubmitButton}
			showModify={flags.showModifyButton}
			showClone={flags.showCloneButton}
			disabled={actionInProgress}
			onSubmit={handleSubmitClick}
			onModify={handleModify}
			onClone={handleCloneClick}
		/>
	{/if}
</div>

<!-- Submit Confirmation Dialog -->
<ConfirmDialog
	bind:open={showSubmitConfirm}
	title="Submit Problem for Review"
	message="Once submitted, you cannot edit this version. You'll need to create a new version to make changes. Are you sure you want to submit?"
	confirmLabel="Submit"
	variant="default"
	onConfirm={confirmSubmit}
	onCancel={() => (showSubmitConfirm = false)}
/>

<!-- Clone Confirmation Dialog -->
<ConfirmDialog
	bind:open={showCloneConfirm}
	title="Clone Problem"
	message="This will create a copy of this problem with new public and private URLs. You will be redirected to the new problem. Continue?"
	confirmLabel="Clone"
	variant="default"
	onConfirm={confirmClone}
	onCancel={() => (showCloneConfirm = false)}
/>
