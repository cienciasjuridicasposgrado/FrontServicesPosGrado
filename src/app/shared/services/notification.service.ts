import { MatSnackBar } from "@angular/material/snack-bar";

export class NotificationService {
    constructor(private snackBar: MatSnackBar) {}

    showSuccess(message: string): void {
        this.snackBar.open(message, 'Cerrar', {
            duration: 5000,
            panelClass: ['success-snackbar'],
            horizontalPosition: 'right',
            verticalPosition: 'top'
        });
    }

    showError(message: string): void {
        this.snackBar.open(message, 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar'],
            horizontalPosition: 'right',
            verticalPosition: 'top'
        });
    }

    showWarning(message: string): void {
        this.snackBar.open(message, 'Cerrar', {
            duration: 5000,
            panelClass: ['warning-snackbar'],
            horizontalPosition: 'right',
            verticalPosition: 'top'
        });
    }
}