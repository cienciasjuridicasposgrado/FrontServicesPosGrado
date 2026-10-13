import { PrintService } from '../../../../shared/printing/print.service';
import { DocumentCreatedDialogComponent } from '../../../../shared/dialogs/document-created-dialog/document-created-dialog.component';
import { Component, DestroyRef, NgZone, OnInit, ViewChild, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
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
import { ConfirmationDialogService } from '../../../../shared/dialogs/confirmation-dialog/confirmation-dialog.service';
import { AuthService } from '../../../../core/application/services/auth.service';
import { UserModel } from '../../../../core/domain/models/user.model';
import { distinctUntilChanged, map } from 'rxjs';

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
  private readonly confirmationDialog = inject(ConfirmationDialogService);
  private readonly printService = inject(PrintService);
  private readonly ngZone = inject(NgZone);
  private pollingHandle?: PeriodicRefreshHandle<SealNumberModel[]>;
  private activeScope = '';

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
    private authService: AuthService,
    readonly permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.pipe(
      map((user) => this.scopeFor(user)),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((scope) => {
      this.pollingHandle?.stop();
      this.pollingHandle = undefined;
      this.activeScope = scope;
      this.dataSource.data = [];
      this.errorMessage = '';
      this.loading = !!scope;
      if (scope) this.startPolling(scope);
    });
  }

  private scopeFor(user: UserModel | null): string {
    return user?.role?.canGenerateSeals === true
      ? `${user.ci}:${user.role.canManageUsers === true}` : '';
  }

  private startPolling(scope: string): void {
    this.pollingHandle = this.periodicRefresh.create({
      intervalMs: POLLING_INTERVALS.sealNumbers,
      request: () => this.getAllUseCase.execute().catch((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 404 &&
          scope === this.activeScope && scope === this.scopeFor(this.authService.getCurrentUser())) {
          this.ngZone.run(() => {
            this.dataSource.data = [];
            this.loading = false;
            this.errorMessage = 'Los sellos solicitados ya no están disponibles.';
          });
        }
        throw error;
      })
    });

    this.pollingHandle.events$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (scope !== this.activeScope || scope !== this.scopeFor(this.authService.getCurrentUser())) return;
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
        this.dataSource.data = [];
        this.errorMessage = event.error instanceof HttpErrorResponse && event.error.status === 403
          ? 'Ya no tienes permiso para consultar estos sellos.'
          : event.error instanceof HttpErrorResponse && event.error.status === 404
            ? 'Los sellos solicitados ya no están disponibles.'
            : getFallbackMessage(event.error, 'No se pudieron cargar los sellos.');
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
    if (!this.activeScope || !this.permissionService.has(PERMISSIONS.generateSeals) ||
      this.activeScope !== this.scopeFor(this.authService.getCurrentUser())) return;
    const scope = this.activeScope;
    const dialogRef = this.dialog.open(SealNumberFormComponent, {
      width: '600px',
      maxWidth: 'calc(100vw - 24px)',
      panelClass: 'document-form-dialog-panel',
      data: { action: 'create' }
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (scope !== this.activeScope || scope !== this.scopeFor(this.authService.getCurrentUser())) return;
      if (result) this.pollingHandle?.refreshAfterMutation();
      if (result?.createdNumber) {
        this.dialog.open(DocumentCreatedDialogComponent, {
          width: '420px', maxWidth: 'calc(100vw - 24px)',
          data: { type: 'Sello', number: result.createdNumber }
        });
      }
    });
  }

  editSeal(id: number): void {
    if (!this.activeScope || !this.permissionService.has(PERMISSIONS.generateSeals) ||
      this.activeScope !== this.scopeFor(this.authService.getCurrentUser())) return;
    const seal = this.dataSource.data.find(s => s.id === id);
    if (!seal) return;

    const scope = this.activeScope;
    const dialogRef = this.dialog.open(SealNumberFormComponent, {
      width: '600px',
      maxWidth: 'calc(100vw - 24px)',
      panelClass: 'document-form-dialog-panel',
      data: { action: 'edit', seal }
    });

    dialogRef.beforeClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (scope !== this.activeScope || scope !== this.scopeFor(this.authService.getCurrentUser())) return;
      if (result) this.pollingHandle?.refreshAfterMutation();
    });
  }

  async deleteSeal(id: number): Promise<void> {
    const scope = this.activeScope;
    if (!scope || scope !== this.scopeFor(this.authService.getCurrentUser()) ||
      !this.permissionService.has(PERMISSIONS.generateSeals)) return;
    const seal = this.dataSource.data.find((candidate) => candidate.id === id);
    if (!seal) return;
    const confirmed = await this.confirmationDialog.confirm({
      title: 'Eliminar sello',
      description: 'Se eliminará el registro del número de sello seleccionado.',
      confirmLabel: 'Eliminar',
      variant: 'destructive',
      recordLabel: `Sello ${seal.numeroSello}`
    });
    if (!confirmed || !this.permissionService.has(PERMISSIONS.generateSeals) ||
      scope !== this.activeScope ||
      scope !== this.scopeFor(this.authService.getCurrentUser())) return;

    try {
      await this.deleteUseCase.execute(id);
      if (scope !== this.activeScope || scope !== this.scopeFor(this.authService.getCurrentUser())) return;
      this.snackBar.open('Sello eliminado correctamente.', 'Cerrar', { duration: 3000 });
      this.pollingHandle?.refreshAfterMutation();
    } catch (error) {
      if (scope !== this.activeScope || scope !== this.scopeFor(this.authService.getCurrentUser())) return;
      console.error(error);
      const message = error instanceof HttpErrorResponse && error.status === 403
        ? 'Ya no tienes permiso para eliminar este sello.'
        : error instanceof HttpErrorResponse && error.status === 404
          ? 'El sello ya no está disponible.'
          : getFallbackMessage(error, 'Error al eliminar el sello.');
      this.snackBar.open(message, 'Cerrar', { duration: 3000 });
    }
  }

  printList(): void {
    if (!this.activeScope || this.activeScope !== this.scopeFor(this.authService.getCurrentUser()) ||
      !this.dataSource.filteredData.length) return;
    this.printService.printList('Sellos', this.dataSource, [
      { heading: 'N° Sello', value: r => r.numeroSello },
      { heading: 'Solicitante', value: r => r.userName && r.userName !== '-' ? `${r.userName} · CI ${r.user_ci}` : (r.user_ci ? `CI ${r.user_ci}` : '') },
      { heading: 'Fecha', value: r => new Date(r.fecha).toLocaleString('es-BO') },
      { heading: 'Observación', value: r => r.observacion }
    ]);
  }

  trackBySealId(_index: number, seal: SealNumberModel): number {
    return seal.id;
  }
}
