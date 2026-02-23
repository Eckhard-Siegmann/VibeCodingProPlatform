<script lang="ts">
	import { BEST_PRACTICES_URL } from '$lib/config';
</script>

<div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
	<div class="flex items-center gap-2">
		<svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>
		<span class="text-sm text-primary">
			Need help writing your problem?
			<a
				href={BEST_PRACTICES_URL}
				target="_blank"
				rel="noopener noreferrer"
				class="underline font-medium hover:text-primary-hover"
			>
				Read the Best Practices Guide
			</a>
		</span>
	</div>
</div>
