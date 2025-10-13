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
import { DepartamentoModel } from '../../../../core/domain/models/departamento.model';
import { GetAllDepartamentosUseCase } from '../../../../core/application/usecase/departamentos/get-all-departamentos.usecase';
import { NotificationService } from '../../../../shared/services/notification.service';
import { DeleteDepartamentoUseCase } from '../../../../core/application/usecase/departamentos/delete-departamento.usecase'; 

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
export class DepartamentosListComponent implements OnInit, OnDestroy {

    loading = false;
    dataSource = new MatTableDataSource<DepartamentoModel>([]);
    displayedColumns: string[] = ['id', 'nombre', 'descripcion', 'actions'];
    private destroy$ = new Subject<void>();
    
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    constructor(
        private getAllDepartamentosUseCase: GetAllDepartamentosUseCase,
        private router: Router,
        private notificationService: NotificationService,
        private deleteDepartamentoUseCase: DeleteDepartamentoUseCase
    ) {}

    ngOnInit(): void {
        this.loadDepartamentos();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadDepartamentos(): void {
        this.loading = true;
        this.getAllDepartamentosUseCase.execute()
        .then(departamentos => {
            this.dataSource.data = departamentos;
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
            this.loading = false;
        })
        .catch(error => {
            console.error('Error al cargar departamentos:', error);
            this.notificationService.showError('No se pudo cargar la lista de departamentos. Intente más tarde.');
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
                this.loadDepartamentos();
            } catch (error: any) {
                console.error('Error al eliminar departamento:', error);
                this.notificationService.showError(error.message || "Error al eliminar el departamento");
            }
        }
    }
}