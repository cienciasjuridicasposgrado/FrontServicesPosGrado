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
import { RoleModel } from '../../../../core/domain/models/role.model';
import { GetAllRolesUseCase } from '../../../../core/application/usecase/roles/get-all-roles.usecase';
import { NotificationService } from '../../../../shared/services/notification.service';
import { DeleteRoleUseCase } from '../../../../core/application/usecase/roles/delete-role.usecase';
import { PermissionService } from '../../../../core/application/services/permission.service';
import { PERMISSIONS } from '../../../../core/domain/models/permission.model';
import { getFallbackMessage } from '../../../../shared/utils/http-error-message';
import { POLLING_INTERVALS } from '../../../../shared/polling/polling-intervals';
import { PeriodicRefreshHandle, PeriodicRefreshService } from '../../../../shared/polling/periodic-refresh.service';
import { SpanishPaginatorIntl } from '../../../../shared/material/spanish-paginator-intl';

@Component({
  selector: 'app-roles-list',
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
  templateUrl: './roles-list.component.html',
    styleUrls: ['./roles-list.component.scss'],
    providers: [{ provide: MatPaginatorIntl, useClass: SpanishPaginatorIntl }]
})
export class RolesListComponent implements OnInit {
    readonly permissions = PERMISSIONS;
    private readonly destroyRef = inject(DestroyRef);
    private pollingHandle?: PeriodicRefreshHandle<RoleModel[]>;
    loading = true;
    errorMessage = '';
    dataSource = new MatTableDataSource<RoleModel>([]);
    displayedColumns: string[] = ['id', 'name', 'permissions', 'description', 'actions'];
    
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    constructor(
        private getAllRolesUseCase: GetAllRolesUseCase,
        private router: Router,
        private notificationService: NotificationService,
        private deleteRoleUseCase: DeleteRoleUseCase,
        private periodicRefresh: PeriodicRefreshService,
        readonly permissionService: PermissionService
    ) {}

    ngOnInit(): void {
        this.pollingHandle = this.periodicRefresh.create({
            intervalMs: POLLING_INTERVALS.roles,
            request: () => this.getAllRolesUseCase.execute()
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

                console.error('Error al cargar roles:', event.error);
                this.errorMessage = 'No se pudo cargar la lista de roles.';
            });
    }

    loadRoles(): void {
        this.pollingHandle?.refresh();
    }

    applyFilter(event: Event) {
        const filterValue = (event.target as HTMLInputElement).value;
        this.dataSource.filter = filterValue.trim().toLowerCase();
        if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
        }
    }

    getPermissionLabels(role: RoleModel): string[] {
        const labels: string[] = [];
        if (role.canMakeEntry) labels.push('Entrada');
        if (role.canMakeOutput) labels.push('Salida');
        if (role.canManageUsers) labels.push('Usuarios');
        if (role.canManageRoles) labels.push('Roles');
        if (role.canManageCatalog) labels.push('Catálogo');
        if (role.canGenerateSeals) labels.push('Sellos');
        if (role.canGenerateLetters) labels.push('Cartas');
        return labels;
    }

    addRole(): void {
        this.router.navigate(['/dashboard/roles/new']);
    }

    editRole(id: number): void {
        this.router.navigate([`/dashboard/roles/edit/${id}`]);
    }

    async deleteRole(id: number): Promise<void> {
        if (confirm(`Esta seguro de eliminar el rol con ID ${id}?`)) {
            try {
                await this.deleteRoleUseCase.execute(id);
                this.notificationService.showSuccess("Se ha eliminado el rol correctamente");
                this.pollingHandle?.refreshAfterMutation();
            } catch (error: unknown) {
                console.error('Error al eliminar rol: ', error);
                this.notificationService.showError(getFallbackMessage(error, 'Error al eliminar el rol'));
            }
        }
    }

    trackByRoleId(_index: number, role: RoleModel): number {
        return role.id;
    }
}
