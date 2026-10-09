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
import { Router } from '@angular/router';

// Capas de Clean Architecture
import { ItemModel } from '../../../../core/domain/models/item.model';
import { GetAllItemsUseCase } from '../../../../core/application/usecase/items/get-all-items.usecase';
import { NotificationService } from '../../../../shared/services/notification.service';
import { DeleteItemUseCase } from '../../../../core/application/usecase/items/delete-item.usecase'; 
import { PermissionService } from '../../../../core/application/services/permission.service';
import { PERMISSIONS } from '../../../../core/domain/models/permission.model';
import { getFallbackMessage } from '../../../../shared/utils/http-error-message';
import { POLLING_INTERVALS } from '../../../../shared/polling/polling-intervals';
import { PeriodicRefreshHandle, PeriodicRefreshService } from '../../../../shared/polling/periodic-refresh.service';
import { SpanishPaginatorIntl } from '../../../../shared/material/spanish-paginator-intl';

@Component({
  selector: 'app-items-list',
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
    MatProgressSpinnerModule
  ],
  templateUrl: './items-list.component.html',
  styleUrls: ['./items-list.component.scss'],
  providers: [NotificationService, { provide: MatPaginatorIntl, useClass: SpanishPaginatorIntl }]
})
export class ItemsListComponent implements OnInit {
    readonly permissions = PERMISSIONS;
    private readonly destroyRef = inject(DestroyRef);
    private pollingHandle?: PeriodicRefreshHandle<ItemModel[]>;
    
    loading = true;
    errorMessage = '';
    dataSource = new MatTableDataSource<ItemModel>([]);
    displayedColumns: string[] = ['codigo', 'nombreItem', 'stock', 'unidad', 'actions'];
    
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    constructor(
        private getAllItemsUseCase: GetAllItemsUseCase,
        private router: Router,
        private notificationService: NotificationService,
        private deleteItemUseCase: DeleteItemUseCase,
        private periodicRefresh: PeriodicRefreshService,
        readonly permissionService: PermissionService
    ) {}

    ngOnInit(): void {
        this.pollingHandle = this.periodicRefresh.create({
            intervalMs: POLLING_INTERVALS.items,
            request: () => this.getAllItemsUseCase.execute()
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

                console.error('Error al cargar ítems:', event.error);
                this.errorMessage = 'No se pudo cargar el inventario.';
            });
    }

    loadItems(): void {
        this.pollingHandle?.refresh();
    }

    applyFilter(event: Event) {
        const filterValue = (event.target as HTMLInputElement).value;
        this.dataSource.filter = filterValue.trim().toLowerCase();
        if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
        }
    }

    addItem(): void {
        this.router.navigate(['/dashboard/items/new']);
    }

    editItem(codigo: string): void {
        this.router.navigate([`/dashboard/items/edit/${codigo}`]);
    }

    deleteItem(codigo: string): void {
        if (!confirm(`¿Está seguro de eliminar el ítem con código ${codigo}?`)) return;

        this.loading = true;
        this.deleteItemUseCase.execute(codigo)
            .then(() => {
                this.notificationService.showSuccess('Item eliminado correctamente.');
                this.pollingHandle?.refreshAfterMutation();
            })
            .catch(error => {
                const message = getFallbackMessage(error, 'No se pudo eliminar el ítem.');
                this.notificationService.showError(message);
            })
            .finally(() => this.loading = false);
    }

    trackByItemCode(_index: number, item: ItemModel): string {
        return item.codigo;
    }

}
