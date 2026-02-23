import { AlertDialog as AlertDialogPrimitive } from 'bits-ui';

import AlertDialogContent from './alert-dialog-content.svelte';
import AlertDialogOverlay from './alert-dialog-overlay.svelte';
import AlertDialogHeader from './alert-dialog-header.svelte';
import AlertDialogFooter from './alert-dialog-footer.svelte';
import AlertDialogTitle from './alert-dialog-title.svelte';
import AlertDialogDescription from './alert-dialog-description.svelte';
import AlertDialogAction from './alert-dialog-action.svelte';
import AlertDialogCancel from './alert-dialog-cancel.svelte';

const AlertDialog = AlertDialogPrimitive;
const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

export {
	AlertDialog,
	AlertDialogTrigger,
	AlertDialogContent,
	AlertDialogOverlay,
	AlertDialogHeader,
	AlertDialogFooter,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogAction,
	AlertDialogCancel
};
