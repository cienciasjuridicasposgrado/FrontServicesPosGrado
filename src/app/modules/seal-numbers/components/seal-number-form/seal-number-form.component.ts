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
import { GetUserLookupUseCase } from '../../../../core/application/usecase/users/get-user-lookup.usecase';
import { UserLookupModel } from '../../../../core/domain/models/user-lookup.model';
import { MatSelectModule } from '@angular/material/select';
import { getFallbackMessage } from '../../../../shared/utils/http-error-message';
import { getInstitutionalNumberError } from '../../../../shared/utils/institutional-number-error';

@Component({
  selector: 'app-seal-number-form',
  standalone: true,
  templateUrl: './seal-number-form.component.html',
  styleUrls: ['./seal-number-form.component.scss'],
  imports: [
    CommonModule,
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
    users: UserLookupModel[] = [];
    usersError = '';
    usersLoading = true;
    saving = false;
    errorTitle = '';
    errorMessage = '';

    constructor(
      private fb: FormBuilder,
      private createUseCase: CreateSealNumberUseCase,
      private updateUseCase: UpdateSealNumberUseCase,
      private getUserLookupUseCase: GetUserLookupUseCase,
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
        user_ci: [{ value: data.seal?.user_ci || '', disabled: true }, Validators.required],
        observacion: [data.seal?.observacion || '']
      });
    }

    ngOnInit(): void {
      this.loadUsers();
    }

    async loadUsers(): Promise<void> {
      this.usersError = '';
      this.usersLoading = true;
      try {
        this.users = await this.getUserLookupUseCase.execute();
        if (this.isEditMode && this.data.seal) {
          this.form.patchValue({
            user_ci: this.data.seal.user_ci
          });
        }
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
        this.usersError = getFallbackMessage(error, 'Error al cargar los usuarios.', {
          403: 'No tiene permiso para consultar los usuarios disponibles.'
        });
        this.snackBar.open(this.usersError, 'Cerrar', { duration: 3000});
      } finally {
        this.form.get('user_ci')?.enable();
        this.usersLoading = false;
      }
    }

    async save(): Promise<void> {
      if (this.form.invalid || this.saving || this.usersLoading) return;
      this.saving = true;
      this.errorTitle = '';
      this.errorMessage = '';

      const formValue = this.form.getRawValue();
      const manualNumberRequested = Boolean(formValue.numeroSello?.trim());

      try {
        if (this.data.action === 'create') {
          await this.createUseCase.execute(formValue);
          this.snackBar.open('Sello registrado exitosamente.', 'Cerrar', { duration: 3000 });
        } else {
          await this.updateUseCase.execute(this.data.seal!.id, formValue);
          this.snackBar.open('Sello actualizado correctamente.', 'Cerrar', { duration: 3000 });
        }

        this.dialogRef.close(true);

      } catch (error: unknown) {
        console.error(error);
        const errorContent = getInstitutionalNumberError(
          error,
          manualNumberRequested,
          'Error al guardar el sello.'
        );
        this.errorTitle = errorContent.title;
        this.errorMessage = errorContent.message;
        this.snackBar.open(`${errorContent.title}. ${errorContent.message}`, 'Cerrar', {
          duration: 5000
        });
      } finally {
        this.saving = false;
      }
    }

    close(): void {
      this.dialogRef.close(false);
    }
}
