// src/app/modules/items/components/items-list/items-list.component.ts

import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
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
// import { DeleteItemUseCase } from '../../../../core/application/usecase/items/delete-item.usecase'; // Para futuras implementaciones

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
  providers: [NotificationService]
})
export class ItemsListComponent implements OnInit, OnDestroy {
    
    loading = false;
    dataSource = new MatTableDataSource<ItemModel>([]);
    displayedColumns: string[] = ['codigo', 'nombreItem', 'stock', 'unidad', 'actions'];
    private destroy$ = new Subject<void>();
    
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    constructor(
        private getAllItemsUseCase: GetAllItemsUseCase,
        private router: Router,
        private notificationService: NotificationService
        // private deleteItemUseCase: DeleteItemUseCase
    ) {}

    ngOnInit(): void {
        this.loadItems();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadItems(): void {
        this.loading = true;
        this.getAllItemsUseCase.execute()
        .then(items => {
            this.dataSource.data = items;
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
            this.loading = false;
        })
        .catch(error => {
            console.error('Error al cargar ítems:', error);
            this.notificationService.showError('No se pudo cargar el inventario. Intente más tarde.');
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

    addItem(): void {
        this.router.navigate(['/dashboard/items/new']);
    }

    editItem(codigo: string): void {
        this.router.navigate([`/dashboard/items/edit/${codigo}`]);
    }

    deleteItem(codigo: string): void {
        if (confirm(`¿Está seguro de eliminar el ítem con código ${codigo}?`)) {
            this.notificationService.showWarning('Funcionalidad de Eliminación Pendiente.');
        }
    }
}