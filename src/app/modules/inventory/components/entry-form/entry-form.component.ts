// src/app/modules/inventory/components/entry-form/entry-form.component.ts

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
import { CreateInventoryEntryModel } from '../../../../core/domain/models/inventory-entry.model';
import { ItemModel } from '../../../../core/domain/models/item.model';
import { CreateEntryUseCase } from '../../../../core/application/usecase/inventory-entries/create-entry.usecase';
import { GetAllItemsUseCase } from '../../../../core/application/usecase/items/get-all-items.usecase'; // Para llenar el select
import { AuthService } from '../../../../core/application/services/auth.service'; // Para obtener el usuario
import { NotificationService } from '../../../../shared/services/notification.service';
import { inventoryQuantityValidator } from '../../../../shared/validators/inventory-quantity.validator';
import { httpErrorMessage } from '../../../../shared/utils/http-error-message';

@Component({
    selector: 'app-entry-form',
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
    templateUrl: './entry-form.component.html',
    styleUrls: ['./entry-form.component.scss']
})
export class EntryFormComponent implements OnInit {
    entryForm: FormGroup;
    items: ItemModel[] = [];
    loading = false;
    
    // Usuario CI (Cédula de Identidad) que registra la entrada
    private registradorCi: number | null = null; 

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private authService: AuthService,
        private notificationService: NotificationService,
        private createEntryUseCase: CreateEntryUseCase,
        private getAllItemsUseCase: GetAllItemsUseCase // Usamos este UseCase auxiliar
    ) {
        // Inicialización del formulario
        this.entryForm = this.fb.group({
        itemCodigo: ['', Validators.required],
        cantidad: [null, [Validators.required, inventoryQuantityValidator]],
        observacion: ['']
        });
    }

    ngOnInit(): void {
        // 1. Cargar ítems para el selector
        this.loadItems();
        
        // 2. Obtener el CI del usuario logueado (asumiendo que está autenticado)
        this.registradorCi = this.authService.getCurrentUser()?.ci || null;
        if (!this.registradorCi) {
        this.notificationService.showError('No se pudo identificar al usuario. Inicie sesión de nuevo.');
        this.router.navigate(['/auth/login']);
        }
    }

    loadItems(): void {
        this.getAllItemsUseCase.execute()
        .then(items => {
            this.items = items;
        })
        .catch(error => {
            this.notificationService.showError('Error al cargar la lista de ítems.');
        });
    }

    /**
     * Envía la nueva entrada de inventario.
     */
    async onSubmit(): Promise<void> {
        if (this.entryForm.invalid || this.registradorCi === null) {
        this.entryForm.markAllAsTouched();
        return;
        }

        this.loading = true;
        
        const entryData: CreateInventoryEntryModel = {
            itemCodigo: this.entryForm.controls['itemCodigo'].value,
            cantidad: this.entryForm.controls['cantidad'].value,
            observacion: this.entryForm.controls['observacion'].value,
            userCi: this.registradorCi
        };

        try {
        // 3. Llamada al Caso de Uso
        await this.createEntryUseCase.execute(entryData);
        
        this.notificationService.showSuccess('Entrada de Inventario registrada exitosamente.');
        this.router.navigate(['/dashboard/entries']);
        
        } catch (error) {
        console.error('Error al crear entrada:', error);
        const message = httpErrorMessage(error, 'Error al registrar la entrada de inventario.');
        this.notificationService.showError(message);
        
        } finally {
        this.loading = false;
        }
    }

    onCancel(): void {
        this.router.navigate(['/dashboard/entries']);
    }
}
