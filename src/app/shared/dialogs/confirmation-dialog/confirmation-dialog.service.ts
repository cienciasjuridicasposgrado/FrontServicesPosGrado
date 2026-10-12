import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ConfirmationDialogComponent } from './confirmation-dialog.component';
import { ConfirmationDialogData } from './confirmation-dialog.model';

@Injectable({ providedIn: 'root' })
export class ConfirmationDialogService {
  private confirmationOpen = false;

  constructor(private readonly dialog: MatDialog) {}

  async confirm(data: ConfirmationDialogData): Promise<boolean> {
    if (this.confirmationOpen) return false;
    this.confirmationOpen = true;

    try {
      const result = await firstValueFrom(this.dialog.open<
        ConfirmationDialogComponent,
        ConfirmationDialogData,
        boolean
      >(ConfirmationDialogComponent, {
        width: '480px',
        maxWidth: 'calc(100vw - 24px)',
        maxHeight: 'calc(100dvh - 24px)',
        panelClass: 'lexi-confirm-dialog-panel',
        autoFocus: '.confirmation-dialog__cancel',
        restoreFocus: true,
        closeOnNavigation: true,
        disableClose: false,
        data
      }).afterClosed());

      return result === true;
    } finally {
      this.confirmationOpen = false;
    }
  }
}
