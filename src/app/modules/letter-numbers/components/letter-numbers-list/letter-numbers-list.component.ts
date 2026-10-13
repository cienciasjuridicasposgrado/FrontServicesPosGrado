import { PrintService } from '../../../../shared/printing/print.service';
import { DocumentCreatedDialogComponent } from '../../../../shared/dialogs/document-created-dialog/document-created-dialog.component';
import { Component, DestroyRef, NgZone, OnInit, ViewChild, inject } from "@angular/core";
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatPaginator, MatPaginatorIntl, MatPaginatorModule } from "@angular/material/paginator";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { DeleteLetterNumberUseCase } from "../../../../core/application/usecase/letter-numbers/delete-letter-number.usecase";
import { GetLetterNumbersUseCase } from "../../../../core/application/usecase/letter-numbers/get-letter-numbers.usecase";
import { LetterNumberModel } from "../../../../core/domain/models/letter-number.model";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { MatSortModule } from "@angular/material/sort";
import { LetterNumberFormComponent } from "../letter-number-form/letter-number-form.component";
import { NotificationService } from "../../../../shared/services/notification.service";
import { PermissionService } from "../../../../core/application/services/permission.service";
import { PERMISSIONS } from "../../../../core/domain/models/permission.model";
import { getFallbackMessage } from '../../../../shared/utils/http-error-message';
import { POLLING_INTERVALS } from '../../../../shared/polling/polling-intervals';
import { PeriodicRefreshHandle, PeriodicRefreshService } from '../../../../shared/polling/periodic-refresh.service';
import { SpanishPaginatorIntl } from '../../../../shared/material/spanish-paginator-intl';
import { ConfirmationDialogService } from '../../../../shared/dialogs/confirmation-dialog/confirmation-dialog.service';
import { AuthService } from '../../../../core/application/services/auth.service';
import { UserModel } from '../../../../core/domain/models/user.model';
import { distinctUntilChanged, map } from 'rxjs';

