import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Clipboard } from '@angular/cdk/clipboard';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DocumentCreatedDialogComponent } from './document-created-dialog.component';

describe('DocumentCreatedDialogComponent', () => {
  it('shows and copies the exact number supplied by the confirmed response', async () => {
    const clipboard = jasmine.createSpyObj<Clipboard>('Clipboard', ['copy']);
    clipboard.copy.and.returnValue(true);
    const snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    await TestBed.configureTestingModule({
      imports: [DocumentCreatedDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { type: 'Sello', number: 'S-1304137' } },
        { provide: MatDialogRef, useValue: jasmine.createSpyObj('MatDialogRef', ['close']) },
        { provide: Clipboard, useValue: clipboard },
        { provide: MatSnackBar, useValue: snackBar }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(DocumentCreatedDialogComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sello generado correctamente');
    expect(fixture.nativeElement.querySelector('.document-number').textContent).toBe('S-1304137');
    fixture.componentInstance.copyNumber();
    expect(clipboard.copy).toHaveBeenCalledOnceWith('S-1304137');
  });
});
