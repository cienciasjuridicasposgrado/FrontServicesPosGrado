import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ConfirmationDialogComponent } from './confirmation-dialog.component';
import { ConfirmationDialogData } from './confirmation-dialog.model';

describe('ConfirmationDialogComponent', () => {
  let fixture: ComponentFixture<ConfirmationDialogComponent>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<ConfirmationDialogComponent, boolean>>;

  const data: ConfirmationDialogData = {
    title: 'Eliminar ítem',
    description: 'Se eliminará el registro seleccionado.',
    confirmLabel: 'Eliminar',
    cancelLabel: 'Conservar',
    variant: 'destructive',
    recordLabel: 'Papel bond · PAP-01'
  };

  beforeEach(async () => {
    dialogRef = jasmine.createSpyObj<MatDialogRef<ConfirmationDialogComponent, boolean>>(
      'MatDialogRef',
      ['close']
    );

    await TestBed.configureTestingModule({
      imports: [ConfirmationDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmationDialogComponent);
    fixture.detectChanges();
  });

  it('shows the title, description and affected record', () => {
    const content = fixture.nativeElement as HTMLElement;

    expect(content.querySelector('h2')?.textContent?.trim()).toBe('Eliminar ítem');
    expect(content.querySelector('.confirmation-dialog__description')?.textContent?.trim())
      .toBe('Se eliminará el registro seleccionado.');
    expect(content.querySelector('.confirmation-dialog__record strong')?.textContent?.trim())
      .toBe('Papel bond · PAP-01');
    expect(content.querySelector('.confirmation-dialog')?.classList)
      .toContain('confirmation-dialog--destructive');
  });

  it('returns cancellation from the secondary action', () => {
    const cancel = fixture.nativeElement.querySelector('.confirmation-dialog__cancel') as HTMLButtonElement;

    cancel.click();

    expect(cancel.type).toBe('button');
    expect(cancel.textContent?.trim()).toBe('Conservar');
    expect(dialogRef.close).toHaveBeenCalledOnceWith(false);
  });

  it('returns confirmation only once even after a double click', () => {
    const confirm = fixture.nativeElement.querySelector('.confirmation-dialog__confirm') as HTMLButtonElement;

    confirm.click();
    confirm.click();

    expect(confirm.type).toBe('button');
    expect(confirm.textContent?.trim()).toBe('Eliminar');
    expect(dialogRef.close).toHaveBeenCalledOnceWith(true);
  });
});
