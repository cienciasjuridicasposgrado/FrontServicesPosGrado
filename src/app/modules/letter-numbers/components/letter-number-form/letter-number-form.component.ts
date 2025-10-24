import { Component, Inject } from "@angular/core";
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { CreateLetterNumberUseCase } from "../../../../core/application/usecase/letter-numbers/create-letter-number.usecase";
import { UpdateLetterNumberUseCase } from "../../../../core/application/usecase/letter-numbers/update-letter-numer.usecase";
import { LetterNumberModel } from "../../../../core/domain/models/letter-number.model";
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
  ],
})
export class LetterNumberFormComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private createUseCase: CreateLetterNumberUseCase,
    private updateUseCase: UpdateLetterNumberUseCase,
    private dialogRef: MatDialogRef<LetterNumberFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data?: LetterNumberModel
  ) {
    this.form = this.fb.group({
      numero_carta: [data?.numero_carta || '', Validators.required],
      user_ci: [data?.user_ci || '', Validators.required],
      observacion: [data?.observacion || '']
    });
  }

  save() {
    if (this.form.invalid) return;

    const dto = this.form.value;

    if (this.data) {
      this.updateUseCase.execute(this.data.id, dto).subscribe(() => this.dialogRef.close(true));
    } else {
      this.createUseCase.execute(dto).subscribe(() => this.dialogRef.close(true));
    }
  }

  close() {
    this.dialogRef.close();
  }
}