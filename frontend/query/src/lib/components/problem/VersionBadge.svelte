<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';

	interface Props {
		majorVersion: number;
		isArchived?: boolean;
	}

	let { majorVersion, isArchived = false }: Props = $props();
</script>

<Badge variant={isArchived ? 'submitted' : 'secondary'}>
	v{majorVersion}
	{#if isArchived}
		<span class="ml-1">(archived)</span>
	{/if}
</Badge>
