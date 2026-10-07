import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CreateSealNumberUseCase } from '../../../../core/application/usecase/seal-numbers/create-seal-number.usecase';
import { UpdateSealNumberUseCase } from '../../../../core/application/usecase/seal-numbers/update-seal-number.usecase';
import { UsersRepository } from '../../../../core/domain/repositories/users.repository';
import { SealNumberFormComponent } from './seal-number-form.component';

describe('SealNumberFormComponent', () => {
  let fixture: ComponentFixture<SealNumberFormComponent>;
  let usersRepository: jasmine.SpyObj<UsersRepository>;

  beforeEach(async () => {
    usersRepository = jasmine.createSpyObj<UsersRepository>('UsersRepository', ['getAllUsers']);
    usersRepository.getAllUsers.and.resolveTo([{
      ci: 123,
      nombre: 'Usuario local',
      roleId: 1,
      role: null
    }]);

    await TestBed.configureTestingModule({
      imports: [SealNumberFormComponent, NoopAnimationsModule],
      providers: [
        { provide: UsersRepository, useValue: usersRepository },
        { provide: CreateSealNumberUseCase, useValue: { execute: jasmine.createSpy('execute') } },
        { provide: UpdateSealNumberUseCase, useValue: { execute: jasmine.createSpy('execute') } },
        { provide: MatSnackBar, useValue: { open: jasmine.createSpy('open') } },
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
        { provide: MAT_DIALOG_DATA, useValue: { action: 'create' } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SealNumberFormComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('loads the current UserModel contract into the user selector', async () => {
    expect(usersRepository.getAllUsers).toHaveBeenCalledOnceWith();
    expect(fixture.componentInstance.users[0]).toEqual(jasmine.objectContaining({
      ci: 123,
      nombre: 'Usuario local',
      roleId: 1
    }));

    (fixture.nativeElement.querySelector('mat-select') as HTMLElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    const options = Array.from(document.querySelectorAll('.mat-mdc-option'));
    expect(options.some((option) => option.textContent?.includes('123 - Usuario local'))).toBeTrue();
  });
});
