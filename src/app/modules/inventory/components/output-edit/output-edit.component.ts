import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';

import { InventoryOutputModel, UpdateInventoryOutputModel } from '../../../../core/domain/models/inventory-output.model';
import { GetOutputByIdUseCase } from '../../../../core/application/usecase/inventory-outputs/get-output-by-id.usecase';
import { UpdateOutputUseCase } from '../../../../core/application/usecase/inventory-outputs/update-output.usecase';
import { NotificationService } from '../../../../shared/services/notification.service';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-output-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './output-edit.component.html',
  styleUrls: ['./output-edit.component.scss']
})
export class OutputEditComponent implements OnInit {
  editForm: FormGroup;
  output: InventoryOutputModel | null = null;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private getOutputByIdUseCase: GetOutputByIdUseCase,
    private updateOutputUseCase: UpdateOutputUseCase,
    private notificationService: NotificationService
  ) {
    this.editForm = this.fb.group({
      observacion: ['', [Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadOutput(id);
    } else {
      this.notificationService.showError('ID de salida no válido');
      this.router.navigate(['/dashboard/outputs']);
    }
  }

  async loadOutput(id: number): Promise<void> {
    this.loading = true;
    try {
      this.output = await this.getOutputByIdUseCase.execute(id);
      this.editForm.patchValue({
        observacion: this.output.observacion || ''
      });
      this.loading = false;
    } catch (error) {
      console.error('Error al cargar salida:', error);
      this.notificationService.showError('No se pudo cargar la salida para edición');
      this.router.navigate(['/dashboard/outputs']);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.editForm.invalid || !this.output) {
      return;
    }

    this.loading = true;
    const updateData: UpdateInventoryOutputModel = {
      observacion: this.editForm.value.observacion
    };

    try {
      await this.updateOutputUseCase.execute(this.output.id, updateData);
      this.notificationService.showSuccess('Observación actualizada correctamente');
      this.router.navigate([`/dashboard/outputs/${this.output.id}`]);
    } catch (error: any) {
      console.error('Error al actualizar salida:', error);
      this.notificationService.showError(error.message || 'Error al actualizar la observación');
    } finally {
      this.loading = false;
    }
  }

  onCancel(): void {
    if (this.output) {
      this.router.navigate([`/dashboard/outputs/${this.output.id}`]);
    } else {
      this.router.navigate(['/dashboard/outputs']);
    }
  }
}