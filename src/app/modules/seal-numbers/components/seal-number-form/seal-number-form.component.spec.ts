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
import { PermissionService } from '../../../../core/application/services/permission.service';
import { IdempotencyKeyFactory } from '../../../../shared/idempotency/idempotency-key.factory';
import { IdempotencySessionService } from '../../../../shared/idempotency/idempotency-session.service';
import { ConfirmationDialogService } from '../../../../shared/dialogs/confirmation-dialog/confirmation-dialog.service';

describe('SealNumberFormComponent', () => {
  let fixture: ComponentFixture<SealNumberFormComponent>;
  let getUserLookup: jasmine.SpyObj<GetUserLookupUseCase>;
  let createUseCase: jasmine.SpyObj<CreateSealNumberUseCase>;
  let updateUseCase: jasmine.SpyObj<UpdateSealNumberUseCase>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<SealNumberFormComponent>>;
  let keyFactory: jasmine.SpyObj<IdempotencyKeyFactory>;
  let idempotencySession: IdempotencySessionService;
  let confirmationDialog: jasmine.SpyObj<ConfirmationDialogService>;
  let permissionService: jasmine.SpyObj<PermissionService>;
  let actorCi = 900;

  const seal: SealNumberModel = {
    id: 7,
    numeroSello: 'S-7',
    user_ci: 123,
    userName: 'Usuario Sello',
    fecha: '2026-10-07T14:00:00.000Z',
    observacion: 'Original'
  };

  async function setup(
    data: { action: 'create' | 'edit'; seal?: SealNumberModel },
    options: { limited?: boolean; canGenerate?: boolean; lookup?: { ci: number; nombre: string }[]; actorCi?: number } = {}
  ): Promise<void> {
    getUserLookup = jasmine.createSpyObj<GetUserLookupUseCase>('GetUserLookupUseCase', ['execute']);
    getUserLookup.execute.and.resolveTo(options.lookup ?? [{ ci: 123, nombre: 'Usuario Sello' }]);
    createUseCase = jasmine.createSpyObj<CreateSealNumberUseCase>('CreateSealNumberUseCase', ['execute']);
    createUseCase.execute.and.resolveTo(seal);
    updateUseCase = jasmine.createSpyObj<UpdateSealNumberUseCase>('UpdateSealNumberUseCase', ['execute']);
    updateUseCase.execute.and.resolveTo(seal);
    snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    dialogRef = jasmine.createSpyObj<MatDialogRef<SealNumberFormComponent>>('MatDialogRef', ['close']);
    keyFactory = jasmine.createSpyObj<IdempotencyKeyFactory>('IdempotencyKeyFactory', ['create']);
    keyFactory.create.and.returnValue('seal-attempt-0001');
    idempotencySession = new IdempotencySessionService();
    confirmationDialog = jasmine.createSpyObj<ConfirmationDialogService>('ConfirmationDialogService', ['confirm']);
    confirmationDialog.confirm.and.resolveTo(true);
    permissionService = jasmine.createSpyObj<PermissionService>('PermissionService', ['has', 'hasAll']);
    permissionService.has.and.returnValue(options.canGenerate ?? true);
    permissionService.hasAll.and.returnValue(!options.limited);
    actorCi = options.actorCi ?? 900;

    await TestBed.configureTestingModule({
      imports: [SealNumberFormComponent, NoopAnimationsModule],
      providers: [
        { provide: GetUserLookupUseCase, useValue: getUserLookup },
        { provide: CreateSealNumberUseCase, useValue: createUseCase },
        { provide: UpdateSealNumberUseCase, useValue: updateUseCase },
        { provide: AuthService, useValue: { getCurrentUser: () => ({ ci: actorCi }) } },
        { provide: PermissionService, useValue: permissionService },
        { provide: IdempotencyKeyFactory, useValue: keyFactory },
        { provide: IdempotencySessionService, useValue: idempotencySession },
        { provide: ConfirmationDialogService, useValue: confirmationDialog },
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

  it('fixes the applicant to the authenticated operator and sends that CI', async () => {
    await setup({ action: 'create' }, {
      limited: true, actorCi: 900,
      lookup: [{ ci: 900, nombre: 'Operadora propia' }]
    });
    const component = fixture.componentInstance;
    expect(fixture.nativeElement.querySelector('mat-select')).toBeNull();
    expect(fixture.nativeElement.querySelector('.applicant-identity').textContent)
      .toContain('Operadora propia · CI 900');
    expect(fixture.nativeElement.textContent).toContain('Este documento se registrará a tu nombre');
    expect(component.form.get('user_ci')?.disabled).toBeTrue();
    expect(component.applicantReady).toBeTrue();
    await component.save();
    expect(createUseCase.execute).toHaveBeenCalledOnceWith(
      jasmine.objectContaining({ user_ci: 900 }), 'seal-attempt-0001'
    );
  });

  it('does not choose another lookup identity or generate when self lookup fails', async () => {
    await setup({ action: 'create' }, {
      limited: true, actorCi: 900,
      lookup: [{ ci: 123, nombre: 'Otra persona' }]
    });
    spyOn(console, 'error');
    const component = fixture.componentInstance;
    expect(component.ownApplicant).toBeNull();
    expect(component.applicantReady).toBeFalse();
    expect(component.form.getRawValue().user_ci).toBe('');
    await component.save();
    expect(createUseCase.execute).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('mat-select')).toBeNull();
  });

  it('keeps the own CI in a limited operator update', async () => {
    await setup({ action: 'edit', seal }, {
      limited: true, actorCi: 123, lookup: [{ ci: 123, nombre: 'Usuario Sello' }]
    });
    expect(fixture.componentInstance.form.get('user_ci')?.disabled).toBeTrue();
    fixture.componentInstance.form.patchValue({ observacion: 'Actualizada' });
    await fixture.componentInstance.save();
    expect(updateUseCase.execute).toHaveBeenCalledOnceWith(7,
      jasmine.objectContaining({ user_ci: 123, observacion: 'Actualizada' })
    );
  });

  it('refuses a stale foreign seal in the limited edit form', async () => {
    spyOn(console, 'error');
    await setup({ action: 'edit', seal }, {
      limited: true, actorCi: 900, lookup: [{ ci: 900, nombre: 'Operadora' }]
    });
    expect(fixture.componentInstance.applicantReady).toBeFalse();
    await fixture.componentInstance.save();
    expect(updateUseCase.execute).not.toHaveBeenCalled();
  });

  it('does not generate without the seal permission even when the actor manages users', async () => {
    spyOn(console, 'error');
    await setup({ action: 'create' }, { canGenerate: false });
    expect(getUserLookup.execute).not.toHaveBeenCalled();
    await fixture.componentInstance.save();
    expect(createUseCase.execute).not.toHaveBeenCalled();
  });

  it('keeps identity fixed for an operator allowed to generate both document types', async () => {
    await setup({ action: 'create' }, {
      limited: true, actorCi: 900, lookup: [{ ci: 900, nombre: 'Operadora' }]
    });
    expect(permissionService.hasAll).toHaveBeenCalled();
    expect(fixture.componentInstance.canSelectApplicant).toBeFalse();
    expect(fixture.nativeElement.querySelector('mat-select')).toBeNull();
    expect(fixture.componentInstance.form.getRawValue().user_ci).toBe(900);
  });

  it('ignores a late lookup result after the session is invalidated', async () => {
    await setup({ action: 'create' }, {
      limited: true, actorCi: 900, lookup: [{ ci: 900, nombre: 'Operadora' }]
    });
    let resolveLookup!: (users: { ci: number; nombre: string }[]) => void;
    getUserLookup.execute.and.returnValue(new Promise((resolve) => { resolveLookup = resolve; }));
    const pending = fixture.componentInstance.loadUsers();
    idempotencySession.invalidatePendingAttempts();
    resolveLookup([{ ci: 900, nombre: 'Operadora' }]);
    await pending;
    expect(fixture.componentInstance.ownApplicant).toBeNull();
    expect(fixture.componentInstance.applicantReady).toBeFalse();
    expect(dialogRef.close).toHaveBeenCalledOnceWith(false);
  });

  it('does not replay a 403 or replace the original idempotency key', async () => {
    await setup({ action: 'create' }, {
      limited: true, actorCi: 900, lookup: [{ ci: 900, nombre: 'Operadora propia' }]
    });
    createUseCase.execute.and.rejectWith(new HttpErrorResponse({ status: 403 }));
    spyOn(console, 'error');
    await fixture.componentInstance.save();
    await fixture.componentInstance.save();
    expect(createUseCase.execute).toHaveBeenCalledTimes(1);
    expect(createUseCase.execute.calls.first().args[0].user_ci).toBe(900);
    expect(keyFactory.create).toHaveBeenCalledTimes(1);
  });

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
    expect(dialogRef.close).toHaveBeenCalledOnceWith({ createdNumber: 'S-7' });
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
    expect(dialogRef.close).toHaveBeenCalledOnceWith({ createdNumber: 'S-7' });
  });

  it('starts a user-confirmed new operation with a new key and the current form', async () => {
    await setup({ action: 'create' });
    const component = fixture.componentInstance;
    keyFactory.create.and.returnValues('seal-attempt-0001', 'seal-attempt-0002');
    component.form.patchValue({ user_ci: 123, observacion: 'Observación A' });
    createUseCase.execute.and.rejectWith(new HttpErrorResponse({ status: 503 }));
    spyOn(console, 'error');
    confirmationDialog.confirm.and.resolveTo(true);

    await component.save();
    component.form.patchValue({ user_ci: 123, observacion: 'Observación B' });
    createUseCase.execute.and.resolveTo(seal);
    await component.startNewOperation();

    expect(createUseCase.execute.calls.argsFor(1)).toEqual([
      { numeroSello: '', user_ci: 123, observacion: 'Observación B' },
      'seal-attempt-0002'
    ]);
    expect(keyFactory.create).toHaveBeenCalledTimes(2);
    expect(confirmationDialog.confirm).toHaveBeenCalledOnceWith({
      title: 'Iniciar una nueva operación',
      description: 'El primer documento podría haberse creado. Revisa el listado antes de iniciar una nueva solicitud con los datos actuales.',
      confirmLabel: 'Iniciar nueva operación',
      variant: 'warning'
    });
  });

  it('does not use current changes when starting a new operation is not confirmed', async () => {
    await setup({ action: 'create' });
    const component = fixture.componentInstance;
    component.form.patchValue({ user_ci: 123, observacion: 'Original' });
    createUseCase.execute.and.rejectWith(new HttpErrorResponse({ status: 0 }));
    spyOn(console, 'error');
    confirmationDialog.confirm.and.resolveTo(false);

    await component.save();
    component.form.patchValue({ observacion: 'Cambio no confirmado' });
    await component.startNewOperation();

    expect(createUseCase.execute).toHaveBeenCalledTimes(1);
    expect(keyFactory.create).toHaveBeenCalledTimes(1);
  });

  it('keeps the existing warning when cancelling an uncertain attempt', async () => {
    await setup({ action: 'create' });
    const component = fixture.componentInstance;
    component.form.patchValue({ user_ci: 123, observacion: 'Pendiente' });
    createUseCase.execute.and.rejectWith(new HttpErrorResponse({ status: 0 }));
    spyOn(console, 'error');
    confirmationDialog.confirm.and.resolveTo(false);

    await component.save();
    await component.close();

    expect(confirmationDialog.confirm).toHaveBeenCalledOnceWith({
      title: 'Cerrar sin confirmar el resultado',
      description: 'El resultado de la operación no está confirmado. Si cierras, ya no podrás reintentar con la misma clave desde este formulario.',
      confirmLabel: 'Cerrar formulario',
      variant: 'warning'
    });
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

    expect(dialogRef.close).toHaveBeenCalledOnceWith(false);
    expect(component.canRetrySameOperation).toBeFalse();
    expect(createUseCase.execute).toHaveBeenCalledTimes(1);
  });
});
