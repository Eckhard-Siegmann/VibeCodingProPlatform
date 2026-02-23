<script lang="ts">
	import { cn } from '$lib/utils';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import Users from '@lucide/svelte/icons/users';
	import Calendar from '@lucide/svelte/icons/calendar';
	import FileText from '@lucide/svelte/icons/file-text';
	import Layers from '@lucide/svelte/icons/layers';
	import Building from '@lucide/svelte/icons/building';
	import CheckCircle from '@lucide/svelte/icons/check-circle';
	import AlertCircle from '@lucide/svelte/icons/alert-circle';
	import Clock from '@lucide/svelte/icons/clock';
	import BarChart from '@lucide/svelte/icons/bar-chart';

	interface Props {
		data?: {
			stats: {
				users: number;
				events: number;
				problems: number;
				assessments: number;
				decisions: number;
			};
			health: {
				activeEvents: number;
				openAssessments: number;
				retiredItems: number;
				pendingRegistrations: number;
			};
		};
	}

	let { data }: Props = $props();

	// Default demo data
	const stats = data?.stats ?? {
		users: 156,
		events: 12,
		problems: 45,
		assessments: 234,
		decisions: 567
	};

	const health = data?.health ?? {
		activeEvents: 2,
		openAssessments: 3,
		retiredItems: 5,
		pendingRegistrations: 18
	};

	// Admin sections with navigation
	const sections = [
		{
			title: 'User Management',
			description: 'View, import, and manage user accounts',
			href: '/admin/users',
			icon: Users,
			stat: stats.users,
			statLabel: 'total users'
		},
		{
			title: 'Event Management',
			description: 'Create and manage community events',
			href: '/admin/events',
			icon: Calendar,
			stat: stats.events,
			statLabel: 'events'
		},
		{
			title: 'Item Management',
			description: 'Create and edit evaluation items',
			href: '/admin/items',
			icon: FileText,
			stat: null,
			statLabel: null
		},
		{
			title: 'Inventory Management',
			description: 'Assemble and manage inventories',
			href: '/admin/inventories',
			icon: Layers,
			stat: null,
			statLabel: null
		}
	];
</script>

<svelte:head>
	<title>Admin Overview | VibeCoding</title>
</svelte:head>

