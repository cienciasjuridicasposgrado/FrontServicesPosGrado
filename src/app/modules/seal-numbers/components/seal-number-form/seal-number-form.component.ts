import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CreateSealNumberUseCase } from '../../../../core/application/usecase/seal-numbers/create-seal-number.usecase';
import { UpdateSealNumberUseCase } from '../../../../core/application/usecase/seal-numbers/update-seal-number.usecase';
import { SealNumberModel } from '../../../../core/domain/models/seal-number.model';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { NotificationService } from '../../../../shared/services/notification.service';
import { CoreModule } from '../../../../core/core.module';
import { UsersRepository } from '../../../../core/domain/repositories/users.repository';
import { UserModel } from '../../../../core/domain/models/user.model';
import { MatOption, MatSelectModule } from '@angular/material/select';
import { from } from 'rxjs';

@Component({
  selector: 'app-seal-number-form',
  standalone: true,
  templateUrl: './seal-number-form.component.html',
  styleUrls: ['./seal-number-form.component.scss'],
  imports: [
    CommonModule,
    CoreModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule
  ],
  providers: [NotificationService]
})
export class SealNumberFormComponent {
  
    form: FormGroup;
    title: string;
    isEditMode: boolean;
    users: UserModel[] = [];

    constructor(
      private fb: FormBuilder,
      private createUseCase: CreateSealNumberUseCase,
      private updateUseCase: UpdateSealNumberUseCase,
      private usersRepo: UsersRepository,
      private snackBar: MatSnackBar,
      private dialogRef: MatDialogRef<SealNumberFormComponent>,
      @Inject(MAT_DIALOG_DATA) public data: { action: 'create' | 'edit', seal?: SealNumberModel }
    ) {
      this.isEditMode = data.action === 'edit';
      this.title = this.isEditMode ? 'Editar Sello' : 'Registrar Nuevo Sello';

      this.form = this.fb.group({
        numeroSello: [{
          value: data.seal?.numeroSello || '',
          disabled: !this.isEditMode
        }, this.isEditMode ? Validators.required : []],
        user_ci: [data.seal?.user_ci || '', Validators.required],
        observacion: [data.seal?.observacion || '']
      });
    }

    ngOnInit(): void {
      this.loadUsers();
    }

    async loadUsers(): Promise<void> {
      try {
        this.users = await this.usersRepo.getAllUsers();
        if (this.isEditMode && this.data.seal) {
          this.form.patchValue({
            user_ci: this.data.seal.user_ci
          });
        }
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
        this.snackBar.open('Error al cargar los usuarios.', 'Cerrar', { duration: 3000});
      }
    }

    async save(): Promise<void> {
      if (this.form.invalid) return;

      const formValue = this.form.getRawValue();

      try {
        if (this.data.action === 'create') {
          await this.createUseCase.execute(formValue);
          this.snackBar.open('Sello registrado exitosamente.', 'Cerrar', { duration: 3000 });
        } else {
          await this.updateUseCase.execute(this.data.seal!.id, formValue);
          this.snackBar.open('Sello actualizado correctamente.', 'Cerrar', { duration: 3000 });
        }

        this.dialogRef.close(true);

      } catch (error) {
        console.error(error);
        this.snackBar.open('Error al guardar el sello.', 'Cerrar', { duration: 3000 });
      }
    }

    close(): void {
      this.dialogRef.close(false);
    }
}