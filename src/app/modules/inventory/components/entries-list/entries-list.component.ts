import { Component, DestroyRef, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
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
import { InventoryEntryModel } from '../../../../core/domain/models/inventory-entry.model';
import { GetAllEntriesUseCase } from '../../../../core/application/usecase/inventory-entries/get-all-entries.usecase';
import { NotificationService } from '../../../../shared/services/notification.service';
import { DeleteEntryUseCase } from '../../../../core/application/usecase/inventory-entries/delete-entry.usecase'; 
import { PermissionService } from '../../../../core/application/services/permission.service';
import { PERMISSIONS } from '../../../../core/domain/models/permission.model';
import { HttpErrorResponse } from '@angular/common/http';
import { getFallbackMessage } from '../../../../shared/utils/http-error-message';
import { POLLING_INTERVALS } from '../../../../shared/polling/polling-intervals';
import { PeriodicRefreshHandle, PeriodicRefreshService } from '../../../../shared/polling/periodic-refresh.service';
import { SpanishPaginatorIntl } from '../../../../shared/material/spanish-paginator-intl';

@Component({
    selector: 'app-entries-list',
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
        MatTooltipModule
    ],
    templateUrl: './entries-list.component.html',
    styleUrls: ['./entries-list.component.scss'],
    providers: [NotificationService, { provide: MatPaginatorIntl, useClass: SpanishPaginatorIntl }]
})
export class EntriesListComponent implements OnInit {
    readonly permissions = PERMISSIONS;
    private readonly destroyRef = inject(DestroyRef);
    private pollingHandle?: PeriodicRefreshHandle<InventoryEntryModel[]>;
    loading = true;
    errorMessage = '';
    dataSource = new MatTableDataSource<InventoryEntryModel>([]);
    displayedColumns: string[] = ['id', 'fecha', 'itemCodigo', 'item', 'cantidad', 'user', 'observacion', 'actions'];
    
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    constructor(
        private getAllEntriesUseCase: GetAllEntriesUseCase,
        private router: Router,
        private notificationService: NotificationService,
        private deleteEntryUseCase: DeleteEntryUseCase,
        private periodicRefresh: PeriodicRefreshService,
        readonly permissionService: PermissionService
    ) {}

    ngOnInit(): void {
        this.pollingHandle = this.periodicRefresh.create({
            intervalMs: POLLING_INTERVALS.entries,
            request: () => this.getAllEntriesUseCase.execute()
        });

        this.pollingHandle.events$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((event) => {
                this.loading = false;
                if (event.type === 'success') {
                    this.dataSource.data = event.data;
                    this.errorMessage = '';
                    this.dataSource.paginator ??= this.paginator;
                    this.dataSource.sort ??= this.sort;
                    return;
                }

                console.error('Error al cargar entradas:', event.error);
                this.errorMessage = 'No se pudo cargar el historial de entradas.';
            });
    }

    loadEntries(): void {
        this.pollingHandle?.refresh();
    }

    applyFilter(event: Event) {
        const filterValue = (event.target as HTMLInputElement).value;
        this.dataSource.filter = filterValue.trim().toLowerCase();
        if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
        }
    }

    addEntry(): void {
        this.router.navigate(['/dashboard/entries/new']);
    }

    viewEntry(id: number): void {
        this.router.navigate([`/dashboard/entries/${id}`]);
    }
    
    async deleteEntry(id: number): Promise<void> {
        if (!confirm(`⚠️ ¿Está seguro de ANULAR la entrada ID ${id}? Esta acción afectará el stock.`)) {
            return;
        }

        try {
            this.loading = true;
            await this.deleteEntryUseCase.execute(id);
            this.notificationService.showSuccess(`Entrada #${id} anulada correctamente.`);
            this.pollingHandle?.refreshAfterMutation();
        } catch (error) {
            this.notificationService.showError(getFallbackMessage(
                error,
                'No se pudo anular la entrada.',
                {
                    403: 'El servidor rechazó la anulación de la entrada.',
                    409: 'No se puede anular la entrada con el stock actual.'
                }
            ));
            if (error instanceof HttpErrorResponse && error.status === 404) {
                this.pollingHandle?.refreshAfterMutation();
            }
        } finally {
            this.loading = false;
        }
    }

    trackByEntryId(_index: number, entry: InventoryEntryModel): number {
        return entry.id;
    }
}
