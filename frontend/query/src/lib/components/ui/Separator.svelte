<script lang="ts">
	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();
</script>

<!-- Etched 3D separator effect per style guide -->
<div class="my-6 {className}" role="separator">
	<div class="h-px bg-etch-top"></div>
	<div class="h-px bg-etch-bottom"></div>
</div>
