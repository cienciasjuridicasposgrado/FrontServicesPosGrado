import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { Router, ActivatedRoute } from "@angular/router";
import { CreateDepartamentoUseCase } from "../../../../core/application/usecase/departamentos/create-departamento.usecase";
import { UpdateDepartamentoUseCase } from "../../../../core/application/usecase/departamentos/update-departamento.usecase";
import { GetDepartamentoByIdUseCase } from "../../../../core/application/usecase/departamentos/get-departamento-by-id.usecase";
import { UpdateDepartamentoModel, CreateDepartamentoModel } from "../../../../core/domain/models/departamento.model";
import { NotificationService } from "../../../../shared/services/notification.service";
import { MatDividerModule } from "@angular/material/divider";

@Component({
    selector: 'app-departamento-form',
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
    templateUrl: './departamento-form.component.html',
    styleUrls: ['./departamento-form.component.scss']
})
export class DepartamentoFormComponent implements OnInit {
    departamentoForm: FormGroup;
    isEditMode = false;
    departamentoId: number | null = null;
    loading = false;

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private notificationService: NotificationService,
        private createDepartamentoUseCase: CreateDepartamentoUseCase,
        private updateDepartamentoUseCase: UpdateDepartamentoUseCase,
        private getDepartamentoByIdUseCase: GetDepartamentoByIdUseCase
    ) {
        this.departamentoForm = this.fb.group({
            nombre: ['', [Validators.required, Validators.maxLength(50), Validators.pattern(/^[A-Z].*/)]],
            descripcion: ['', Validators.maxLength(255)]
        });
    }

    ngOnInit(): void {
        this.departamentoId = Number(this.route.snapshot.paramMap.get('id'));
        if (this.departamentoId) {
            this.isEditMode = true;
            this.loadDepartamentoData(this.departamentoId);
        }
    }

    async loadDepartamentoData(id: number): Promise<void> {
        this.loading = true;
        try {
            const departamento = await this.getDepartamentoByIdUseCase.execute(id);
            
            this.departamentoForm.patchValue({
                nombre: departamento.nombre,
                descripcion: departamento.descripcion
            });

            this.loading = false;
        } catch (error) {
            console.error('Error al cargar datos del departamento:', error);
            this.notificationService.showError('No se pudo cargar el departamento para edición.');
            this.router.navigate(['/dashboard/departamentos']);
        }
    }

    async onSubmit(): Promise<void> {
        if (this.departamentoForm.invalid) {
            this.departamentoForm.markAllAsTouched();
            this.notificationService.showWarning('Por favor, complete todos los campos obligatorios.');
            return;
        }

        this.loading = true;
        const data = this.departamentoForm.value;

        try {
            if (this.isEditMode && this.departamentoId !== null) {
                const updateData: UpdateDepartamentoModel = data;
                await this.updateDepartamentoUseCase.execute(this.departamentoId, updateData);
                this.notificationService.showSuccess(`Departamento "${data.nombre}" actualizado exitosamente.`);
            } else {
                const createData: CreateDepartamentoModel = data;
                await this.createDepartamentoUseCase.execute(createData);
                this.notificationService.showSuccess(`Departamento "${data.nombre}" creado exitosamente.`);
            }
            
            this.router.navigate(['/dashboard/departamentos']);
        } catch (error: any) {
            console.error('Error en la operación CRUD:', error);
            const message = error.message || (this.isEditMode ? 'Error al actualizar el departamento.' : 'Error al crear el departamento.');
            this.notificationService.showError(message);
        } finally {
            this.loading = false;
        }
    }

    onCancel(): void {
        this.router.navigate(['/dashboard/departamentos']);
    }
}