import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of, Subject } from 'rxjs';
import { ConfirmationDialogComponent } from './confirmation-dialog.component';
import { ConfirmationDialogService } from './confirmation-dialog.service';

describe('ConfirmationDialogService', () => {
  let dialog: jasmine.SpyObj<MatDialog>;
  let service: ConfirmationDialogService;

  beforeEach(() => {
    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    TestBed.configureTestingModule({
      providers: [
        ConfirmationDialogService,
        { provide: MatDialog, useValue: dialog }
      ]
    });
    service = TestBed.inject(ConfirmationDialogService);
  });

  it('opens a responsive dialog with safe focus and restores it afterwards', async () => {
    dialog.open.and.returnValue({ afterClosed: () => of(true) } as never);
    const data = {
      title: 'Anular salida',
      description: 'La cantidad volverá al inventario.',
      confirmLabel: 'Anular salida',
      variant: 'warning' as const
    };

    await expectAsync(service.confirm(data)).toBeResolvedTo(true);

    expect(dialog.open).toHaveBeenCalledOnceWith(ConfirmationDialogComponent, jasmine.objectContaining({
      width: '480px',
      maxWidth: 'calc(100vw - 24px)',
      maxHeight: 'calc(100dvh - 24px)',
      panelClass: 'lexi-confirm-dialog-panel',
      autoFocus: '.confirmation-dialog__cancel',
      restoreFocus: true,
      closeOnNavigation: true,
      disableClose: false,
      data
    }));
  });

  [undefined, false].forEach((result) => {
    it(`treats ${String(result)} from Escape or backdrop as cancellation`, async () => {
      dialog.open.and.returnValue({ afterClosed: () => of(result) } as never);

      await expectAsync(service.confirm({
        title: 'Confirmar acción',
        description: 'Descripción',
        confirmLabel: 'Confirmar'
      })).toBeResolvedTo(false);
    });
  });

  it('ignores a second request while the first confirmation is open', async () => {
    const closed = new Subject<boolean>();
    dialog.open.and.returnValue({ afterClosed: () => closed } as never);
    const data = {
      title: 'Eliminar registro',
      description: 'Descripción',
      confirmLabel: 'Eliminar'
    };

    const first = service.confirm(data);
    const second = service.confirm(data);
    closed.next(true);
    closed.complete();

    await expectAsync(first).toBeResolvedTo(true);
    await expectAsync(second).toBeResolvedTo(false);
    expect(dialog.open).toHaveBeenCalledTimes(1);
  });
});
