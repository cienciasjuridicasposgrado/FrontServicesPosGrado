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
import { MatChipsModule } from '@angular/material/chips';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';

// Capas de Clean Architecture
import { RoleModel } from '../../../../core/domain/models/role.model';
import { GetAllRolesUseCase } from '../../../../core/application/usecase/roles/get-all-roles.usecase';
import { NotificationService } from '../../../../shared/services/notification.service';
import { DeleteRoleUseCase } from '../../../../core/application/usecase/roles/delete-role.usecase';

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
    MatChipsModule
  ],
  templateUrl: './roles-list.component.html',
  styleUrls: ['./roles-list.component.scss']
})
export class RolesListComponent implements OnInit, OnDestroy {
    loading = false;
    dataSource = new MatTableDataSource<RoleModel>([]);
    displayedColumns: string[] = ['id', 'name', 'permissions', 'description', 'actions'];
    private destroy$ = new Subject<void>();
    
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    constructor(
        private getAllRolesUseCase: GetAllRolesUseCase,
        private router: Router,
        private notificationService: NotificationService,
        private deleteRoleUseCase: DeleteRoleUseCase
    ) {}

    ngOnInit(): void {
        this.loadRoles();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadRoles(): void {
        this.loading = true;
        this.getAllRolesUseCase.execute()
        .then(roles => {
            this.dataSource.data = roles;
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
            this.loading = false;
        })
        .catch(error => {
            console.error('Error al cargar roles:', error);
            this.notificationService.showError('No se pudo cargar la lista de roles. Intente más tarde.');
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

    getPermissionTags(role: RoleModel): string[] {
        const tags = [];
        if (role.can_make_entry) tags.push('E'); // Entrada
        if (role.can_make_seals) tags.push('S'); // Sello
        if (role.can_make_letter) tags.push('C'); // Carta
        return tags;
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
                this.loadRoles();
            } catch (error: any) {
                console.error('Error al eliminar rol: ', error);
                this.notificationService.showError(error.message || "Eror al eliminar el rol");
            }
        }
    }
}