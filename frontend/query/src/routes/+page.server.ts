import type { PageServerLoad } from './$types';
import {
	getUpcomingEvents,
	getPastEvents,
	getTopContributors,
	getPlatformStats
} from '$lib/server/repositories/events-public';
import type { EventCardData } from '$lib/components/events';
import type { Contributor } from '$lib/components/dashboard';

export const load: PageServerLoad = async () => {
	const upcomingRows = getUpcomingEvents(6);
	const pastRows = getPastEvents(6);
	const contributorRows = getTopContributors(10);
	const stats = getPlatformStats();

	const upcomingEvents: EventCardData[] = upcomingRows.map((row) => ({
		id: row.event_id,
		slug: row.slug,
		title: row.title,
		description: row.description ?? undefined,
		startsAt: row.starts_at,
		plannedEndsAt: row.planned_ends_at,
		imageUrl: row.image_url ?? undefined,
		location: {
			name: row.location_name,
			city: row.location_city
		},
		partner: {
			name: row.partner_name,
			logoUrl: row.partner_logo_url ?? undefined
		},
		capacity: Math.floor(row.room_capacity * row.overbooking_factor),
		registeredCount: row.registered_count,
		waitlistCount: row.waitlist_count
	}));

	const pastEvents: EventCardData[] = pastRows.map((row) => ({
		id: row.event_id,
		slug: row.slug,
		title: row.title,
		description: row.description ?? undefined,
		startsAt: row.starts_at,
		plannedEndsAt: row.planned_ends_at,
		imageUrl: row.image_url ?? undefined,
		location: {
			name: row.location_name,
			city: row.location_city
		},
		partner: {
			name: row.partner_name,
			logoUrl: row.partner_logo_url ?? undefined
		},
		capacity: row.room_capacity,
		registeredCount: row.registered_count,
		waitlistCount: row.waitlist_count,
		isPast: true,
		problemsCount: row.problems_count,
		participantsCount: row.participants_count
	}));

	const topContributors: Contributor[] = contributorRows.map((row) => ({
		userId: row.user_id,
		displayName: row.display_name,
		points: row.points,
		stars: row.stars,
		contributionCount: row.contribution_count
	}));

	return {
		upcomingEvents,
		pastEvents,
		topContributors,
		stats
	};
};
