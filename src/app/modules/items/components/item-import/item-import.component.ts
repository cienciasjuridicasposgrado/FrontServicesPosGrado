import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import { ConfirmItemsImportUseCase } from '../../../../core/application/usecase/items/confirm-items-import.usecase';
import { PreviewItemsImportUseCase } from '../../../../core/application/usecase/items/preview-items-import.usecase';
import { PermissionService } from '../../../../core/application/services/permission.service';
import {
  ItemsImportConfirmResponse,
  ItemsImportPreviewResponse,
  ItemsImportPreviewRow,
  isItemsImportPreviewResponse
} from '../../../../core/domain/models/item-import.model';
import { PERMISSIONS } from '../../../../core/domain/models/permission.model';
import { ConfirmationDialogService } from '../../../../shared/dialogs/confirmation-dialog/confirmation-dialog.service';
import { SpanishPaginatorIntl } from '../../../../shared/material/spanish-paginator-intl';
import { NotificationService } from '../../../../shared/services/notification.service';
import { getFallbackMessage } from '../../../../shared/utils/http-error-message';
import { ITEMS_TEMPLATE_FILENAME, ITEMS_TEMPLATE_URL } from '../../items-template';

const MAX_IMPORT_FILE_SIZE = 5 * 1024 * 1024;

@Component({
  selector: 'app-item-import',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTableModule
  ],
  templateUrl: './item-import.component.html',
  styleUrls: ['./item-import.component.scss', './item-import-preview.component.scss'],
  providers: [{ provide: MatPaginatorIntl, useClass: SpanishPaginatorIntl }]
})
export class ItemImportComponent {
  readonly maxFileSizeBytes = MAX_IMPORT_FILE_SIZE;
  readonly itemsTemplateUrl = ITEMS_TEMPLATE_URL;
  readonly itemsTemplateFilename = ITEMS_TEMPLATE_FILENAME;
  readonly displayedColumns = [
    'rowNumber',
    'codigo',
    'nombre',
    'unidad',
    'cantidadInicial',
    'operation',
    'status'
  ];
  readonly dataSource = new MatTableDataSource<ItemsImportPreviewRow>([]);

  selectedFile: File | null = null;
  preview: ItemsImportPreviewResponse | null = null;
  result: ItemsImportConfirmResponse | null = null;
  fileSelectionError = '';
  requestError = '';
  validating = false;
  confirming = false;
  confirmDialogOpen = false;
  showOnlyErrors = false;
  confirmationRequiresRevalidation = false;
  uncertainConfirmation = false;
  duplicateCodeCount = 0;

  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  @ViewChild(MatPaginator)
  set paginator(paginator: MatPaginator | undefined) {
    if (paginator) this.dataSource.paginator = paginator;
  }

  constructor(
    private readonly previewItemsImport: PreviewItemsImportUseCase,
    private readonly confirmItemsImport: ConfirmItemsImportUseCase,
    private readonly confirmationDialog: ConfirmationDialogService,
    private readonly notificationService: NotificationService,
    private readonly router: Router,
    readonly permissionService: PermissionService
  ) {
    this.dataSource.filterPredicate = (row, filter) =>
      filter !== 'errors' || this.rowHasErrors(row);
  }

  get busy(): boolean {
    return this.validating || this.confirming;
  }

  get hasRequiredPermissions(): boolean {
    return this.permissionService.hasAll([PERMISSIONS.manageCatalog, PERMISSIONS.makeEntry]);
  }

  get canConfirmImport(): boolean {
    return this.preview !== null
      && this.preview.canConfirm
      && this.selectedFile !== null
      && this.preview.fileHash.trim().length > 0
      && this.hasRequiredPermissions
      && !this.busy
      && !this.confirmDialogOpen
      && !this.confirmationRequiresRevalidation
      && this.result === null;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectFile(input.files?.item(0) ?? null);
    if (!this.selectedFile) input.value = '';
  }

  openFilePicker(input: HTMLInputElement): void {
    if (this.busy || this.result) return;
    input.value = '';
    input.click();
  }

  changeFile(): void {
    if (this.fileInput) this.openFilePicker(this.fileInput.nativeElement);
  }

  startNewImport(): void {
    if (!this.result || this.busy) return;
    this.resetImportState();
  }

  selectFile(file: File | null): void {
    if (this.busy) return;

    this.resetImportState();
    if (!file) return;

    if (!/\.xlsx$/i.test(file.name)) {
      this.fileSelectionError = 'Seleccione un archivo Excel con extensión .xlsx.';
      this.notificationService.showError(this.fileSelectionError);
      return;
    }

    if (file.size > MAX_IMPORT_FILE_SIZE) {
      this.fileSelectionError = 'El archivo supera el tamaño máximo permitido de 5 MiB.';
      this.notificationService.showError(this.fileSelectionError);
      return;
    }

    this.selectedFile = file;
  }

  async validateFile(): Promise<void> {
    if (!this.selectedFile || this.busy || this.result) return;

    this.validating = true;
    this.requestError = '';
    this.uncertainConfirmation = false;
    this.confirmationRequiresRevalidation = false;
    this.result = null;

    try {
      const preview = await this.previewItemsImport.execute(this.selectedFile);
      this.applyPreview(preview);
      if (preview.canConfirm) {
        this.notificationService.showSuccess('Archivo validado correctamente.');
      } else {
        this.notificationService.showWarning('Revise los errores del archivo antes de importar.');
      }
    } catch (error) {
      const recoveredPreview = this.getErrorPreview(error);
      if (recoveredPreview) {
        this.applyPreview(recoveredPreview);
        this.requestError = 'El archivo contiene errores. Revise el detalle antes de continuar.';
      } else {
        this.preview = null;
        this.duplicateCodeCount = 0;
        this.dataSource.data = [];
        this.requestError = this.getRequestErrorMessage(error, 'No se pudo validar el archivo.');
      }
      this.notificationService.showError(this.requestError);
    } finally {
      this.validating = false;
    }
  }

