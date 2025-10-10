// src/app/modules/users/components/users-list/users-list.component.ts

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
import { UserModel } from '../../../../core/domain/models/user.model';
import { GetAllUsersUseCase } from '../../../../core/application/usecase/users/get-all-users.usecase';
import { NotificationService } from '../../../../shared/services/notification.service';
// import { DeleteUserUseCase } from '../../../../core/application/usecase/users/delete-user.usecase'; 

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
        MatChipsModule
    ],
    templateUrl: './users-list.component.html',
    styleUrls: ['./users-list.component.scss']
})
export class UsersListComponent implements OnInit, OnDestroy {
  
    loading = false;
    dataSource = new MatTableDataSource<UserModel>([]);
    displayedColumns: string[] = ['ci', 'nombre', 'role', 'actions'];
    private destroy$ = new Subject<void>();
    
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    constructor(
        // Inyectamos el Caso de Uso
        private getAllUsersUseCase: GetAllUsersUseCase,
        private router: Router,
        private notificationService: NotificationService
        // private deleteUserUseCase: DeleteUserUseCase
    ) {}

    ngOnInit(): void {
        this.loadUsers();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Carga los usuarios usando el Caso de Uso.
     */
    loadUsers(): void {
        this.loading = true;
        this.getAllUsersUseCase.execute()
        .then(users => {
            this.dataSource.data = users;
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
            this.loading = false;
        })
        .catch(error => {
            console.error('Error al cargar usuarios:', error);
            this.notificationService.showError('No se pudo cargar la lista de usuarios. Intente más tarde.');
            this.loading = false;
        });
    }

    /**
     * Filtra los datos de la tabla.
     */
    applyFilter(event: Event) {
        const filterValue = (event.target as HTMLInputElement).value;
        this.dataSource.filter = filterValue.trim().toLowerCase();
        if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
        }
    }

    // Métodos de acción (CRUD)
    addUser(): void {
        this.router.navigate(['/dashboard/users/new']);
    }

    editUser(ci: number): void {
        this.router.navigate([`/dashboard/users/edit/${ci}`]);
    }

    deleteUser(ci: number): void {
        if (confirm(`¿Está seguro de eliminar al usuario con CI ${ci}?`)) {
            // Lógica: Llamar al deleteUserUseCase.execute(ci)
            this.notificationService.showWarning('Funcionalidad de Eliminación de Usuarios Pendiente.');
        }
    }
}