<script lang="ts">
	import {
		AlertDialog,
		AlertDialogContent,
		AlertDialogHeader,
		AlertDialogFooter,
		AlertDialogTitle,
		AlertDialogDescription,
		AlertDialogAction,
		AlertDialogCancel
	} from '$lib/components/ui/alert-dialog';

	interface Props {
		open: boolean;
		title: string;
		message: string;
		confirmLabel?: string;
		cancelLabel?: string;
		variant?: 'default' | 'danger';
		showCancel?: boolean;
		onConfirm: () => void;
		onCancel?: () => void;
	}

	let {
		open = $bindable(),
		title,
		message,
		confirmLabel = 'Confirm',
		cancelLabel = 'Cancel',
		variant = 'default',
		showCancel = true,
		onConfirm,
		onCancel
	}: Props = $props();

	function handleOpenChange(newOpen: boolean) {
		if (!newOpen && onCancel) {
			onCancel();
		}
		open = newOpen;
	}
</script>

<AlertDialog.Root bind:open onOpenChange={handleOpenChange}>
	<AlertDialogContent>
		<AlertDialogHeader>
			<AlertDialogTitle>{title}</AlertDialogTitle>
			<AlertDialogDescription>{message}</AlertDialogDescription>
		</AlertDialogHeader>
		<AlertDialogFooter>
			{#if showCancel && onCancel}
				<AlertDialogCancel onclick={onCancel}>
					{cancelLabel}
				</AlertDialogCancel>
			{/if}
			<AlertDialogAction
				variant={variant === 'danger' ? 'destructive' : 'default'}
				onclick={onConfirm}
			>
				{confirmLabel}
			</AlertDialogAction>
		</AlertDialogFooter>
	</AlertDialogContent>
</AlertDialog.Root>
