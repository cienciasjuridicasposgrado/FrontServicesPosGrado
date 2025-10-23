import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DeleteSealNumberUseCase } from '../../../../core/application/usecase/seal-numbers/delete-seal-number.usecase';
import { GetAllSealNumbersUseCase } from '../../../../core/application/usecase/seal-numbers/get-all-seal-numbers.usecase';
import { SealNumberModel } from '../../../../core/domain/models/seal-number.model';
import { SealNumberFormComponent } from '../seal-number-form/seal-number-form.component';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReactiveFormsModule } from '@angular/forms';
import { NotificationService } from '../../../../shared/services/notification.service';
import { CoreModule } from '../../../../core/core.module';

@Component({
  selector: 'app-seal-numbers-list',
  standalone: true,
  templateUrl: './seal-numbers-list.component.html',
  styleUrls: ['./seal-numbers-list.component.scss'],
  imports: [
    CommonModule,
    CoreModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  providers: [NotificationService]
})
export class SealNumbersListComponent implements OnInit {

  displayedColumns: string[] = ['numeroSello', 'userName', 'fecha', 'observacion', 'actions'];
  dataSource = new MatTableDataSource<SealNumberModel>();
  loading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private getAllUseCase: GetAllSealNumbersUseCase,
    private deleteUseCase: DeleteSealNumberUseCase,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadSealNumbers();
  }

    async loadSealNumbers(): Promise<void> {
      this.loading = true;
      try {
        const data = await this.getAllUseCase.execute();
        // Crear userName para usar directamente en la tabla
        this.dataSource.data = data.map(s => ({
          ...s,
          userName: s.userName || '-'
        }));
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      } catch (error) {
        console.error('Error al cargar los sellos:', error);
        this.snackBar.open('Error al cargar los números de sello.', 'Cerrar', { duration: 3000 });
      } finally {
        this.loading = false;
      }
    }


  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = filterValue;
  }

  addSeal(): void {
    const dialogRef = this.dialog.open(SealNumberFormComponent, {
      width: '600px',
      data: { action: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadSealNumbers();
    });
  }

  editSeal(id: number): void {
    const seal = this.dataSource.data.find(s => s.id === id);
    if (!seal) return;

    const dialogRef = this.dialog.open(SealNumberFormComponent, {
      width: '600px',
      data: { action: 'edit', seal }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadSealNumbers();
    });
  }

  async deleteSeal(id: number): Promise<void> {
    if (!confirm('¿Está seguro de eliminar este número de sello?')) return;

    try {
      await this.deleteUseCase.execute(id);
      this.snackBar.open('Sello eliminado correctamente.', 'Cerrar', { duration: 3000 });
      this.loadSealNumbers();
    } catch (error) {
      console.error(error);
      this.snackBar.open('Error al eliminar el sello.', 'Cerrar', { duration: 3000 });
    }
  }
}