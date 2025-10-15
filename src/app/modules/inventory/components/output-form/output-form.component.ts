import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';

// Capas de Clean Architecture
import { CreateInventoryOutputModel } from '../../../../core/domain/models/inventory-output.model';
import { ItemModel } from '../../../../core/domain/models/item.model';
import { DepartamentoModel } from '../../../../core/domain/models/departamento.model';
import { GetAllItemsUseCase } from '../../../../core/application/usecase/items/get-all-items.usecase';
import { GetAllDepartamentosUseCase } from '../../../../core/application/usecase/departamentos/get-all-departamentos.usecase';
import { AuthService } from '../../../../core/application/services/auth.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { CreateOutputUseCase } from '../../../../core/application/usecase/inventory-outputs/create-output.usecase';

@Component({
    selector: 'app-output-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatCardModule,
        MatInputModule,
        MatButtonModule,
        MatSelectModule,
        MatIconModule,
        MatProgressSpinnerModule
    ],
    templateUrl: './output-form.component.html',
    styleUrls: ['./output-form.component.scss']
})
export class OutputFormComponent implements OnInit {
    outputForm: FormGroup;
    items: ItemModel[] = [];
    departamentos: DepartamentoModel[] = [];
    loading = false;
    
    private registradorCi: number | null = null; 

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private authService: AuthService,
        private notificationService: NotificationService,
        private createOutputUseCase: CreateOutputUseCase,
        private getAllItemsUseCase: GetAllItemsUseCase,
        private getAllDepartamentosUseCase: GetAllDepartamentosUseCase // Inyectamos UseCase de Departamentos
    ) {
        // Inicialización del formulario
        this.outputForm = this.fb.group({
        itemCodigo: ['', Validators.required],
        departamentoId: [null, Validators.required],
        cantidad: [null, [Validators.required, Validators.min(1)]],
        observacion: ['']
        });
    }

    ngOnInit(): void {
        // 1. Cargar ítems y departamentos
        this.loadSelectData();
        
        // 2. Obtener el CI del usuario logueado
        this.registradorCi = this.authService.getCurrentUser()?.ci || null;
        if (!this.registradorCi) {
        this.notificationService.showError('No se pudo identificar al usuario.');
        this.router.navigate(['/auth/login']);
        }
    }

    loadSelectData(): void {
        this.loading = true;
        Promise.all([
            this.getAllItemsUseCase.execute(),
            this.getAllDepartamentosUseCase.execute()
        ]).then(([items, departamentos]) => {
            this.items = items;
            this.departamentos = departamentos;
            this.loading = false;
        }).catch(error => {
            console.error('Error al cargar datos de selección:', error);
            this.notificationService.showError('Error al cargar ítems o departamentos.');
            this.loading = false;
        });
    }
    
    /**
     * Envía la nueva salida de inventario.
     */
    async onSubmit(): Promise<void> {
        if (this.outputForm.invalid || this.registradorCi === null) {
        this.outputForm.markAllAsTouched();
        return;
        }

        this.loading = true;
        
        const outputData: CreateInventoryOutputModel = {
        ...this.outputForm.value,
        userCi: this.registradorCi, // Se inyecta el CI del usuario logueado
        };

        try {
        // 3. Llamada al Caso de Uso (donde se valida el stock)
        await this.createOutputUseCase.execute(outputData);
        
        this.notificationService.showSuccess('Salida de Inventario registrada exitosamente.');
        this.router.navigate(['/dashboard/outputs']);
        
        } catch (error: any) {
        console.error('Error al crear salida:', error);
        const message = error.message || 'Error al registrar la salida de inventario.';
        this.notificationService.showError(message);
        
        } finally {
        this.loading = false;
        }
    }

    onCancel(): void {
        this.router.navigate(['/dashboard/outputs']);
    }
}