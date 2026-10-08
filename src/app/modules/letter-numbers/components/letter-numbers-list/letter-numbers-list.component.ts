import { Component, DestroyRef, OnInit, ViewChild, inject } from "@angular/core";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatPaginator, MatPaginatorModule } from "@angular/material/paginator";
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
  providers: [NotificationService]
})
export class LetterNumbersListComponent implements OnInit {
    readonly permissions = PERMISSIONS;
    private readonly destroyRef = inject(DestroyRef);
    private pollingHandle?: PeriodicRefreshHandle<LetterNumberModel[]>;
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
        readonly permissionService: PermissionService
    ) {}

    ngOnInit(): void {
      this.pollingHandle = this.periodicRefresh.create({
        intervalMs: POLLING_INTERVALS.letterNumbers,
        request: () => this.getLetters.execute()
      });

      this.pollingHandle.events$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((event) => {
          this.loading = false;
          if (event.type === 'success') {
            this.dataSource.data = event.data;
            this.dataSource.paginator ??= this.paginator;
            this.errorMessage = '';
            return;
          }

          console.error('Error al cargar los números de carta:', event.error);
          this.errorMessage = getFallbackMessage(event.error, 'No se pudieron cargar las cartas.');
        });
    }

    loadData(): void {
      this.pollingHandle?.refresh();
    }

    openForm(element?: LetterNumberModel) {
        const dialogRef = this.dialog.open(LetterNumberFormComponent, {
        width: '400px',
        maxWidth: 'calc(100vw - 24px)',
        panelClass: 'document-form-dialog-panel',
        data: element || null
        });

        dialogRef.beforeClosed().subscribe(result => {
        if (result) this.pollingHandle?.refreshAfterMutation();
        });
    }

    async delete(id: number) {
        if (confirm('Seguro que desea eliminar este numero de carta?')) {
            try {
                await this.deleteLetter.execute(id);
                this.pollingHandle?.refreshAfterMutation();
            } catch (err: any) {
                console.error("Error al eliminar el numero de carta:", err);
                this.errorMessage = getFallbackMessage(err, 'No se pudo eliminar la carta.');
            }
        }
    }

    trackByLetterId(_index: number, letter: LetterNumberModel): number {
      return letter.id;
    }
}
