import { Component, DestroyRef, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReactiveFormsModule } from '@angular/forms';
import { NotificationService } from '../../../../shared/services/notification.service';
import { PermissionService } from '../../../../core/application/services/permission.service';
import { PERMISSIONS } from '../../../../core/domain/models/permission.model';
import { POLLING_INTERVALS } from '../../../../shared/polling/polling-intervals';
import {
  PeriodicRefreshHandle,
  PeriodicRefreshService
} from '../../../../shared/polling/periodic-refresh.service';
import { getFallbackMessage } from '../../../../shared/utils/http-error-message';
import { SpanishPaginatorIntl } from '../../../../shared/material/spanish-paginator-intl';

@Component({
  selector: 'app-seal-numbers-list',
  standalone: true,
  templateUrl: './seal-numbers-list.component.html',
  styleUrls: ['./seal-numbers-list.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
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
  providers: [NotificationService, { provide: MatPaginatorIntl, useClass: SpanishPaginatorIntl }]
})
export class SealNumbersListComponent implements OnInit {
  readonly permissions = PERMISSIONS;
  private readonly destroyRef = inject(DestroyRef);
  private pollingHandle?: PeriodicRefreshHandle<SealNumberModel[]>;

  displayedColumns: string[] = ['numeroSello', 'userName', 'fecha', 'observacion', 'actions'];
  dataSource = new MatTableDataSource<SealNumberModel>();
  loading = true;
  errorMessage = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private getAllUseCase: GetAllSealNumbersUseCase,
    private deleteUseCase: DeleteSealNumberUseCase,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private periodicRefresh: PeriodicRefreshService,
    readonly permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    this.pollingHandle = this.periodicRefresh.create({
      intervalMs: POLLING_INTERVALS.sealNumbers,
      request: () => this.getAllUseCase.execute()
    });

    this.pollingHandle.events$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (event.type === 'success') {
          this.dataSource.data = event.data.map((seal) => ({
            ...seal,
            userName: seal.userName || '-'
          }));
          this.dataSource.paginator ??= this.paginator;
          this.dataSource.sort ??= this.sort;
          this.loading = false;
          this.errorMessage = '';
          return;
        }

        this.loading = false;
        console.error('Error al cargar los sellos:', event.error);
        this.errorMessage = getFallbackMessage(event.error, 'No se pudieron cargar los sellos.');
      });
  }

  loadSealNumbers(): void {
    this.pollingHandle?.refresh();
  }


  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = filterValue;
  }

  addSeal(): void {
    const dialogRef = this.dialog.open(SealNumberFormComponent, {
      width: '600px',
      maxWidth: 'calc(100vw - 24px)',
      panelClass: 'document-form-dialog-panel',
      data: { action: 'create' }
    });

    dialogRef.beforeClosed().subscribe(result => {
      if (result) this.pollingHandle?.refreshAfterMutation();
    });
  }

  editSeal(id: number): void {
    const seal = this.dataSource.data.find(s => s.id === id);
    if (!seal) return;

    const dialogRef = this.dialog.open(SealNumberFormComponent, {
      width: '600px',
      maxWidth: 'calc(100vw - 24px)',
      panelClass: 'document-form-dialog-panel',
      data: { action: 'edit', seal }
    });

    dialogRef.beforeClosed().subscribe(result => {
      if (result) this.pollingHandle?.refreshAfterMutation();
    });
  }

  async deleteSeal(id: number): Promise<void> {
    if (!confirm('¿Está seguro de eliminar este número de sello?')) return;

    try {
      await this.deleteUseCase.execute(id);
      this.snackBar.open('Sello eliminado correctamente.', 'Cerrar', { duration: 3000 });
      this.pollingHandle?.refreshAfterMutation();
    } catch (error) {
      console.error(error);
      this.snackBar.open('Error al eliminar el sello.', 'Cerrar', { duration: 3000 });
    }
  }

  trackBySealId(_index: number, seal: SealNumberModel): number {
    return seal.id;
  }
}
