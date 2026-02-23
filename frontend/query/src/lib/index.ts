// Components - UI (shadcn-svelte style barrel exports)
export { Button } from './components/ui/button';
export { Card, CardHeader, CardTitle, CardContent, CardFooter } from './components/ui/card';
export { Badge } from './components/ui/badge';
export { default as LoadingSpinner } from './components/ui/LoadingSpinner.svelte';
export { default as ConfirmDialog } from './components/ui/ConfirmDialog.svelte';

// New UI Primitives
export { EtchedSeparator } from './components/ui/etched-separator';
export { InitialAvatar } from './components/ui/initial-avatar';
export { AccordionSection } from './components/ui/accordion-section';
export { Tooltip } from './components/ui/tooltip';
export { InfoPanel } from './components/ui/info-panel';
export { Toast, ToastQueue, Toaster, toastSuccess, toastError, toastInfo, toastWarning } from './components/ui/toast';
export { SkeletonCard, SkeletonList, SkeletonText, SkeletonAvatar } from './components/ui/skeleton';
export { FormDialog } from './components/ui/form-dialog';
export { InfoDialog } from './components/ui/info-dialog';
export { EmptyState } from './components/ui/empty-state';
export { BackButton } from './components/ui/back-button';

// Components - Layout
export { default as PageContainer } from './components/layout/PageContainer.svelte';
export { default as Header } from './components/layout/Header.svelte';

// Components - Rating
export { default as RadioButton } from './components/rating/RadioButton.svelte';
export { default as ButtonScale } from './components/rating/ButtonScale.svelte';
export { default as ScaleLabels } from './components/rating/ScaleLabels.svelte';

// Components - Assessment
export { default as AssessmentForm } from './components/assessment/AssessmentForm.svelte';
export { default as RoleSelector } from './components/assessment/RoleSelector.svelte';
export { default as MatrixTable } from './components/assessment/MatrixTable.svelte';
export { default as ItemRow } from './components/assessment/ItemRow.svelte';
export { default as ProgressIndicator } from './components/assessment/ProgressIndicator.svelte';
export { default as SubmitSection } from './components/assessment/SubmitSection.svelte';

// Stores
export { sessionStore } from './stores/session';
export { responsesStore, answeredCount, canSubmit } from './stores/responses';

// Utils
export { getOrCreateSessionId, hashSessionId, getSessionHash } from './utils/session-id';
export * from './utils/validators';

// Stores - Additional
export { audioStore } from './stores/audio';
export { toastStore, visibleToasts } from './stores/toast';

// Utilities - Hash
export { simpleHash, hashToHex } from './utils/hash';

// Utilities - Date Formatting
export {
	formatDate,
	formatTime,
	formatDateTime,
	formatRelative,
	formatCustom,
	formatSystemMessage
} from './utils/date-formatting';

// Utilities - Avatar
export { getInitials, getAvatarColor, getAvatarColorValue } from './utils/avatar';

// Utilities - Colors
export { getProblemColors, getAvatarColors, getColorTokens, getColor } from './utils/colors';

// Utilities - Core
export { cn } from './utils';

// Domain Components (barrel re-exports)
// Note: Some types may conflict (EventData, DecisionCategory, etc.)
// Use named imports from specific paths if needed
export * from './components/team';
export * from './components/chat';
export * from './components/events';
export * from './components/analytics';
export * from './components/charts';
export * from './components/admin';
export * from './components/moderation';
export * from './components/registration';
export * from './components/problem';
export * from './components/dashboard';
