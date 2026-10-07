import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CreateLetterNumberUseCase } from '../../../../core/application/usecase/letter-numbers/create-letter-number.usecase';
import { UpdateLetterNumberUseCase } from '../../../../core/application/usecase/letter-numbers/update-letter-number.usecase';
import { GetUserLookupUseCase } from '../../../../core/application/usecase/users/get-user-lookup.usecase';
import { LetterNumberModel } from '../../../../core/domain/models/letter-number.model';
import { LetterNumberFormComponent } from './letter-number-form.component';

describe('LetterNumberFormComponent', () => {
  let fixture: ComponentFixture<LetterNumberFormComponent>;
  let getUserLookup: jasmine.SpyObj<GetUserLookupUseCase>;
  let createUseCase: jasmine.SpyObj<CreateLetterNumberUseCase>;
  let updateUseCase: jasmine.SpyObj<UpdateLetterNumberUseCase>;

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

    await TestBed.configureTestingModule({
      imports: [LetterNumberFormComponent, NoopAnimationsModule],
      providers: [
        { provide: GetUserLookupUseCase, useValue: getUserLookup },
        { provide: CreateLetterNumberUseCase, useValue: createUseCase },
        { provide: UpdateLetterNumberUseCase, useValue: updateUseCase },
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
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
  });
});
