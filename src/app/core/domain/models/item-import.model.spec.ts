import { isItemsImportPreviewResponse, ItemsImportPreviewResponse } from './item-import.model';

describe('items import contract', () => {
  const preview: ItemsImportPreviewResponse = {
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
    rows: [{
      rowNumber: 2,
      codigo: 'PAP-001',
      nombre: 'Papel bond',
      unidad: 'Paquete',
      cantidadInicial: 25,
      status: 'valid',
      errors: []
    }]
  };

  it('accepts the exact backend preview shape including nombre', () => {
    expect(isItemsImportPreviewResponse(preview)).toBeTrue();
    expect(preview.rows[0].nombre).toBe('Papel bond');
  });

  it('does not accept nombreItem in place of the backend nombre field', () => {
    const incompatible = {
      ...preview,
      rows: [{ ...preview.rows[0], nombre: undefined, nombreItem: 'Papel bond' }]
    };

    expect(isItemsImportPreviewResponse(incompatible)).toBeFalse();
  });

  it('validates the structured row and file errors before recovering error.preview', () => {
    const withErrors: ItemsImportPreviewResponse = {
      ...preview,
      canConfirm: false,
      fileErrors: ['Los encabezados no son válidos'],
      rows: [{
        ...preview.rows[0],
        status: 'invalid',
        errors: [{
          code: 'ITEM_CODE_ALREADY_EXISTS',
          column: 'Código',
          message: 'El código PAP-001 ya existe en la base de datos'
        }]
      }]
    };

    expect(isItemsImportPreviewResponse(withErrors)).toBeTrue();
    expect(isItemsImportPreviewResponse({ ...withErrors, fileErrors: [{ message: 'incompleto' }] })).toBeFalse();
  });
});