  async confirmImport(): Promise<void> {
    if (!this.canConfirmImport || !this.selectedFile || !this.preview) return;

    const file = this.selectedFile;
    const preview = this.preview;
    this.confirmDialogOpen = true;
    let confirmed = false;

    try {
      confirmed = await this.confirmationDialog.confirm({
        title: 'Confirmar importación',
        description: [
          `Se crearán ${preview.summary.validItems} ítems.`,
          `Se registrarán ${preview.summary.entriesToCreate} Entradas de inventario.`,
          `Se incorporarán ${preview.summary.totalUnitsToAdd} unidades.`
        ].join('\n'),
        confirmLabel: 'Confirmar importación',
        variant: 'warning',
        recordLabel: file.name
      });
    } finally {
      this.confirmDialogOpen = false;
    }

    if (!confirmed || this.selectedFile !== file || this.preview !== preview || !this.canConfirmImport) {
      return;
    }

    this.confirming = true;
    this.requestError = '';
    this.uncertainConfirmation = false;

    try {
      this.result = await this.confirmItemsImport.execute(file, preview.fileHash);
      this.preview = null;
      this.duplicateCodeCount = 0;
      this.dataSource.data = [];
      this.notificationService.showSuccess('Importación completada correctamente.');
    } catch (error) {
      const recoveredPreview = this.getErrorPreview(error);
      if (recoveredPreview) {
        this.applyPreview(recoveredPreview);
        this.requestError = 'La validación cambió. Revise los errores actualizados del archivo.';
      } else if (error instanceof HttpErrorResponse && error.status === 409) {
        this.confirmationRequiresRevalidation = true;
        this.requestError = 'Existen conflictos con los códigos del archivo. Valide nuevamente antes de reintentar.';
      } else if (error instanceof HttpErrorResponse && error.status === 0) {
        this.confirmationRequiresRevalidation = true;
        this.uncertainConfirmation = true;
        this.requestError = 'Se perdió la conexión durante la confirmación. No se puede determinar si la importación terminó. Compruebe el listado o valide nuevamente antes de reintentar.';
      } else {
        this.requestError = this.getRequestErrorMessage(error, 'No se pudo completar la importación.');
      }
      this.notificationService.showError(this.requestError);
    } finally {
      this.confirming = false;
    }
  }

  toggleOnlyErrors(checked: boolean): void {
    this.showOnlyErrors = checked;
    this.dataSource.filter = checked ? 'errors' : '';
    this.dataSource.paginator?.firstPage();
  }

  rowHasErrors(row: ItemsImportPreviewRow): boolean {
    return row.status !== 'valid' || row.errors.length > 0;
  }

  operationLabel(row: ItemsImportPreviewRow): string {
    if (this.rowHasErrors(row)) return 'No disponible';
    return row.cantidadInicial > 0
      ? `Creará entrada +${row.cantidadInicial}`
      : 'Sin entrada · stock inicial 0';
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
  }

  backToItems(): void {
    if (!this.busy) void this.router.navigate(['/dashboard/items']);
  }

  trackByRowNumber(_index: number, row: ItemsImportPreviewRow): number {
    return row.rowNumber;
  }

  private resetImportState(): void {
    this.selectedFile = null;
    this.preview = null;
    this.result = null;
    this.fileSelectionError = '';
    this.requestError = '';
    this.showOnlyErrors = false;
    this.confirmationRequiresRevalidation = false;
    this.uncertainConfirmation = false;
    this.duplicateCodeCount = 0;
    this.dataSource.data = [];
    this.dataSource.filter = '';
  }

  private applyPreview(preview: ItemsImportPreviewResponse): void {
    this.preview = preview;
    this.duplicateCodeCount = new Set(preview.rows
      .filter((row) => row.errors.some((error) => error.code === 'ITEM_CODE_ALREADY_EXISTS'))
      .map((row) => row.codigo.trim().toUpperCase())).size;
    this.result = null;
    this.showOnlyErrors = false;
    this.dataSource.filter = '';
    this.dataSource.data = preview.rows;
  }

  private getErrorPreview(error: unknown): ItemsImportPreviewResponse | null {
    if (!(error instanceof HttpErrorResponse) || error.status !== 422) return null;
    const body: unknown = error.error;
    if (typeof body !== 'object' || body === null || !('preview' in body)) return null;
    const preview = (body as { preview?: unknown }).preview;
    return isItemsImportPreviewResponse(preview) ? preview : null;
  }

  private getRequestErrorMessage(error: unknown, fallback: string): string {
    return getFallbackMessage(error, fallback, {
      400: 'El archivo o los datos enviados no son válidos.',
      403: 'No cuenta con permisos para importar ítems y registrar Entradas.',
      409: 'Existen conflictos con uno o más códigos del archivo.',
      413: 'El archivo supera el tamaño permitido por el servidor.',
      415: 'El servidor no admite el formato del archivo seleccionado.',
      422: 'El archivo contiene errores de validación.'
    });
  }
}
