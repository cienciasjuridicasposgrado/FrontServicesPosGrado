import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CreateSealNumberUseCase } from '../../../../core/application/usecase/seal-numbers/create-seal-number.usecase';
import { UpdateSealNumberUseCase } from '../../../../core/application/usecase/seal-numbers/update-seal-number.usecase';
import { GetUserLookupUseCase } from '../../../../core/application/usecase/users/get-user-lookup.usecase';
import { SealNumberModel } from '../../../../core/domain/models/seal-number.model';
import { SealNumberFormComponent } from './seal-number-form.component';

describe('SealNumberFormComponent', () => {
  let fixture: ComponentFixture<SealNumberFormComponent>;
  let getUserLookup: jasmine.SpyObj<GetUserLookupUseCase>;
  let createUseCase: jasmine.SpyObj<CreateSealNumberUseCase>;
  let updateUseCase: jasmine.SpyObj<UpdateSealNumberUseCase>;

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

    await TestBed.configureTestingModule({
      imports: [SealNumberFormComponent, NoopAnimationsModule],
      providers: [
        { provide: GetUserLookupUseCase, useValue: getUserLookup },
        { provide: CreateSealNumberUseCase, useValue: createUseCase },
        { provide: UpdateSealNumberUseCase, useValue: updateUseCase },
        { provide: MatSnackBar, useValue: { open: jasmine.createSpy('open') } },
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
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
});
