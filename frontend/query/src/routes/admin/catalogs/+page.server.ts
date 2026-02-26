import type { PageServerLoad } from './$types';
import {
	getSoftCatalogEntries,
	getEmojiEntries,
	getContributionActions,
	getReviewWeights
} from '$lib/server/repositories/catalogs';

export const load: PageServerLoad = async () => {
	try {
		const problemTypes = getSoftCatalogEntries('problem_types');
		const emojis = getEmojiEntries();
		const lessonCategories = getSoftCatalogEntries('lesson_categories');
		const contributionWeights = getContributionActions();
		const reviewWeights = getReviewWeights();

		return {
			problemTypes,
			emojis,
			lessonCategories,
			contributionWeights,
			reviewWeights
		};
	} catch {
		// Return empty data if database not available (development fallback)
		return {
			problemTypes: [],
			emojis: [],
			lessonCategories: [],
			contributionWeights: [],
			reviewWeights: []
		};
	}
};