<div class="min-h-screen bg-viewport">
	<div class="max-w-7xl mx-auto px-4 py-6 md:py-8">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-2xl md:text-3xl font-bold text-headers">Administrator Overview</h1>
			<p class="text-meta mt-1">System configuration and management</p>
		</div>

		<!-- System Status Overview -->
		<Card elevation="resting" class="mb-6">
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<BarChart class="w-5 h-5 text-primary" />
					System Status
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="grid grid-cols-2 md:grid-cols-5 gap-4">
					<div class="text-center p-3 bg-canvas rounded-[var(--radius-card)]">
						<p class="text-2xl md:text-3xl font-bold text-headers">{stats.users}</p>
						<p class="text-sm text-meta">Users</p>
					</div>
					<div class="text-center p-3 bg-canvas rounded-[var(--radius-card)]">
						<p class="text-2xl md:text-3xl font-bold text-headers">{stats.events}</p>
						<p class="text-sm text-meta">Events</p>
					</div>
					<div class="text-center p-3 bg-canvas rounded-[var(--radius-card)]">
						<p class="text-2xl md:text-3xl font-bold text-headers">{stats.problems}</p>
						<p class="text-sm text-meta">Problems</p>
					</div>
					<div class="text-center p-3 bg-canvas rounded-[var(--radius-card)]">
						<p class="text-2xl md:text-3xl font-bold text-headers">{stats.assessments}</p>
						<p class="text-sm text-meta">Assessments</p>
					</div>
					<div class="text-center p-3 bg-canvas rounded-[var(--radius-card)]">
						<p class="text-2xl md:text-3xl font-bold text-headers">{stats.decisions}</p>
						<p class="text-sm text-meta">Decisions</p>
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- Health Indicators -->
		<Card elevation="resting" class="mb-6">
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<CheckCircle class="w-5 h-5 text-success" />
					Health Indicators
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
					<!-- Active Events -->
					<div class="flex items-center gap-3 p-3 bg-canvas rounded-[var(--radius-card)]">
						<div class={cn(
							'p-2 rounded-full',
							health.activeEvents > 0 ? 'bg-success/10' : 'bg-canvas'
						)}>
							<Calendar class={cn(
								'w-5 h-5',
								health.activeEvents > 0 ? 'text-success' : 'text-meta'
							)} />
						</div>
						<div>
							<p class="text-lg font-semibold text-headers">{health.activeEvents}</p>
							<p class="text-xs text-meta">Active Events</p>
						</div>
					</div>

					<!-- Open Assessments -->
					<div class="flex items-center gap-3 p-3 bg-canvas rounded-[var(--radius-card)]">
						<div class={cn(
							'p-2 rounded-full',
							health.openAssessments > 0 ? 'bg-primary/10' : 'bg-canvas'
						)}>
							<Clock class={cn(
								'w-5 h-5',
								health.openAssessments > 0 ? 'text-primary' : 'text-meta'
							)} />
						</div>
						<div>
							<p class="text-lg font-semibold text-headers">{health.openAssessments}</p>
							<p class="text-xs text-meta">Open Assessments</p>
						</div>
					</div>

					<!-- Retired Items -->
					<div class="flex items-center gap-3 p-3 bg-canvas rounded-[var(--radius-card)]">
						<div class={cn(
							'p-2 rounded-full',
							health.retiredItems > 0 ? 'bg-warning-bg' : 'bg-canvas'
						)}>
							<AlertCircle class={cn(
								'w-5 h-5',
								health.retiredItems > 0 ? 'text-warning' : 'text-meta'
							)} />
						</div>
						<div>
							<p class="text-lg font-semibold text-headers">{health.retiredItems}</p>
							<p class="text-xs text-meta">Retired Items</p>
						</div>
					</div>

					<!-- Pending Registrations -->
					<div class="flex items-center gap-3 p-3 bg-canvas rounded-[var(--radius-card)]">
						<div class={cn(
							'p-2 rounded-full',
							health.pendingRegistrations > 0 ? 'bg-pending/10' : 'bg-canvas'
						)}>
							<Users class={cn(
								'w-5 h-5',
								health.pendingRegistrations > 0 ? 'text-pending' : 'text-meta'
							)} />
						</div>
						<div>
							<p class="text-lg font-semibold text-headers">{health.pendingRegistrations}</p>
							<p class="text-xs text-meta">Pending Registrations</p>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- Admin Sections -->
		<div class="grid gap-4 md:grid-cols-2">
			{#each sections as section (section.href)}
				<a href={section.href} class="block group">
					<Card
						elevation="resting"
						class="h-full transition-all hover:shadow-[var(--shadow-md)] group-hover:border-primary/50"
					>
						<CardContent class="flex items-start gap-4 py-5">
							<div class="p-3 bg-primary/10 rounded-[var(--radius-card)] group-hover:bg-primary/20 transition-colors">
								<section.icon class="w-6 h-6 text-primary" />
							</div>
							<div class="flex-1">
								<h3 class="font-semibold text-headers group-hover:text-primary transition-colors">
									{section.title}
								</h3>
								<p class="text-sm text-meta mt-1">{section.description}</p>
								{#if section.stat !== null}
									<p class="text-xs text-meta mt-2">
										<span class="font-semibold text-headers">{section.stat}</span> {section.statLabel}
									</p>
								{/if}
							</div>
						</CardContent>
					</Card>
				</a>
			{/each}
		</div>

		<!-- Quick Actions -->
		<Card elevation="resting" class="mt-6">
			<CardHeader>
				<CardTitle>Quick Actions</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="flex flex-wrap gap-3">
					<Button variant="default" onclick={() => window.location.href = '/admin/csv-import'}>
						Import Users
					</Button>
					<Button variant="secondary" onclick={() => window.location.href = '/admin/events?action=create'}>
						Create Event
					</Button>
					<Button variant="secondary" onclick={() => window.location.href = '/admin/items?action=create'}>
						Create Item
					</Button>
					<Button variant="secondary" onclick={() => window.location.href = '/admin/inventories?action=create'}>
						Create Inventory
					</Button>
				</div>
			</CardContent>
		</Card>
	</div>
</div>
