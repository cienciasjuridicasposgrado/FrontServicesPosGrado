import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';

// Capas de Clean Architecture
import { InventoryOutputModel } from '../../../../core/domain/models/inventory-output.model';
import { GetAllOutputsUseCase } from '../../../../core/application/usecase/inventory-outputs/get-all-outputs.usecase';
import { DeleteOutputUseCase } from '../../../../core/application/usecase/inventory-outputs/delete-output.usecase';
import { NotificationService } from '../../../../shared/services/notification.service';
import { MatChipsModule } from '@angular/material/chips';

@Component({
    selector: 'app-outputs-list',
    standalone: true,
    imports: [
        CommonModule, 
        MatTableModule, 
        MatPaginatorModule, 
        MatSortModule,
        MatCardModule, 
        MatButtonModule, 
        MatIconModule,
        MatInputModule, 
        MatFormFieldModule, 
        MatProgressSpinnerModule,
        MatTooltipModule,
        MatChipsModule
    ],
    templateUrl: './outputs-list.component.html',
    styleUrls: ['./outputs-list.component.scss']
})

export class OutputsListComponent implements OnInit, OnDestroy {
    loading = false;
    dataSource = new MatTableDataSource<InventoryOutputModel>([]);
    displayedColumns: string[] = ['id', 'fecha', 'itemCodigo', 'item', 'cantidad', 'departamento', 'user', 'observacion', 'actions'];
    private destroy$ = new Subject<void>();
    
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    constructor(
        private getAllOutputsUseCase: GetAllOutputsUseCase,
        private deleteOutputUseCase: DeleteOutputUseCase,
        private router: Router,
        private notificationService: NotificationService
    ) {}

    ngOnInit(): void {
        this.loadOutputs();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadOutputs(): void {
        this.loading = true;
        this.getAllOutputsUseCase.execute()
        .then(outputs => {
            this.dataSource.data = outputs;
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
            this.loading = false;
        })
        .catch(error => {
            console.error('Error al cargar salidas:', error);
            this.notificationService.showError('No se pudo cargar el historial de salidas.');
            this.loading = false;
        });
    }

    applyFilter(event: Event) {
        const filterValue = (event.target as HTMLInputElement).value;
        this.dataSource.filter = filterValue.trim().toLowerCase();
        if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
        }
    }

    addOutput(): void {
        this.router.navigate(['/dashboard/outputs/new']);
    }

    viewOutput(id: number): void {
        this.router.navigate([`/dashboard/outputs/${id}`]);
    }

    async deleteOutput(id: number): Promise<void> {
        const confirmMessage = `¿Está seguro de ANULAR la salida ID ${id}?\n\nADVERTENCIA: Esta operación es irreversible y afectará el stock del inventario.`;
        
        if (confirm(confirmMessage)) {
            this.loading = true;
            try {
                await this.deleteOutputUseCase.execute(id);
                this.notificationService.showSuccess('Salida anulada correctamente. El stock ha sido revertido.');
                this.loadOutputs(); 
            } catch (error: any) {
                console.error('Error al anular salida:', error);
                if (error.message.includes('no existe')) {
                    this.notificationService.showError(error.message);
                    this.loadOutputs(); 
                } else if (error.message.includes('permisos')) {
                    this.notificationService.showError(error.message);
                } else {
                    this.notificationService.showError(error.message || 'Error al anular la salida.');
                }
            } finally {
                this.loading = false;
            }
        }
    }
}