import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CreateLetterNumberUseCase } from '../../../../core/application/usecase/letter-numbers/create-letter-number.usecase';
import { UpdateLetterNumberUseCase } from '../../../../core/application/usecase/letter-numbers/update-letter-number.usecase';
import { GetUserLookupUseCase } from '../../../../core/application/usecase/users/get-user-lookup.usecase';
import { LetterNumberModel } from '../../../../core/domain/models/letter-number.model';
import { LetterNumberFormComponent } from './letter-number-form.component';
import { HttpErrorResponse } from '@angular/common/http';

describe('LetterNumberFormComponent', () => {
  let fixture: ComponentFixture<LetterNumberFormComponent>;
  let getUserLookup: jasmine.SpyObj<GetUserLookupUseCase>;
  let createUseCase: jasmine.SpyObj<CreateLetterNumberUseCase>;
  let updateUseCase: jasmine.SpyObj<UpdateLetterNumberUseCase>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<LetterNumberFormComponent>>;

  const letter: LetterNumberModel = {
    id: 7,
    numero_carta: '1750',
    fecha: '2026-10-07T14:00:00.000Z',
    observacion: 'Original',
    user: { ci: 123, nombre: 'Usuario Carta' }
  };

  async function setup(data: LetterNumberModel | undefined): Promise<void> {
    getUserLookup = jasmine.createSpyObj<GetUserLookupUseCase>('GetUserLookupUseCase', ['execute']);
    getUserLookup.execute.and.resolveTo([{ ci: 123, nombre: 'Usuario Carta' }]);
    createUseCase = jasmine.createSpyObj<CreateLetterNumberUseCase>('CreateLetterNumberUseCase', ['execute']);
    createUseCase.execute.and.resolveTo(letter);
    updateUseCase = jasmine.createSpyObj<UpdateLetterNumberUseCase>('UpdateLetterNumberUseCase', ['execute']);
    updateUseCase.execute.and.resolveTo(letter);
    dialogRef = jasmine.createSpyObj<MatDialogRef<LetterNumberFormComponent>>('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [LetterNumberFormComponent, NoopAnimationsModule],
      providers: [
        { provide: GetUserLookupUseCase, useValue: getUserLookup },
        { provide: CreateLetterNumberUseCase, useValue: createUseCase },
        { provide: UpdateLetterNumberUseCase, useValue: updateUseCase },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LetterNumberFormComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('loads the minimal lookup into the selector without administrative user fields', async () => {
    await setup(undefined);

    expect(getUserLookup.execute).toHaveBeenCalledOnceWith();
    expect(fixture.componentInstance.users).toEqual([{ ci: 123, nombre: 'Usuario Carta' }]);

    (fixture.nativeElement.querySelector('mat-select') as HTMLElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    const options = Array.from(document.querySelectorAll('.mat-mdc-option'));
    expect(options.some((option) => option.textContent?.includes('Usuario Carta (123)'))).toBeTrue();
  });

  it('hydrates letter.user.ci and sends only the write DTO on update', async () => {
    await setup(letter);
    expect(fixture.componentInstance.form.controls['user_ci'].value).toBe(123);

    fixture.componentInstance.form.patchValue({ observacion: 'Actualizada' });
    await fixture.componentInstance.save();

    expect(updateUseCase.execute).toHaveBeenCalledOnceWith(7, {
      user_ci: 123,
      observacion: 'Actualizada'
    });
  });

  it('sends user_ci rather than the lookup object when creating', async () => {
    await setup(undefined);
    fixture.componentInstance.form.patchValue({ user_ci: 123, observacion: 'Nueva' });

    await fixture.componentInstance.save();

    expect(createUseCase.execute).toHaveBeenCalledOnceWith({
      user_ci: 123,
      observacion: 'Nueva'
    });
    expect(createUseCase.execute.calls.mostRecent().args[0]).not.toEqual(
      jasmine.objectContaining({ user: jasmine.anything() })
    );
    expect(dialogRef.close).toHaveBeenCalledOnceWith(true);
  });

  it('shows an automatic-number conflict and preserves the create form without retrying', async () => {
    await setup(undefined);
    const component = fixture.componentInstance;
    component.form.patchValue({ user_ci: 123, observacion: 'Carta pendiente' });
    createUseCase.execute.and.rejectWith(new HttpErrorResponse({
      status: 409,
      error: { message: 'QueryFailedError SQLSTATE 23505 letter_number_key' }
    }));
    spyOn(console, 'error');

    await component.save();

    expect(component.errorTitle).toBe('No se pudo asignar el número');
    expect(component.errorMessage).toBe(
      'El número solicitado ya no está disponible. Puedes intentar generar uno nuevo.'
    );
    expect(component.form.getRawValue()).toEqual({ user_ci: 123, observacion: 'Carta pendiente' });
    expect(component.errorMessage).not.toContain('SQLSTATE');
    expect(createUseCase.execute).toHaveBeenCalledTimes(1);
    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(component.saving).toBeFalse();
  });

  it('warns that a create result is uncertain after a network error', async () => {
    await setup(undefined);
    const component = fixture.componentInstance;
    component.form.patchValue({ user_ci: 123, observacion: 'Sin confirmar' });
    createUseCase.execute.and.rejectWith(new HttpErrorResponse({ status: 0 }));
    spyOn(console, 'error');

    await component.save();

    expect(component.errorTitle).toBe('Resultado no confirmado');
    expect(component.errorMessage).toBe(
      'No pudimos confirmar si la operación se completó. Revisa el listado antes de intentar nuevamente para evitar registros duplicados.'
    );
    expect(component.form.getRawValue()).toEqual({ user_ci: 123, observacion: 'Sin confirmar' });
    expect(createUseCase.execute).toHaveBeenCalledTimes(1);
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('prevents simultaneous create requests from a double click', async () => {
    await setup(undefined);
    const component = fixture.componentInstance;
    component.form.patchValue({ user_ci: 123, observacion: 'Única solicitud' });
    let resolveCreate!: (value: LetterNumberModel) => void;
    createUseCase.execute.and.returnValue(new Promise((resolve) => { resolveCreate = resolve; }));

    const firstSave = component.save();
    const secondSave = component.save();

    expect(component.saving).toBeTrue();
    expect(createUseCase.execute).toHaveBeenCalledTimes(1);
    fixture.detectChanges();
    const saveButton = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(saveButton.disabled).toBeTrue();

    resolveCreate(letter);
    await Promise.all([firstSave, secondSave]);
    expect(component.saving).toBeFalse();
  });

  it('preserves the nested read model and write DTO when an update returns 409', async () => {
    await setup(letter);
    const component = fixture.componentInstance;
    component.form.patchValue({ user_ci: 123, observacion: 'Edición pendiente' });
    updateUseCase.execute.and.rejectWith(new HttpErrorResponse({ status: 409 }));
    spyOn(console, 'error');

    await component.save();

    expect(component.generatedNumber).toBe('1750');
    expect(component.form.getRawValue()).toEqual({ user_ci: 123, observacion: 'Edición pendiente' });
    expect(updateUseCase.execute).toHaveBeenCalledOnceWith(7, {
      user_ci: 123,
      observacion: 'Edición pendiente'
    });
    expect(updateUseCase.execute.calls.mostRecent().args[1]).not.toEqual(
      jasmine.objectContaining({ numero_carta: jasmine.anything(), user: jasmine.anything() })
    );
    expect(component.errorTitle).toBe('No se pudo asignar el número');
    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(component.saving).toBeFalse();
  });
});
