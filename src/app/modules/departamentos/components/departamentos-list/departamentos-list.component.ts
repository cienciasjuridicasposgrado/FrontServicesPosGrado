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
import { DepartamentoModel } from '../../../../core/domain/models/departamento.model';
import { GetAllDepartamentosUseCase } from '../../../../core/application/usecase/departamentos/get-all-departamentos.usecase';
import { NotificationService } from '../../../../shared/services/notification.service';
import { DeleteDepartamentoUseCase } from '../../../../core/application/usecase/departamentos/delete-departamento.usecase'; 
import { PermissionService } from '../../../../core/application/services/permission.service';
import { PERMISSIONS } from '../../../../core/domain/models/permission.model';
import { getFallbackMessage } from '../../../../shared/utils/http-error-message';
import { POLLING_INTERVALS } from '../../../../shared/polling/polling-intervals';
import { PeriodicRefreshHandle, PeriodicRefreshService } from '../../../../shared/polling/periodic-refresh.service';

@Component({
  selector: 'app-departamentos-list',
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
  templateUrl: './departamentos-list.component.html',
  styleUrls: ['./departamentos-list.component.scss'],
  providers: [NotificationService]
})
export class DepartamentosListComponent implements OnInit {
    readonly permissions = PERMISSIONS;
    private readonly destroyRef = inject(DestroyRef);
    private pollingHandle?: PeriodicRefreshHandle<DepartamentoModel[]>;

    loading = true;
    dataSource = new MatTableDataSource<DepartamentoModel>([]);
    displayedColumns: string[] = ['id', 'nombre', 'descripcion', 'actions'];
    
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    constructor(
        private getAllDepartamentosUseCase: GetAllDepartamentosUseCase,
        private router: Router,
        private notificationService: NotificationService,
        private deleteDepartamentoUseCase: DeleteDepartamentoUseCase,
        private periodicRefresh: PeriodicRefreshService,
        readonly permissionService: PermissionService
    ) {}

    ngOnInit(): void {
        this.pollingHandle = this.periodicRefresh.create({
            intervalMs: POLLING_INTERVALS.departamentos,
            request: () => this.getAllDepartamentosUseCase.execute()
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

                console.error('Error al cargar departamentos:', event.error);
                this.notificationService.showError('No se pudo cargar la lista de departamentos. Intente más tarde.');
            });
    }

    loadDepartamentos(): void {
        this.pollingHandle?.refresh();
    }

    applyFilter(event: Event) {
        const filterValue = (event.target as HTMLInputElement).value;
        this.dataSource.filter = filterValue.trim().toLowerCase();
        if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
        }
    }

    addDepartamento(): void {
        this.router.navigate(['/dashboard/departamentos/new']);
    }

    editDepartamento(id: number): void {
        this.router.navigate([`/dashboard/departamentos/edit/${id}`]);
    }

    async deleteDepartamento(id: number): Promise<void> {
        if (confirm(`¿Está seguro de eliminar el departamento con ID ${id}?`)) {
            try {
                await this.deleteDepartamentoUseCase.execute(id);
                this.notificationService.showSuccess("Departamento eliminado correctamente");
                this.pollingHandle?.refreshAfterMutation();
            } catch (error: unknown) {
                console.error('Error al eliminar departamento:', error);
                this.notificationService.showError(getFallbackMessage(
                    error,
                    'Error al eliminar el departamento'
                ));
            }
        }
    }

    trackByDepartamentoId(_index: number, departamento: DepartamentoModel): number {
        return departamento.id;
    }
}