@Component({
  selector: 'app-letter-numbers-list',
  standalone: true,
  templateUrl: './letter-numbers-list.component.html',
  styleUrls: ['./letter-numbers-list.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  providers: [NotificationService, { provide: MatPaginatorIntl, useClass: SpanishPaginatorIntl }]
})
export class LetterNumbersListComponent implements OnInit {
    readonly permissions = PERMISSIONS;
    private readonly destroyRef = inject(DestroyRef);
    private readonly confirmationDialog = inject(ConfirmationDialogService);
    private readonly printService = inject(PrintService);
    private readonly ngZone = inject(NgZone);
    private pollingHandle?: PeriodicRefreshHandle<LetterNumberModel[]>;
    private activeScope = '';
    displayedColumns = ['id', 'numero_carta', 'user', 'fecha', 'observacion', 'acciones'];
    dataSource = new MatTableDataSource<LetterNumberModel>([]);
    loading = true;
    errorMessage = '';
    @ViewChild(MatPaginator) paginator!: MatPaginator;

    constructor(
        private getLetters: GetLetterNumbersUseCase,
        private deleteLetter: DeleteLetterNumberUseCase,
        private dialog: MatDialog,
        private periodicRefresh: PeriodicRefreshService,
        private authService: AuthService,
        readonly permissionService: PermissionService
    ) {
      this.dataSource.filterPredicate = (letter, filter) => [
        letter.numero_carta, letter.user?.nombre, letter.user?.ci, letter.observacion
      ].some((value) => String(value ?? '').toLowerCase().includes(filter));
    }

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
      return user?.role?.canGenerateLetters === true
        ? `${user.ci}:${user.role.canManageUsers === true}` : '';
    }

    private startPolling(scope: string): void {
      this.pollingHandle = this.periodicRefresh.create({
        intervalMs: POLLING_INTERVALS.letterNumbers,
        request: () => this.getLetters.execute().catch((error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 404 &&
            scope === this.activeScope && scope === this.scopeFor(this.authService.getCurrentUser())) {
            this.ngZone.run(() => {
              this.dataSource.data = [];
              this.loading = false;
              this.errorMessage = 'Las cartas solicitadas ya no están disponibles.';
            });
          }
          throw error;
        })
      });

      this.pollingHandle.events$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((event) => {
          if (scope !== this.activeScope || scope !== this.scopeFor(this.authService.getCurrentUser())) return;
          this.loading = false;
          if (event.type === 'success') {
            this.dataSource.data = event.data;
            this.dataSource.paginator ??= this.paginator;
            this.errorMessage = '';
            return;
          }

          console.error('Error al cargar los números de carta:', event.error);
          this.dataSource.data = [];
          this.errorMessage = event.error instanceof HttpErrorResponse && event.error.status === 403
            ? 'Ya no tienes permiso para consultar estas cartas.'
            : event.error instanceof HttpErrorResponse && event.error.status === 404
              ? 'Las cartas solicitadas ya no están disponibles.'
              : getFallbackMessage(event.error, 'No se pudieron cargar las cartas.');
        });
    }

    loadData(): void {
      this.pollingHandle?.refresh();
    }

    applyFilter(event: Event): void {
      this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
    }

    openForm(element?: LetterNumberModel) {
        if (!this.activeScope || !this.permissionService.has(PERMISSIONS.generateLetters) ||
          this.activeScope !== this.scopeFor(this.authService.getCurrentUser()) ||
          (element && !this.dataSource.data.some((letter) => letter.id === element.id))) return;
        const scope = this.activeScope;
        const dialogRef = this.dialog.open(LetterNumberFormComponent, {
        width: '400px',
        maxWidth: 'calc(100vw - 24px)',
        panelClass: 'document-form-dialog-panel',
        data: element || null
        });

        dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
          if (scope !== this.activeScope || scope !== this.scopeFor(this.authService.getCurrentUser())) return;
          if (result) this.pollingHandle?.refreshAfterMutation();
          if (result?.createdNumber) {
            this.dialog.open(DocumentCreatedDialogComponent, {
              width: '420px', maxWidth: 'calc(100vw - 24px)',
              data: { type: 'Carta', number: result.createdNumber }
            });
          }
        });
    }

    async delete(id: number) {
        const scope = this.activeScope;
        if (!scope || scope !== this.scopeFor(this.authService.getCurrentUser()) ||
          !this.permissionService.has(PERMISSIONS.generateLetters)) return;
        const letter = this.dataSource.data.find((candidate) => candidate.id === id);
        if (!letter) return;
        const confirmed = await this.confirmationDialog.confirm({
          title: 'Eliminar carta',
          description: 'Se eliminará el registro del número de carta seleccionado.',
          confirmLabel: 'Eliminar',
          variant: 'destructive',
          recordLabel: `Carta ${letter.numero_carta}`
        });
        if (!confirmed || !this.permissionService.has(PERMISSIONS.generateLetters) ||
          scope !== this.activeScope ||
          scope !== this.scopeFor(this.authService.getCurrentUser())) return;

        try {
            await this.deleteLetter.execute(id);
            if (scope !== this.activeScope || scope !== this.scopeFor(this.authService.getCurrentUser())) return;
            this.pollingHandle?.refreshAfterMutation();
        } catch (err: unknown) {
            if (scope !== this.activeScope || scope !== this.scopeFor(this.authService.getCurrentUser())) return;
            console.error("Error al eliminar el numero de carta:", err);
            this.errorMessage = err instanceof HttpErrorResponse && err.status === 403
              ? 'Ya no tienes permiso para eliminar esta carta.'
              : err instanceof HttpErrorResponse && err.status === 404
                ? 'La carta ya no está disponible.'
                : getFallbackMessage(err, 'No se pudo eliminar la carta.');
        }
    }

    printList(): void {
        if (!this.activeScope || this.activeScope !== this.scopeFor(this.authService.getCurrentUser()) ||
          !this.dataSource.filteredData.length) return;
        this.printService.printList('Cartas', this.dataSource, [
            { heading: 'ID', value: r => r.id },
            { heading: 'Número de carta', value: r => r.numero_carta },
            { heading: 'Solicitante', value: r => r.user?.nombre ? `${r.user.nombre} · CI ${r.user.ci}` : (r.user?.ci ? `CI ${r.user.ci}` : '') },
            { heading: 'Fecha', value: r => new Date(r.fecha).toLocaleString('es-BO') },
            { heading: 'Observación', value: r => r.observacion }
        ]);
    }

    trackByLetterId(_index: number, letter: LetterNumberModel): number {
      return letter.id;
    }
}
