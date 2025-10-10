// src/app/modules/inventory/components/entries-list/entries-list.component.ts

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
import { InventoryEntryModel } from '../../../../core/domain/models/inventory-entry.model';
import { GetAllEntriesUseCase } from '../../../../core/application/usecase/inventory-entries/get-all-entries.usecase';
import { NotificationService } from '../../../../shared/services/notification.service';
// import { DeleteEntryUseCase } from '../../../../core/application/usecase/inventory-entries/delete-entry.usecase'; 

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
    styleUrls: ['./entries-list.component.scss']
})
export class EntriesListComponent implements OnInit, OnDestroy {
    loading = false;
    dataSource = new MatTableDataSource<InventoryEntryModel>([]);
    displayedColumns: string[] = ['id', 'fecha', 'itemCodigo', 'item', 'cantidad', 'user', 'observacion', 'actions'];
    private destroy$ = new Subject<void>();
    
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    constructor(
        private getAllEntriesUseCase: GetAllEntriesUseCase,
        private router: Router,
        private notificationService: NotificationService
    ) {}

    ngOnInit(): void {
        this.loadEntries();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadEntries(): void {
        this.loading = true;
        this.getAllEntriesUseCase.execute()
        .then(entries => {
            this.dataSource.data = entries;
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
            this.loading = false;
        })
        .catch(error => {
            console.error('Error al cargar entradas:', error);
            this.notificationService.showError('No se pudo cargar el historial de entradas.');
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

    addEntry(): void {
        this.router.navigate(['/dashboard/entries/new']);
    }

    viewEntry(id: number): void {
        // Para ver detalles o anular
        this.router.navigate([`/dashboard/entries/${id}`]);
    }
    
    // Nota: La anulación (eliminación) de entradas es una operación de alto riesgo.
    deleteEntry(id: number): void {
        if (confirm(`ADVERTENCIA: ¿Está seguro de ANULAR la entrada ID ${id}? Esto afectará el stock.`)) {
            this.notificationService.showWarning('La anulación debe ser implementada en el backend con reversión transaccional.');
        }
    }
}