import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { ConfirmItemsImportUseCase } from '../../../../core/application/usecase/items/confirm-items-import.usecase';
import { PreviewItemsImportUseCase } from '../../../../core/application/usecase/items/preview-items-import.usecase';
import { PermissionService } from '../../../../core/application/services/permission.service';
import { ItemsImportPreviewResponse } from '../../../../core/domain/models/item-import.model';
import { ConfirmationDialogService } from '../../../../shared/dialogs/confirmation-dialog/confirmation-dialog.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { ItemImportComponent } from './item-import.component';

describe('ItemImportComponent', () => {
  let fixture: ComponentFixture<ItemImportComponent>;
  let component: ItemImportComponent;
  let previewUseCase: jasmine.SpyObj<PreviewItemsImportUseCase>;
  let confirmUseCase: jasmine.SpyObj<ConfirmItemsImportUseCase>;
  let permissionService: jasmine.SpyObj<PermissionService>;
  let confirmationDialog: jasmine.SpyObj<ConfirmationDialogService>;
  let notification: jasmine.SpyObj<NotificationService>;

  const validPreview: ItemsImportPreviewResponse = {
    fileHash: '0123456789abcdef',
    canConfirm: true,
    summary: {
      totalRowsProcessed: 2,
      validItems: 2,
      rowsWithErrors: 0,
      entriesToCreate: 1,
      totalUnitsToAdd: 25,
      zeroStockItems: 1
    },
    fileErrors: [],
    rows: [
      {
        rowNumber: 2,
        codigo: 'PAP-001',
        nombre: 'Papel bond',
        unidad: 'Paquete',
        cantidadInicial: 25,
        status: 'valid',
        errors: []
      },
      {
        rowNumber: 4,
        codigo: 'TON-001',
        nombre: 'Tóner',
        unidad: 'Unidad',
        cantidadInicial: 0,
        status: 'valid',
        errors: []
      }
    ]
  };

  const invalidPreview: ItemsImportPreviewResponse = {
    ...validPreview,
    canConfirm: false,
    summary: { ...validPreview.summary, validItems: 1, rowsWithErrors: 1 },
    fileErrors: ['La hoja contiene encabezados no permitidos'],
    rows: [
      validPreview.rows[0],
      {
        ...validPreview.rows[1],
        status: 'invalid',
        errors: [{
          code: 'ITEM_CODE_ALREADY_EXISTS',
          column: 'Código',
          message: 'El código TON-001 ya existe en la base de datos'
        }]
      }
    ]
  };

  beforeEach(async () => {
    previewUseCase = jasmine.createSpyObj<PreviewItemsImportUseCase>('PreviewItemsImportUseCase', ['execute']);
    confirmUseCase = jasmine.createSpyObj<ConfirmItemsImportUseCase>('ConfirmItemsImportUseCase', ['execute']);
    permissionService = jasmine.createSpyObj<PermissionService>('PermissionService', ['hasAll']);
    confirmationDialog = jasmine.createSpyObj<ConfirmationDialogService>('ConfirmationDialogService', ['confirm']);
    notification = jasmine.createSpyObj<NotificationService>('NotificationService', [
      'showSuccess', 'showError', 'showWarning'
    ]);
    permissionService.hasAll.and.returnValue(true);
    confirmationDialog.confirm.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [ItemImportComponent, NoopAnimationsModule],
      providers: [
        { provide: PreviewItemsImportUseCase, useValue: previewUseCase },
        { provide: ConfirmItemsImportUseCase, useValue: confirmUseCase },
        { provide: PermissionService, useValue: permissionService },
        { provide: ConfirmationDialogService, useValue: confirmationDialog },
        { provide: NotificationService, useValue: notification },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ItemImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function xlsxFile(content = 'content'): File {
    return new File([content], 'items.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
  }

  it('accepts one .xlsx file and exposes its name and size', () => {
    const file = xlsxFile('12345');
    component.selectFile(file);
    fixture.detectChanges();

    expect(component.selectedFile).toBe(file);
    expect(component.fileSelectionError).toBe('');
    expect(fixture.nativeElement.textContent).toContain('items.xlsx');
    expect(fixture.nativeElement.textContent).toContain('5 B');
  });

  it('uses the same template link and offers access to the existing catalogue without loading it', () => {
    const link = fixture.nativeElement.querySelector('.template-help a') as HTMLAnchorElement;
    const catalogButton = fixture.nativeElement.querySelector('.catalog-content button') as HTMLButtonElement;
    const router = TestBed.inject(Router);

    expect(link.getAttribute('href')).toBe('templates/plantilla-importacion-items.xlsx');
    expect(link.getAttribute('download')).toBe('plantilla-importacion-items.xlsx');
    expect(fixture.nativeElement.textContent).toContain('Catálogo actual');
    expect(fixture.nativeElement.textContent).not.toContain('Últimos creados');
    catalogButton.click();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard/items']);
  });

  it('rejects unsupported file extensions', () => {
    for (const name of ['items.xls', 'items.xlsm', 'items.csv', 'items.pdf']) {
      component.selectFile(new File(['content'], name));
      expect(component.selectedFile).toBeNull();
      expect(component.fileSelectionError).toContain('.xlsx');
    }
  });

  it('rejects files larger than 5 MiB', () => {
    component.selectFile(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.xlsx'));

    expect(component.selectedFile).toBeNull();
    expect(component.fileSelectionError).toContain('5 MiB');
  });

  it('validates the selected file and enables confirmation only with every prerequisite', async () => {
    const file = xlsxFile();
    component.selectFile(file);
    previewUseCase.execute.and.resolveTo(validPreview);

    await component.validateFile();

    expect(previewUseCase.execute).toHaveBeenCalledOnceWith(file);
    expect(component.preview).toBe(validPreview);
    expect(component.canConfirmImport).toBeTrue();

    permissionService.hasAll.and.returnValue(false);
    expect(component.canConfirmImport).toBeFalse();
  });

  it('shows global and row errors and disables confirmation', async () => {
    component.selectFile(xlsxFile());
    previewUseCase.execute.and.resolveTo(invalidPreview);

    await component.validateFile();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Errores generales del archivo');
    expect(text).toContain('La hoja contiene encabezados no permitidos');
    expect(text).toContain('El código TON-001 ya existe en la base de datos');
    expect(text).toContain('Se encontraron ítems que ya están registrados en Lexi.');
    expect(text).toContain('1 código existente identificado');
    expect(text).toContain('Requiere correcciones');
    expect(component.canConfirmImport).toBeFalse();
  });

  it('counts distinct existing codes without treating unrelated errors as duplicates', () => {
    component.selectFile(xlsxFile());
    component['applyPreview']({
      ...invalidPreview,
      fileErrors: [],
      rows: [
        invalidPreview.rows[1],
        { ...invalidPreview.rows[1], rowNumber: 5, codigo: 'ton-001' },
        { ...invalidPreview.rows[1], rowNumber: 6, codigo: 'NEW-001', errors: [
          { code: 'INVALID_QUANTITY', column: 'Cantidad inicial', message: 'Cantidad inválida' }
        ] }
      ]
    });
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(component.duplicateCodeCount).toBe(1);
    expect(text).toContain('1 código existente identificado');
    expect(text).toContain('Cantidad inválida');
    expect(text).toContain('Ver catálogo de Ítems');
    expect(text).toContain('Cambiar archivo');
  });

  it('filters the table to invalid rows', () => {
    component.selectFile(xlsxFile());
    component['applyPreview'](invalidPreview);

    component.toggleOnlyErrors(true);

    expect(component.dataSource.filteredData.length).toBe(1);
    expect(component.dataSource.filteredData[0].rowNumber).toBe(4);
  });

  it('describes zero quantities without an Entry and positive quantities with an Entry', () => {
    expect(component.operationLabel(validPreview.rows[0])).toBe('Creará entrada +25');
    expect(component.operationLabel(validPreview.rows[1])).toBe('Sin entrada · stock inicial 0');
  });

  it('sends the same File and preview hash after confirmation', async () => {
    const file = xlsxFile();
    component.selectFile(file);
    component['applyPreview'](validPreview);
    confirmUseCase.execute.and.resolveTo({
      fileHash: validPreview.fileHash,
      itemsCreated: 2,
      entriesCreated: 1,
      totalUnitsAdded: 25,
      zeroStockItemsCreated: 1
    });

    await component.confirmImport();

    expect(confirmationDialog.confirm).toHaveBeenCalled();
    expect(confirmUseCase.execute).toHaveBeenCalledOnceWith(file, validPreview.fileHash);
  });

  it('prevents a second confirmation while the first request is pending', async () => {
    const file = xlsxFile();
    component.selectFile(file);
    component['applyPreview'](validPreview);
    let resolveRequest!: (value: {
      fileHash: string; itemsCreated: number; entriesCreated: number;
      totalUnitsAdded: number; zeroStockItemsCreated: number;
    }) => void;
    confirmUseCase.execute.and.returnValue(new Promise((resolve) => { resolveRequest = resolve; }));

    const first = component.confirmImport();
    await Promise.resolve();
    await Promise.resolve();
    const second = component.confirmImport();

    expect(confirmUseCase.execute).toHaveBeenCalledTimes(1);
    resolveRequest({
      fileHash: validPreview.fileHash, itemsCreated: 2, entriesCreated: 1,
      totalUnitsAdded: 25, zeroStockItemsCreated: 1
    });
    await Promise.all([first, second]);
  });

  it('requires a new validation after HTTP 409', async () => {
    component.selectFile(xlsxFile());
    component['applyPreview'](validPreview);
    confirmUseCase.execute.and.rejectWith(new HttpErrorResponse({
      status: 409,
      statusText: 'Conflict',
      error: { message: 'Los códigos ya existen' }
    }));

    await component.confirmImport();

    expect(component.confirmationRequiresRevalidation).toBeTrue();
    expect(component.canConfirmImport).toBeFalse();
    expect(component.requestError).toContain('Valide nuevamente');
  });

  it('recovers a checked error.preview from HTTP 422', async () => {
    component.selectFile(xlsxFile());
    component['applyPreview'](validPreview);
    confirmUseCase.execute.and.rejectWith(new HttpErrorResponse({
      status: 422,
      statusText: 'Unprocessable Entity',
      error: { preview: invalidPreview }
    }));

    await component.confirmImport();

    expect(component.preview).toEqual(invalidPreview);
    expect(component.dataSource.data.length).toBe(2);
    expect(component.requestError).toContain('validación cambió');
  });

  it('does not trust an invalid error.preview payload', async () => {
    component.selectFile(xlsxFile());
    previewUseCase.execute.and.rejectWith(new HttpErrorResponse({
      status: 422,
      statusText: 'Unprocessable Entity',
      error: { preview: { canConfirm: true } }
    }));

    await component.validateFile();

    expect(component.preview).toBeNull();
    expect(component.requestError).toContain('validación');
  });

  it('reports an uncertain outcome after a network failure during confirmation', async () => {
    component.selectFile(xlsxFile());
    component['applyPreview'](validPreview);
    confirmUseCase.execute.and.rejectWith(new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' }));

    await component.confirmImport();

    expect(component.uncertainConfirmation).toBeTrue();
    expect(component.requestError).toContain('No se puede determinar si la importación terminó');
    expect(component.requestError).not.toContain('No se importó ningún');
    expect(component.canConfirmImport).toBeFalse();
  });

  it('renders the backend success totals instead of relying only on a snackbar', async () => {
    component.selectFile(xlsxFile());
    component['applyPreview'](validPreview);
    confirmUseCase.execute.and.resolveTo({
      fileHash: validPreview.fileHash,
      itemsCreated: 2,
      entriesCreated: 1,
      totalUnitsAdded: 25,
      zeroStockItemsCreated: 1
    });

    await component.confirmImport();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Importación completada');
    expect(text).toContain('2');
    expect(text).toContain('ítems creados');
    expect(text).toContain('25');
    expect(text).toContain('unidades incorporadas');
    expect(text).toContain('El archivo ya fue procesado');
    expect(text).toContain('Iniciar otra importación');
    expect(fixture.nativeElement.querySelector('.file-picker')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Confirmar importación');
    expect(component.canConfirmImport).toBeFalse();

    await component.confirmImport();
    expect(confirmUseCase.execute).toHaveBeenCalledTimes(1);

    component.startNewImport();
    fixture.detectChanges();
    expect(component.selectedFile).toBeNull();
    expect(component.preview).toBeNull();
    expect(component.result).toBeNull();
    expect(fixture.nativeElement.querySelector('.file-picker')).not.toBeNull();
  });
});
