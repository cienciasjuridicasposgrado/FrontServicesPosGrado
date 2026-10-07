import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CreateLetterNumberUseCase } from '../../../../core/application/usecase/letter-numbers/create-letter-number.usecase';
import { UpdateLetterNumberUseCase } from '../../../../core/application/usecase/letter-numbers/update-letter-number.usecase';
import { LetterNumberModel } from '../../../../core/domain/models/letter-number.model';
import { UsersRepository } from '../../../../core/domain/repositories/users.repository';
import { LetterNumberFormComponent } from './letter-number-form.component';

describe('LetterNumberFormComponent', () => {
  let fixture: ComponentFixture<LetterNumberFormComponent>;
  let updateUseCase: jasmine.SpyObj<UpdateLetterNumberUseCase>;

  const letter: LetterNumberModel = {
    id: 7,
    numero_carta: '1750',
    fecha: '2026-10-07T14:00:00.000Z',
    observacion: 'Original',
    user: { ci: 123, nombre: 'Usuario local' }
  };

  beforeEach(async () => {
    const usersRepository = jasmine.createSpyObj<UsersRepository>('UsersRepository', ['getAllUsers']);
    usersRepository.getAllUsers.and.resolveTo([{
      ci: 123,
      nombre: 'Usuario local',
      roleId: 1,
      role: null
    }]);
    updateUseCase = jasmine.createSpyObj<UpdateLetterNumberUseCase>('UpdateLetterNumberUseCase', ['execute']);
    updateUseCase.execute.and.resolveTo(letter);

    await TestBed.configureTestingModule({
      imports: [LetterNumberFormComponent, NoopAnimationsModule],
      providers: [
        { provide: UsersRepository, useValue: usersRepository },
        { provide: CreateLetterNumberUseCase, useValue: { execute: jasmine.createSpy('execute') } },
        { provide: UpdateLetterNumberUseCase, useValue: updateUseCase },
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
        { provide: MAT_DIALOG_DATA, useValue: letter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LetterNumberFormComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('hydrates the nested user and sends only the write DTO on update', async () => {
    expect(fixture.componentInstance.form.controls['user_ci'].value).toBe(123);

    fixture.componentInstance.form.patchValue({ observacion: 'Actualizada' });
    await fixture.componentInstance.save();

    expect(updateUseCase.execute).toHaveBeenCalledOnceWith(7, {
      user_ci: 123,
      observacion: 'Actualizada'
    });
  });
});
