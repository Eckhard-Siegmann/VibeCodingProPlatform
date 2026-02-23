<script lang="ts">
	import { cn } from '$lib/utils';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { UserList, type UserData } from '$lib/components/admin';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';

	interface Props {
		data?: {
			users: UserData[];
		};
	}

	let { data }: Props = $props();

	// Demo users
	const demoUsers: UserData[] = [
		{
			user_id: 'u1',
			email: 'max@example.com',
			display_name: 'Max Mustermann',
			role: 'admin',
			registered_at: '2025-06-15T10:00:00Z',
			email_confirmed: true,
			newsletter_subscribed: true,
			events_attended: 12
		},
		{
			user_id: 'u2',
			email: 'eva@example.com',
			display_name: 'Eva Schmidt',
			role: 'moderator',
			registered_at: '2025-07-20T14:30:00Z',
			email_confirmed: true,
			newsletter_subscribed: true,
			events_attended: 8
		},
		{
			user_id: 'u3',
			email: 'lisa@example.com',
			display_name: 'Lisa Chen',
			role: 'problem_owner',
			registered_at: '2025-09-10T09:15:00Z',
			email_confirmed: true,
			newsletter_subscribed: false,
			events_attended: 5
		},
		{
			user_id: 'u4',
			email: 'tom@example.com',
			display_name: 'Tom Weber',
			role: 'developer',
			registered_at: '2025-11-05T16:45:00Z',
			email_confirmed: true,
			newsletter_subscribed: true,
			events_attended: 3
		},
		{
			user_id: 'u5',
			email: 'anna@example.com',
			display_name: 'Anna Mueller',
			role: 'observer',
			registered_at: '2026-01-02T11:00:00Z',
			email_confirmed: false,
			newsletter_subscribed: true,
			events_attended: 0
		},
		{
			user_id: 'u6',
			email: 'code-assistant@bot.local',
			display_name: 'Code Assistant',
			role: 'agent',
			registered_at: '2025-06-01T00:00:00Z',
			email_confirmed: true,
			newsletter_subscribed: false,
			events_attended: 0
		}
	];

	// Use demoUsers initially, sync from data via $effect
	let users = $state(demoUsers);

	$effect(() => {
		if (data?.users) {
			users = data.users;
		}
	});

	// Handlers
	function handleEdit(user: UserData) {
		console.log('Edit user:', user);
		// In production, open edit dialog
	}

	function handlePromote(user: UserData) {
		console.log('Promote user:', user);
		// In production, show role selection dialog
	}

	function handleEmailUser(user: UserData) {
		console.log('Email user:', user);
		// In production, open email compose
	}

	function handleImportCSV() {
		window.location.href = '/admin/csv-import';
	}

	function handleExportNewsletter() {
		console.log('Exporting newsletter subscribers');
		// In production, download CSV
	}
</script>

<svelte:head>
	<title>User Management | Admin | VibeCoding</title>
</svelte:head>

<div class="min-h-screen bg-viewport">
	<div class="max-w-7xl mx-auto px-4 py-6 md:py-8">
		<!-- Header -->
		<div class="flex items-center gap-4 mb-6">
			<a
				href="/admin"
				class="p-2 rounded-[var(--radius-card)] hover:bg-canvas transition-colors"
				title="Back to Admin"
			>
				<ArrowLeft class="w-5 h-5 text-meta" />
			</a>
			<div>
				<h1 class="text-2xl md:text-3xl font-bold text-headers">User Management</h1>
				<p class="text-meta">View, import, and manage user accounts</p>
			</div>
		</div>

		<!-- User List -->
		<Card elevation="resting">
			<CardContent>
				<UserList
					{users}
					onEdit={handleEdit}
					onPromote={handlePromote}
					onEmailUser={handleEmailUser}
					onImportCSV={handleImportCSV}
					onExportNewsletter={handleExportNewsletter}
				/>
			</CardContent>
		</Card>
	</div>
</div>
