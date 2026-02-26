import type { PageServerLoad } from './$types';
import {
	getGlobalLessons,
	getEventsWithLessons,
	getLocationsWithLessons
} from '$lib/server/repositories/lessons';
import { getAuthenticatedUser } from '$lib/server/auth';
import { getDatabase } from '$lib/server/db';

export const load: PageServerLoad = async ({ url, cookies }) => {
	const user = getAuthenticatedUser(cookies);

	// Query parameters for filtering
	const search = url.searchParams.get('q') || null;
	const category = url.searchParams.get('category') || null;
	const eventId = url.searchParams.get('event') || null;
	const locationId = url.searchParams.get('location') || null;
	const valuableOnly = url.searchParams.get('valuable') === '1';

	// Load lessons with applied filters
	const rawLessons = getGlobalLessons({
		search,
		category,
		eventId,
		locationId,
		valuableOnly
	});

	// Transform to component format
	const lessons = rawLessons.map((l) => ({
		lessonId: l.lesson_id,
		problemId: l.problem_id,
		category: l.category as 'tooling' | 'architecture' | 'process' | 'gotcha' | 'performance' | 'testing' | null,
		content: l.content,
		tags: l.tags,
		authorName: l.author_name,
		authorId: l.author_id,
		eventName: l.event_name ?? undefined,
		createdAt: l.created_at,
		valuable: l.valuable,
		problemTitle: l.problem_title,
		problemSlug: l.problem_slug,
		majorVersion: l.major_version,
		locationName: l.location_name ?? undefined
	}));

	// Load filter option lists
	const eventsWithLessons = getEventsWithLessons();
	const locationsWithLessons = getLocationsWithLessons();

	// Determine if user can flag lessons as valuable (moderator/admin)
	const db = getDatabase();
	const userRoleRecord = db
		.prepare('SELECT role FROM users WHERE user_id = ?')
		.get(user.user_id) as { role: string } | undefined;
	const canFlagValuable =
		userRoleRecord?.role === 'moderator' || userRoleRecord?.role === 'admin';

	return {
		lessons,
		eventsWithLessons,
		locationsWithLessons,
		canFlagValuable,
		currentUserId: user.user_id,
		// Echo filters back so the UI can pre-populate
		filters: { search, category, eventId, locationId, valuableOnly }
	};
};
