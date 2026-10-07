import { Component, DestroyRef, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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

// Capas de Clean Architecture
import { InventoryOutputModel } from '../../../../core/domain/models/inventory-output.model';
import { GetAllOutputsUseCase } from '../../../../core/application/usecase/inventory-outputs/get-all-outputs.usecase';
import { DeleteOutputUseCase } from '../../../../core/application/usecase/inventory-outputs/delete-output.usecase';
import { NotificationService } from '../../../../shared/services/notification.service';
import { PermissionService } from '../../../../core/application/services/permission.service';
import { PERMISSIONS } from '../../../../core/domain/models/permission.model';
import { HttpErrorResponse } from '@angular/common/http';
import { getFallbackMessage } from '../../../../shared/utils/http-error-message';
import { POLLING_INTERVALS } from '../../../../shared/polling/polling-intervals';
import { PeriodicRefreshHandle, PeriodicRefreshService } from '../../../../shared/polling/periodic-refresh.service';

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
    ],
    templateUrl: './outputs-list.component.html',
    styleUrls: ['./outputs-list.component.scss']
})

export class OutputsListComponent implements OnInit {
    readonly permissions = PERMISSIONS;
    private readonly destroyRef = inject(DestroyRef);
    private pollingHandle?: PeriodicRefreshHandle<InventoryOutputModel[]>;
    loading = true;
    dataSource = new MatTableDataSource<InventoryOutputModel>([]);
    displayedColumns: string[] = ['id', 'fecha', 'itemCodigo', 'item', 'cantidad', 'departamento', 'user', 'observacion', 'actions'];
    
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    constructor(
        private getAllOutputsUseCase: GetAllOutputsUseCase,
        private deleteOutputUseCase: DeleteOutputUseCase,
        private router: Router,
        private notificationService: NotificationService,
        private periodicRefresh: PeriodicRefreshService,
        readonly permissionService: PermissionService
    ) {}

    ngOnInit(): void {
        this.pollingHandle = this.periodicRefresh.create({
            intervalMs: POLLING_INTERVALS.outputs,
            request: () => this.getAllOutputsUseCase.execute()
        });

        this.pollingHandle.events$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((event) => {
                this.loading = false;
                if (event.type === 'success') {
                    this.dataSource.data = event.data;
                    this.dataSource.paginator ??= this.paginator;
                    this.dataSource.sort ??= this.sort;
                    return;
                }

                console.error('Error al cargar salidas:', event.error);
                this.notificationService.showError('No se pudo cargar el historial de salidas.');
            });
    }

    loadOutputs(): void {
        this.pollingHandle?.refresh();
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
                this.pollingHandle?.refreshAfterMutation();
            } catch (error) {
                console.error('Error al anular salida:', error);
                this.notificationService.showError(getFallbackMessage(
                    error,
                    'Error al anular la salida.',
                    { 403: 'El servidor rechazó la anulación de la salida.' }
                ));
                if (error instanceof HttpErrorResponse && error.status === 404) {
                    this.pollingHandle?.refreshAfterMutation();
                }
            } finally {
                this.loading = false;
            }
        }
    }

    trackByOutputId(_index: number, output: InventoryOutputModel): number {
        return output.id;
    }
}
