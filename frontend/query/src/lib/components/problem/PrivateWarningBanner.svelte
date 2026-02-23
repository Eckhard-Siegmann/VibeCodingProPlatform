<script lang="ts">
	// No props needed - this is a static warning banner
</script>

<div
	class="mb-6 p-4 bg-warning-bg border-2 border-warning rounded-lg flex items-start gap-3"
	role="alert"
>
	<svg class="w-6 h-6 text-warning flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-width="2"
			d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
		/>
	</svg>
	<div>
		<h3 class="font-semibold text-warning">Private View - Do not share this screen</h3>
		<p class="text-sm text-warning/80 mt-1">
			This URL grants edit access to your problem. Bookmark this page for future access.
			Share only the public URL with others.
		</p>
	</div>
</div>
