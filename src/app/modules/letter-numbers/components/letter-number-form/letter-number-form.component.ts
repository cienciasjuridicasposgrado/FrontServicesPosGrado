import { Component, Inject } from "@angular/core";
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { CreateLetterNumberUseCase } from "../../../../core/application/usecase/letter-numbers/create-letter-number.usecase";
import { UpdateLetterNumberUseCase } from "../../../../core/application/usecase/letter-numbers/update-letter-number.usecase";
import { CreateLetterNumberModel, LetterNumberModel, UpdateLetterNumberModel } from "../../../../core/domain/models/letter-number.model";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { MatSortModule } from "@angular/material/sort";
import { MatTableModule } from "@angular/material/table";
import { NotificationService } from "../../../../shared/services/notification.service";
import { MatSelectModule } from "@angular/material/select";
import { GetUserLookupUseCase } from "../../../../core/application/usecase/users/get-user-lookup.usecase";
import { getFallbackMessage } from '../../../../shared/utils/http-error-message';
import { UserLookupModel } from '../../../../core/domain/models/user-lookup.model';
import { getInstitutionalNumberError } from '../../../../shared/utils/institutional-number-error';

@Component({
  selector: 'app-letter-number-form',
  standalone: true,
  templateUrl: './letter-number-form.component.html',
  styleUrls: ['./letter-number-form.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatSelectModule
  ],
  providers: [NotificationService]
})
export class LetterNumberFormComponent {
  form: FormGroup;
  generatedNumber: string = '';
  saving = false;
  errorTitle = '';
  errorMessage = '';
  users: UserLookupModel[] = [];
  usersLoading = true;
  usersError = '';

  constructor(
    private fb: FormBuilder,
    private createUseCase: CreateLetterNumberUseCase,
    private updateUseCase: UpdateLetterNumberUseCase,
    private getUserLookupUseCase: GetUserLookupUseCase,
    private dialogRef: MatDialogRef<LetterNumberFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data?: LetterNumberModel
  ) {
      this.form = this.fb.group({
        user_ci: [{ value: data?.user.ci || '', disabled: true }, Validators.required],
        observacion: [data?.observacion || '']
      });
  }

  ngOnInit(): void {
    this.loadUsers();
    if (this.data) {
      this.generatedNumber = this.data.numero_carta;
    }
  }

  async loadUsers(): Promise<void> {
    this.usersError = '';
    this.usersLoading = true;
    try {
      this.users = await this.getUserLookupUseCase.execute();
      if (this.data) {
        this.form.patchValue({
          user_ci: this.data.user.ci
        });
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      this.usersError = getFallbackMessage(error, 'Error al cargar los usuarios.', {
        403: 'No tiene permiso para consultar los usuarios disponibles.'
      });
    } finally {
      this.form.get('user_ci')?.enable();
      this.usersLoading = false;
    }
  }

  async save() { 
    if (this.form.invalid || this.saving || this.usersLoading) return;
    this.saving = true;
    this.errorTitle = '';
    this.errorMessage = '';

    if (this.data) {
      const updateData: UpdateLetterNumberModel = {
        user_ci: Number(this.form.value.user_ci),
        observacion: this.form.value.observacion
      };

      try {
        await this.updateUseCase.execute(this.data.id, updateData);
        this.dialogRef.close(true);
      } catch (error: unknown) {
        console.error('Error al actualizar carta:', error);
        const errorContent = getInstitutionalNumberError(
          error,
          false,
          'No se pudo actualizar la carta.'
        );
        this.errorTitle = errorContent.title;
        this.errorMessage = errorContent.message;
      } finally {
        this.saving = false;
      }

    } else {
      const createData: CreateLetterNumberModel = {
        user_ci: Number(this.form.value.user_ci),
        observacion: this.form.value.observacion
      };

      try {
        const res: LetterNumberModel = await this.createUseCase.execute(createData); 
        console.log('Carta creada:', res);
        this.generatedNumber = res.numero_carta;
        this.dialogRef.close(true); 
      } catch (error: unknown) {
        console.error('Error al crear carta:', error);
        const errorContent = getInstitutionalNumberError(
          error,
          false,
          'No se pudo crear la carta.'
        );
        this.errorTitle = errorContent.title;
        this.errorMessage = errorContent.message;
      } finally {
        this.saving = false;
      }
    }
  }


  close() {
    this.dialogRef.close();
  }
}
