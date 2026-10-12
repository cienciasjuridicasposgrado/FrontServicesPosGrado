export type ConfirmationDialogVariant = 'normal' | 'warning' | 'destructive';

export interface ConfirmationDialogData {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: ConfirmationDialogVariant;
  recordLabel?: string;
}
