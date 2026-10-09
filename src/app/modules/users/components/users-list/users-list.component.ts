// src/app/modules/users/components/users-list/users-list.component.ts

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
import { UserModel } from '../../../../core/domain/models/user.model';
import { GetAllUsersUseCase } from '../../../../core/application/usecase/users/get-all-users.usecase';
import { NotificationService } from '../../../../shared/services/notification.service';
import { DeleteUserUseCase } from '../../../../core/application/usecase/users/delete-user.usecase'; 
import { PermissionService } from '../../../../core/application/services/permission.service';
import { PERMISSIONS } from '../../../../core/domain/models/permission.model';
import { getFallbackMessage } from '../../../../shared/utils/http-error-message';
import { POLLING_INTERVALS } from '../../../../shared/polling/polling-intervals';
import { PeriodicRefreshHandle, PeriodicRefreshService } from '../../../../shared/polling/periodic-refresh.service';
import { SpanishPaginatorIntl } from '../../../../shared/material/spanish-paginator-intl';

@Component({
    selector: 'app-users-list',
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
    templateUrl: './users-list.component.html',
    styleUrls: ['./users-list.component.scss'],
    providers: [{ provide: MatPaginatorIntl, useClass: SpanishPaginatorIntl }]
})
export class UsersListComponent implements OnInit {
    readonly permissions = PERMISSIONS;
    private readonly destroyRef = inject(DestroyRef);
    private pollingHandle?: PeriodicRefreshHandle<UserModel[]>;
  
    loading = true;
    errorMessage = '';
    dataSource = new MatTableDataSource<UserModel>([]);
    displayedColumns: string[] = ['ci', 'nombre', 'role', 'actions'];
    
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    constructor(
        // Inyectamos el Caso de Uso
        private getAllUsersUseCase: GetAllUsersUseCase,
        private router: Router,
        private notificationService: NotificationService,
        private deleteUserUseCase: DeleteUserUseCase,
        private periodicRefresh: PeriodicRefreshService,
        readonly permissionService: PermissionService
    ) {}

    ngOnInit(): void {
        this.pollingHandle = this.periodicRefresh.create({
            intervalMs: POLLING_INTERVALS.users,
            request: () => this.getAllUsersUseCase.execute()
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

                console.error('Error al cargar usuarios:', event.error);
                this.errorMessage = 'No se pudo cargar la lista de usuarios.';
            });
    }

    loadUsers(): void {
        this.pollingHandle?.refresh();
    }

    applyFilter(event: Event) {
        const filterValue = (event.target as HTMLInputElement).value;
        this.dataSource.filter = filterValue.trim().toLowerCase();
        if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
        }
    }

    addUser(): void {
        this.router.navigate(['/dashboard/users/new']);
    }

    editUser(ci: number): void {
        this.router.navigate([`/dashboard/users/edit/${ci}`]);
    }

    async deleteUser(ci: number): Promise<void> {
        if (confirm(`¿Está seguro de eliminar al usuario con CI ${ci}?`)) {
            try {
                await this.deleteUserUseCase.execute(ci); 
                this.notificationService.showSuccess("Usuario eliminado correctamente");
                this.pollingHandle?.refreshAfterMutation();
            } catch (error: unknown) {
                console.error('Error al eliminar usuario:', error);
                this.notificationService.showError(getFallbackMessage(
                    error,
                    'Error al eliminar el usuario',
                    { 403: 'No tiene permisos para eliminar usuarios.' }
                ));
            }
        }
    }

    trackByUserCi(_index: number, user: UserModel): number {
        return user.ci;
    }
}
