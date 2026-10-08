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
import { AuthService } from '../../../../core/application/services/auth.service';
import { IdempotencyKeyFactory } from '../../../../shared/idempotency/idempotency-key.factory';
import { IdempotencySessionService } from '../../../../shared/idempotency/idempotency-session.service';

describe('SealNumberFormComponent', () => {
  let fixture: ComponentFixture<SealNumberFormComponent>;
  let getUserLookup: jasmine.SpyObj<GetUserLookupUseCase>;
  let createUseCase: jasmine.SpyObj<CreateSealNumberUseCase>;
  let updateUseCase: jasmine.SpyObj<UpdateSealNumberUseCase>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<SealNumberFormComponent>>;
  let keyFactory: jasmine.SpyObj<IdempotencyKeyFactory>;
  let idempotencySession: IdempotencySessionService;

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
    keyFactory = jasmine.createSpyObj<IdempotencyKeyFactory>('IdempotencyKeyFactory', ['create']);
    keyFactory.create.and.returnValue('seal-attempt-0001');
    idempotencySession = new IdempotencySessionService();

    await TestBed.configureTestingModule({
      imports: [SealNumberFormComponent, NoopAnimationsModule],
      providers: [
        { provide: GetUserLookupUseCase, useValue: getUserLookup },
        { provide: CreateSealNumberUseCase, useValue: createUseCase },
        { provide: UpdateSealNumberUseCase, useValue: updateUseCase },
        { provide: AuthService, useValue: { getCurrentUser: () => ({ ci: 900 }) } },
        { provide: IdempotencyKeyFactory, useValue: keyFactory },
        { provide: IdempotencySessionService, useValue: idempotencySession },
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

  function actionLabels(): string[] {
    return Array.from(
      fixture.nativeElement.querySelectorAll('.document-dialog-action-row button') as NodeListOf<HTMLButtonElement>
    ).map((button) => button.textContent?.trim() ?? '');
  }

  it('shows only the normal Cancelar and Guardar actions before an uncertain result', async () => {
    await setup({ action: 'create' });

    expect(actionLabels()).toEqual(['Cancelar', 'Guardar']);
    expect(fixture.nativeElement.querySelector('.document-dialog-alert')).toBeNull();
  });

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

    expect(createUseCase.execute).toHaveBeenCalledOnceWith(
      {
        numeroSello: '',
        user_ci: 123,
        observacion: 'Creado'
      },
      'seal-attempt-0001'
    );
    expect(keyFactory.create).toHaveBeenCalledOnceWith();
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
      error: {
        code: 'INSTITUTIONAL_NUMBER_CONFLICT',
        message: 'duplicate key violates constraint seal_number_key'
      }
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
    updateUseCase.execute.and.rejectWith(new HttpErrorResponse({
      status: 409,
      error: { code: 'INSTITUTIONAL_NUMBER_CONFLICT' }
    }));
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
    fixture.detectChanges();

    expect(component.errorTitle).toBe('Resultado no confirmado');
    expect(component.errorMessage).toBe(
      'No pudimos confirmar si la operación se completó. Revisa el listado antes de intentar nuevamente para evitar registros duplicados.'
    );
    expect(createUseCase.execute).toHaveBeenCalledTimes(1);
    expect(component.canRetrySameOperation).toBeTrue();
    expect(dialogRef.close).not.toHaveBeenCalled();

    const alert = fixture.nativeElement.querySelector('.document-dialog-alert') as HTMLElement;
    const content = fixture.nativeElement.querySelector('mat-dialog-content') as HTMLElement;
    const actions = fixture.nativeElement.querySelector('mat-dialog-actions') as HTMLElement;
    const title = alert.querySelector('.document-dialog-alert__title') as HTMLElement;
    const description = alert.querySelector('.document-dialog-alert__description') as HTMLElement;
    expect(alert.classList).toContain('document-dialog-alert--warning');
    expect(title.textContent?.trim()).toBe('Resultado no confirmado');
    expect(description.textContent?.trim()).toBe(component.errorMessage);
    expect(title).not.toBe(description);
    expect(content.contains(alert)).toBeTrue();
    expect(actions.contains(alert)).toBeFalse();
    expect(actionLabels()).toEqual([
      'Reintentar la misma operación',
      'Iniciar nueva operación',
      'Cancelar'
    ]);
    expect(actionLabels()).not.toContain('Guardar');
    expect(component.hasFormChangesSinceAttempt).toBeFalse();
    expect(fixture.nativeElement.querySelector('.document-dialog-change-notice')).toBeNull();

    spyOn(component, 'retrySameOperation').and.resolveTo();
    spyOn(component, 'startNewOperation').and.resolveTo();
    (fixture.nativeElement.querySelector('.document-dialog-primary-action') as HTMLButtonElement).click();
    (fixture.nativeElement.querySelector('.document-dialog-secondary-action') as HTMLButtonElement).click();
    expect(component.retrySameOperation).toHaveBeenCalledOnceWith();
    expect(component.startNewOperation).toHaveBeenCalledOnceWith();
  });

  it('shows changed-attempt guidance for effective DTO changes and hides it after reverting', async () => {
    await setup({ action: 'create' });
    const component = fixture.componentInstance;
    component.form.patchValue({ user_ci: 123, observacion: 'Observación original' });
    createUseCase.execute.and.rejectWith(new HttpErrorResponse({ status: 0 }));
    spyOn(console, 'error');

    await component.save();
    component.form.patchValue({ observacion: 'Observación modificada' });
    fixture.detectChanges();

    const notice = fixture.nativeElement.querySelector('.document-dialog-change-notice') as HTMLElement;
    expect(component.hasFormChangesSinceAttempt).toBeTrue();
    expect(notice.textContent).toContain('Modificaste el formulario después del envío.');
    expect(notice.textContent).toContain('Ver datos del primer intento');
    expect(actionLabels()).toEqual([
      'Reintentar con los datos originales',
      'Usar mis cambios en una nueva solicitud',
      'Cancelar'
    ]);
    expect(createUseCase.execute).toHaveBeenCalledTimes(1);

    component.form.patchValue({ observacion: 'Observación original' });
    fixture.detectChanges();

    expect(component.hasFormChangesSinceAttempt).toBeFalse();
    expect(fixture.nativeElement.querySelector('.document-dialog-change-notice')).toBeNull();
    expect(actionLabels()).toEqual([
      'Reintentar la misma operación',
      'Iniciar nueva operación',
      'Cancelar'
    ]);

    component.form.patchValue({ user_ci: 456 });
    fixture.detectChanges();
    expect(component.hasFormChangesSinceAttempt).toBeTrue();
    expect(createUseCase.execute).toHaveBeenCalledTimes(1);
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
    expect(keyFactory.create).toHaveBeenCalledTimes(1);
  });

  it('replays the exact key and immutable DTO even after the form changes', async () => {
    await setup({ action: 'create' });
    const component = fixture.componentInstance;
    component.form.patchValue({ user_ci: 123, observacion: 'Observación A' });
    createUseCase.execute.and.rejectWith(new HttpErrorResponse({ status: 0 }));
    spyOn(console, 'error');

    await component.save();
    component.form.patchValue({ user_ci: 456, observacion: 'Observación B' });
    createUseCase.execute.and.resolveTo(seal);
    await component.retrySameOperation();

    expect(createUseCase.execute.calls.argsFor(1)).toEqual([
      { numeroSello: '', user_ci: 123, observacion: 'Observación A' },
      'seal-attempt-0001'
    ]);
    expect(keyFactory.create).toHaveBeenCalledTimes(1);
    expect(dialogRef.close).toHaveBeenCalledOnceWith(true);
  });

  it('starts a user-confirmed new operation with a new key and the current form', async () => {
    await setup({ action: 'create' });
    const component = fixture.componentInstance;
    keyFactory.create.and.returnValues('seal-attempt-0001', 'seal-attempt-0002');
    component.form.patchValue({ user_ci: 123, observacion: 'Observación A' });
    createUseCase.execute.and.rejectWith(new HttpErrorResponse({ status: 503 }));
    spyOn(console, 'error');
    spyOn(window, 'confirm').and.returnValue(true);

    await component.save();
    component.form.patchValue({ user_ci: 123, observacion: 'Observación B' });
    createUseCase.execute.and.resolveTo(seal);
    await component.startNewOperation();

    expect(createUseCase.execute.calls.argsFor(1)).toEqual([
      { numeroSello: '', user_ci: 123, observacion: 'Observación B' },
      'seal-attempt-0002'
    ]);
    expect(keyFactory.create).toHaveBeenCalledTimes(2);
    expect(window.confirm).toHaveBeenCalledOnceWith(
      'El primer documento podría haberse creado. Revisa el listado antes de iniciar una nueva solicitud con los datos actuales. ¿Deseas continuar?'
    );
  });

  it('does not use current changes when starting a new operation is not confirmed', async () => {
    await setup({ action: 'create' });
    const component = fixture.componentInstance;
    component.form.patchValue({ user_ci: 123, observacion: 'Original' });
    createUseCase.execute.and.rejectWith(new HttpErrorResponse({ status: 0 }));
    spyOn(console, 'error');
    spyOn(window, 'confirm').and.returnValue(false);

    await component.save();
    component.form.patchValue({ observacion: 'Cambio no confirmado' });
    await component.startNewOperation();

    expect(createUseCase.execute).toHaveBeenCalledTimes(1);
    expect(keyFactory.create).toHaveBeenCalledTimes(1);
  });

  it('keeps the existing confirmation when cancelling an uncertain attempt', async () => {
    await setup({ action: 'create' });
    const component = fixture.componentInstance;
    component.form.patchValue({ user_ci: 123, observacion: 'Pendiente' });
    createUseCase.execute.and.rejectWith(new HttpErrorResponse({ status: 0 }));
    spyOn(console, 'error');
    spyOn(window, 'confirm').and.returnValue(false);

    await component.save();
    component.close();

    expect(window.confirm).toHaveBeenCalledOnceWith(
      'El resultado de la operación no está confirmado. Si cierras, ya no podrás reintentar con la misma clave desde este formulario. ¿Deseas cerrar?'
    );
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  [
    {
      code: 'IDEMPOTENCY_KEY_REUSED',
      title: 'Operación registrada con otros datos',
      message: 'Esta operación ya fue registrada con datos diferentes. Revisa la información antes de iniciar una nueva generación.'
    },
    {
      code: 'IDEMPOTENCY_RESULT_GONE',
      title: 'Documento eliminado',
      message: 'Esta operación ya fue procesada, pero el documento generado posteriormente fue eliminado. No se realizará otra generación automática.'
    },
    {
      code: 'IDEMPOTENCY_RESULT_CHANGED',
      title: 'Documento modificado',
      message: 'La operación original ya fue procesada, pero el documento cambió posteriormente. Revisa su estado actual.'
    }
  ].forEach(({ code, title, message }) => {
    it(`shows the dedicated ${code} message without retrying`, async () => {
      await setup({ action: 'create' });
      const component = fixture.componentInstance;
      component.form.patchValue({ user_ci: 123, observacion: 'Pendiente' });
      createUseCase.execute.and.rejectWith(new HttpErrorResponse({
        status: 409,
        error: { code, message: 'SQLSTATE internal detail' }
      }));
      spyOn(console, 'error');

      await component.save();

      expect(component.errorTitle).toBe(title);
      expect(component.errorMessage).toBe(message);
      expect(component.errorMessage).not.toContain('SQLSTATE');
      expect(createUseCase.execute).toHaveBeenCalledTimes(1);
      expect(component.canStartNewOperation).toBeTrue();
    });
  });

  it('ignores a late result after logout invalidates the attempt', async () => {
    await setup({ action: 'create' });
    const component = fixture.componentInstance;
    component.form.patchValue({ user_ci: 123, observacion: 'Sesión anterior' });
    let resolveCreate!: (value: SealNumberModel) => void;
    createUseCase.execute.and.returnValue(new Promise((resolve) => { resolveCreate = resolve; }));

    const save = component.save();
    idempotencySession.invalidatePendingAttempts();
    resolveCreate(seal);
    await save;

    await component.save();

    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(component.canRetrySameOperation).toBeFalse();
    expect(createUseCase.execute).toHaveBeenCalledTimes(1);
  });
});
