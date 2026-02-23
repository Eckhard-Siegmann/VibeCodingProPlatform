import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	findProblemBySlug,
	getProblemVersions,
	getCurrentVersion,
	getProblemVersion,
	getDecisionHistory,
	getAssessmentsForProblem
} from '$lib/server/repositories/problems';
import { getAuthenticatedUser, canAccessPrivateView } from '$lib/server/auth';

export const load: PageServerLoad = async ({ params, url }) => {
	const { slug } = params;

	// Get authenticated user (MVP: hardcoded)
	const user = getAuthenticatedUser();

	// Find problem by slug (determines view type)
	const problem = findProblemBySlug(slug);

	if (!problem) {
		throw error(404, 'Problem not found');
	}

	// If private slug but user cannot access private view, redirect to public view
	if (problem.view_type === 'private' && !canAccessPrivateView(problem.created_by_user_id)) {
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

	// Get decisions and assessments
	const decisions = getDecisionHistory(problem.problem_id);
	const assessments = getAssessmentsForProblem(problem.problem_id);

	// Compute visibility flags
	const viewType = problem.view_type;
	const readinessState = problem.current_readiness_state;

	const flags = {
		showWarningBanner: viewType === 'private',
		showBestPracticesLink: viewType === 'private' && readinessState === 'draft',
		canEdit: viewType === 'private' && readinessState === 'draft' && !isArchivedView,
		showSubmitButton: viewType === 'private' && readinessState === 'draft',
		showModifyButton: viewType === 'private' && readinessState !== 'draft',
		showCloneButton: viewType === 'private',
		isReadOnly: viewType === 'public' || readinessState !== 'draft' || isArchivedView
	};

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
		user
	};
};
