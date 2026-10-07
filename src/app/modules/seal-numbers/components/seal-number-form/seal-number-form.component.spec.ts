import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CreateSealNumberUseCase } from '../../../../core/application/usecase/seal-numbers/create-seal-number.usecase';
import { UpdateSealNumberUseCase } from '../../../../core/application/usecase/seal-numbers/update-seal-number.usecase';
import { GetUserLookupUseCase } from '../../../../core/application/usecase/users/get-user-lookup.usecase';
import { SealNumberModel } from '../../../../core/domain/models/seal-number.model';
import { SealNumberFormComponent } from './seal-number-form.component';
import { HttpErrorResponse } from '@angular/common/http';

describe('SealNumberFormComponent', () => {
  let fixture: ComponentFixture<SealNumberFormComponent>;
  let getUserLookup: jasmine.SpyObj<GetUserLookupUseCase>;
  let createUseCase: jasmine.SpyObj<CreateSealNumberUseCase>;
  let updateUseCase: jasmine.SpyObj<UpdateSealNumberUseCase>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<SealNumberFormComponent>>;

  const seal: SealNumberModel = {
    id: 7,
    numeroSello: 'S-7',
    user_ci: 123,
    userName: 'Usuario Sello',
    fecha: '2026-10-07T14:00:00.000Z',
    observacion: 'Original'
  };

  async function setup(data: { action: 'create' | 'edit'; seal?: SealNumberModel }): Promise<void> {
    getUserLookup = jasmine.createSpyObj<GetUserLookupUseCase>('GetUserLookupUseCase', ['execute']);
    getUserLookup.execute.and.resolveTo([{ ci: 123, nombre: 'Usuario Sello' }]);
    createUseCase = jasmine.createSpyObj<CreateSealNumberUseCase>('CreateSealNumberUseCase', ['execute']);
    createUseCase.execute.and.resolveTo(seal);
    updateUseCase = jasmine.createSpyObj<UpdateSealNumberUseCase>('UpdateSealNumberUseCase', ['execute']);
    updateUseCase.execute.and.resolveTo(seal);
    snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    dialogRef = jasmine.createSpyObj<MatDialogRef<SealNumberFormComponent>>('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [SealNumberFormComponent, NoopAnimationsModule],
      providers: [
        { provide: GetUserLookupUseCase, useValue: getUserLookup },
        { provide: CreateSealNumberUseCase, useValue: createUseCase },
        { provide: UpdateSealNumberUseCase, useValue: updateUseCase },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SealNumberFormComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('loads the minimal lookup into the selector without administrative user fields', async () => {
    await setup({ action: 'create' });

    expect(getUserLookup.execute).toHaveBeenCalledOnceWith();
    expect(fixture.componentInstance.users).toEqual([{ ci: 123, nombre: 'Usuario Sello' }]);

    (fixture.nativeElement.querySelector('mat-select') as HTMLElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    const options = Array.from(document.querySelectorAll('.mat-mdc-option'));
    expect(options.some((option) => option.textContent?.includes('123 - Usuario Sello'))).toBeTrue();
  });

  it('sends user_ci rather than a user object when creating', async () => {
    await setup({ action: 'create' });
    fixture.componentInstance.form.patchValue({ user_ci: 123, observacion: 'Creado' });

    await fixture.componentInstance.save();

    expect(createUseCase.execute).toHaveBeenCalledOnceWith({
      numeroSello: '',
      user_ci: 123,
      observacion: 'Creado'
    });
    expect(createUseCase.execute.calls.mostRecent().args[0]).not.toEqual(
      jasmine.objectContaining({ user: jasmine.anything() })
    );
    expect(dialogRef.close).toHaveBeenCalledOnceWith(true);
  });

  it('keeps the existing user_ci write contract when updating', async () => {
    await setup({ action: 'edit', seal });
    fixture.componentInstance.form.patchValue({ observacion: 'Actualizado' });

    await fixture.componentInstance.save();

    expect(updateUseCase.execute).toHaveBeenCalledOnceWith(7, {
      numeroSello: 'S-7',
      user_ci: 123,
      observacion: 'Actualizado'
    });
  });

  it('shows an automatic-number conflict and preserves the create form without retrying', async () => {
    await setup({ action: 'create' });
    const component = fixture.componentInstance;
    component.form.patchValue({ user_ci: 123, observacion: 'Trabajo pendiente' });
    createUseCase.execute.and.rejectWith(new HttpErrorResponse({
      status: 409,
      error: { message: 'duplicate key violates constraint seal_number_key' }
    }));
    spyOn(console, 'error');

    await component.save();

    expect(component.errorTitle).toBe('No se pudo asignar el número');
    expect(component.errorMessage).toBe(
      'El número solicitado ya no está disponible. Puedes intentar generar uno nuevo.'
    );
    expect(component.form.getRawValue()).toEqual({
      numeroSello: '',
      user_ci: 123,
      observacion: 'Trabajo pendiente'
    });
    expect(createUseCase.execute).toHaveBeenCalledTimes(1);
    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(component.saving).toBeFalse();
    expect(snackBar.open.calls.mostRecent().args[0]).not.toContain('constraint');
  });

  it('shows a manual-number conflict and preserves every edit field', async () => {
    await setup({ action: 'edit', seal });
    const component = fixture.componentInstance;
    component.form.patchValue({
      numeroSello: 'S-7-MANUAL',
      user_ci: 123,
      observacion: 'Edición pendiente'
    });
    updateUseCase.execute.and.rejectWith(new HttpErrorResponse({ status: 409 }));
    spyOn(console, 'error');

    await component.save();

    expect(component.errorTitle).toBe('Número ya asignado');
    expect(component.errorMessage).toBe(
      'Este número ya fue utilizado o reservado. Verifica el número e intenta nuevamente con otro.'
    );
    expect(component.form.getRawValue()).toEqual({
      numeroSello: 'S-7-MANUAL',
      user_ci: 123,
      observacion: 'Edición pendiente'
    });
    expect(updateUseCase.execute).toHaveBeenCalledTimes(1);
    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(component.saving).toBeFalse();
  });

  it('warns that a create result is uncertain after a network error', async () => {
    await setup({ action: 'create' });
    const component = fixture.componentInstance;
    component.form.patchValue({ user_ci: 123, observacion: 'Sin confirmar' });
    createUseCase.execute.and.rejectWith(new HttpErrorResponse({ status: 0 }));
    spyOn(console, 'error');

    await component.save();

    expect(component.errorTitle).toBe('Resultado no confirmado');
    expect(component.errorMessage).toBe(
      'No pudimos confirmar si la operación se completó. Revisa el listado antes de intentar nuevamente para evitar registros duplicados.'
    );
    expect(createUseCase.execute).toHaveBeenCalledTimes(1);
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('prevents simultaneous create requests from a double click', async () => {
    await setup({ action: 'create' });
    const component = fixture.componentInstance;
    component.form.patchValue({ user_ci: 123, observacion: 'Única solicitud' });
    let resolveCreate!: (value: SealNumberModel) => void;
    createUseCase.execute.and.returnValue(new Promise((resolve) => { resolveCreate = resolve; }));

    const firstSave = component.save();
    const secondSave = component.save();

    expect(component.saving).toBeTrue();
    expect(createUseCase.execute).toHaveBeenCalledTimes(1);
    fixture.detectChanges();
    const saveButton = fixture.nativeElement.querySelector('button[mat-raised-button]') as HTMLButtonElement;
    expect(saveButton.disabled).toBeTrue();

    resolveCreate(seal);
    await Promise.all([firstSave, secondSave]);
    expect(component.saving).toBeFalse();
  });
});
