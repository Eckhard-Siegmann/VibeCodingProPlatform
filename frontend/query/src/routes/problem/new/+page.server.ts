import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { validateSession } from '$lib/server/session';
import { createProblem, getProblemTypes } from '$lib/server/repositories/problems';

export const load: PageServerLoad = async ({ cookies }) => {
	const session = validateSession(cookies);
	if (!session) {
		redirect(303, '/login?redirect=/problem/new');
	}

	const problemTypes = getProblemTypes();

	return {
		user: {
			user_id: session.user_id,
			display_name: session.display_name
		},
		problemTypes
	};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const session = validateSession(cookies);
		if (!session) {
			redirect(303, '/login?redirect=/problem/new');
		}

		const formData = await request.formData();
		const title = formData.get('title')?.toString().trim() ?? '';
		const description = formData.get('description')?.toString().trim() ?? '';
		const valueStatement = formData.get('value_statement')?.toString().trim() ?? '';
		const problemType = formData.get('problem_type')?.toString() ?? 'greenfield';
		const repoUrl = formData.get('repo_url_primary')?.toString().trim() ?? '';
		const taskCountRaw = formData.get('task_count')?.toString() ?? '3';
		const taskCount = parseInt(taskCountRaw, 10);

		// Validation
		const errors: Record<string, string> = {};

		if (title.length < 5 || title.length > 200) {
			errors.title = 'Title must be between 5 and 200 characters.';
		}
		if (description.length < 20 || description.length > 5000) {
			errors.description = 'Description must be between 20 and 5000 characters.';
		}
		if (valueStatement && valueStatement.length > 2000) {
			errors.value_statement = 'Value statement must be under 2000 characters.';
		}
		if (repoUrl && !/^https?:\/\/.+/.test(repoUrl)) {
			errors.repo_url_primary = 'Please enter a valid URL (https://...).';
		}
		if (isNaN(taskCount) || taskCount < 1) {
			errors.task_count = 'Task count must be at least 1.';
		}

		if (Object.keys(errors).length > 0) {
			return fail(400, {
				errors,
				values: { title, description, value_statement: valueStatement, problem_type: problemType, repo_url_primary: repoUrl, task_count: taskCountRaw }
			});
		}

		// repo_url_primary is NOT NULL in schema — use placeholder if empty
		const effectiveRepoUrl = repoUrl || 'https://github.com/placeholder';

		const result = createProblem(session.user_id, {
			title,
			description,
			value_statement: valueStatement || undefined,
			problem_type: problemType,
			repo_url_primary: effectiveRepoUrl,
			task_count: taskCount
		});

		// Redirect to the new problem's private view (PO view)
		redirect(303, `/problem/${result.private_slug}`);
	}
};
