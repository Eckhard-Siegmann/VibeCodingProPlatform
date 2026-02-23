/**
 * Empty state content configuration.
 * Centralized content for EmptyState component across the platform.
 * Per Decision #2: Generic EmptyState component + domain-specific config objects.
 */

export interface EmptyStateConfig {
	icon: string; // Emoji or icon name
	title: string;
	message: string;
	action?: {
		label: string;
		href?: string;
		onclick?: () => void;
	};
}

export const emptyProblemList: EmptyStateConfig = {
	icon: '📝',
	title: 'No problems yet',
	message: 'Problems are challenges you want to solve. Create your first problem to get started.',
	action: {
		label: 'Create your first problem',
		href: '/problem/new'
	}
};

export const emptyChat: EmptyStateConfig = {
	icon: '💬',
	title: 'No messages yet',
	message: 'Be the first to post! Introduce yourself or share your approach.',
	action: undefined // No action button, just show input
};

export const emptyTeam: EmptyStateConfig = {
	icon: '👥',
	title: 'No team members yet',
	message: "When participants join this problem, they'll appear here.",
	action: undefined
};

export const emptyLessons: EmptyStateConfig = {
	icon: '💡',
	title: 'No lessons captured yet',
	message:
		'After working on a problem, capture insights and learnings to help future participants.',
	action: {
		label: 'Add your first lesson',
		onclick: () => {
			/* Will be passed as prop */
		}
	}
};

export const emptyEvents: EmptyStateConfig = {
	icon: '📅',
	title: 'No events scheduled',
	message: 'Check back soon for upcoming VibeCoding events in your area.',
	action: undefined
};

export const emptyAssessmentResults: EmptyStateConfig = {
	icon: '📊',
	title: 'No results yet',
	message: 'Results appear after the assessment closes and participants have submitted their ratings.',
	action: undefined
};

export const emptyDecisions: EmptyStateConfig = {
	icon: '⚖️',
	title: 'No decisions yet',
	message: 'Decision history will appear here as moderators curate and manage this problem.',
	action: undefined
};

export const emptyContributors: EmptyStateConfig = {
	icon: '🏆',
	title: 'No contributors yet',
	message: 'Top contributors will appear here based on points earned over the last 6 weeks.',
	action: undefined
};

export const emptyResources: EmptyStateConfig = {
	icon: '🔗',
	title: 'No resources yet',
	message: 'Add repositories, documentation, or helpful links to provide context for this problem.',
	action: {
		label: 'Add first resource',
		onclick: () => {
			/* Will be passed as prop */
		}
	}
};

export const emptyUserList: EmptyStateConfig = {
	icon: '👤',
	title: 'No users found',
	message: 'Adjust your filters or search criteria to find users.',
	action: undefined
};

export const emptySearchResults: EmptyStateConfig = {
	icon: '🔍',
	title: 'No results found',
	message: 'Try different search terms or adjust your filters.',
	action: undefined
};
