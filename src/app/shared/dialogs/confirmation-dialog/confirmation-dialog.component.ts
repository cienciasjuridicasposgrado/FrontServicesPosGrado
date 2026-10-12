import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ConfirmationDialogData } from './confirmation-dialog.model';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './confirmation-dialog.component.html',
  styleUrl: './confirmation-dialog.component.scss'
})
export class ConfirmationDialogComponent {
  private resolved = false;

  constructor(
    private readonly dialogRef: MatDialogRef<ConfirmationDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) readonly data: ConfirmationDialogData
  ) {}

  get variant(): NonNullable<ConfirmationDialogData['variant']> {
    return this.data.variant ?? 'normal';
  }

  get icon(): string {
    if (this.variant === 'destructive') return 'delete_outline';
    if (this.variant === 'warning') return 'warning_amber';
    return 'help_outline';
  }

  resolve(confirmed: boolean): void {
    if (this.resolved) return;
    this.resolved = true;
    this.dialogRef.close(confirmed);
  }
}
