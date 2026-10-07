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
import { UsersRepository } from "../../../../core/domain/repositories/users.repository";
import { getFallbackMessage } from '../../../../shared/utils/http-error-message';
import { UserModel } from '../../../../core/domain/models/user.model';

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
  errorMessage = '';
  users: UserModel[] = [];

  constructor(
    private fb: FormBuilder,
    private createUseCase: CreateLetterNumberUseCase,
    private updateUseCase: UpdateLetterNumberUseCase,
    private userRepo: UsersRepository,
    private dialogRef: MatDialogRef<LetterNumberFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data?: LetterNumberModel
  ) {
      this.form = this.fb.group({
        user_ci: [data?.user.ci || '', Validators.required],
        observacion: [data?.observacion || '']
      });
  }

  ngOnInit(): void {
    this.loadUsers();
    if (this.data) {
      this.generatedNumber = this.data.numero_carta;
    }
  }

  async loadUsers() {
    try {
      const users = await this.userRepo.getAllUsers();
      this.users = users;
      if (this.data) {
        this.form.patchValue({
          user_ci: this.data.user.ci
        });
      }
    } catch (err) {
      console.error(err);
    }
  }

  async save() { 
    if (this.form.invalid || this.saving) return;
    this.saving = true;
    this.errorMessage = '';

    if (this.data) {
      const updateData: UpdateLetterNumberModel = {
        user_ci: Number(this.form.value.user_ci),
        observacion: this.form.value.observacion
      };

      try {
        await this.updateUseCase.execute(this.data.id, updateData);
        this.dialogRef.close(true);
      } catch (err: any) { 
        console.error('Error al actualizar carta:', err);
        this.errorMessage = getFallbackMessage(err, 'No se pudo actualizar la carta.');
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
      } catch (err: any) { 
        console.error('Error al crear carta:', err);
        this.errorMessage = getFallbackMessage(err, 'No se pudo crear la carta.');
      } finally {
        this.saving = false;
      }
    }
  }


  close() {
    this.dialogRef.close();
  }
}
