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


@Component({
  selector: 'app-seal-number-form',
  templateUrl: './seal-number-form.component.html',
  styleUrls: ['./seal-number-form.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ]
})
export class SealNumberFormComponent {

    form: FormGroup;
    title: string;

    constructor(
        private fb: FormBuilder,
        private createUseCase: CreateSealNumberUseCase,
        private updateUseCase: UpdateSealNumberUseCase,
        private snackBar: MatSnackBar,
        private dialogRef: MatDialogRef<SealNumberFormComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { action: 'create' | 'edit', seal?: SealNumberModel }
    ) {
        this.title = data.action === 'create' ? 'Registrar Nuevo Sello' : 'Editar Sello';
        this.form = this.fb.group({
        numeroSello: [data.seal?.numeroSello || '', Validators.required],
        userCi: [data.seal?.user_ci || '', Validators.required],
        observacion: [data.seal?.observacion || '']
        });
    }

    async save(): Promise<void> {
        if (this.form.invalid) return;

        const formValue = this.form.value;

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