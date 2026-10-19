export type ItemsImportRowStatus = 'valid' | 'invalid';

export interface ItemsImportValidationError {
    code: string;
    column: string;
    message: string;
}

export interface ItemsImportSummary {
    totalRowsProcessed: number;
    validItems: number;
    rowsWithErrors: number;
    entriesToCreate: number;
    totalUnitsToAdd: number;
    zeroStockItems: number;
}

export interface ItemsImportPreviewRow {
    rowNumber: number;
    codigo: string;
    nombre: string;
    unidad: string;
    cantidadInicial: number;
    status: ItemsImportRowStatus;
    errors: ItemsImportValidationError[];
}

export interface ItemsImportPreviewResponse {
    fileHash: string;
    canConfirm: boolean;
    summary: ItemsImportSummary;
    fileErrors: string[];
    rows: ItemsImportPreviewRow[];
}

export interface ItemsImportConfirmResponse {
    fileHash: string;
    itemsCreated: number;
    entriesCreated: number;
    totalUnitsAdded: number;
    zeroStockItemsCreated: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function isNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}

function isValidationError(value: unknown): value is ItemsImportValidationError {
    return isRecord(value)
        && typeof value['code'] === 'string'
        && typeof value['column'] === 'string'
        && typeof value['message'] === 'string';
}

function isSummary(value: unknown): value is ItemsImportSummary {
    return isRecord(value)
        && isNumber(value['totalRowsProcessed'])
        && isNumber(value['validItems'])
        && isNumber(value['rowsWithErrors'])
        && isNumber(value['entriesToCreate'])
        && isNumber(value['totalUnitsToAdd'])
        && isNumber(value['zeroStockItems']);
}

function isPreviewRow(value: unknown): value is ItemsImportPreviewRow {
    return isRecord(value)
        && isNumber(value['rowNumber'])
        && typeof value['codigo'] === 'string'
        && typeof value['nombre'] === 'string'
        && typeof value['unidad'] === 'string'
        && isNumber(value['cantidadInicial'])
        && (value['status'] === 'valid' || value['status'] === 'invalid')
        && Array.isArray(value['errors'])
        && value['errors'].every(isValidationError);
}

export function isItemsImportPreviewResponse(value: unknown): value is ItemsImportPreviewResponse {
    return isRecord(value)
        && typeof value['fileHash'] === 'string'
        && typeof value['canConfirm'] === 'boolean'
        && isSummary(value['summary'])
        && Array.isArray(value['fileErrors'])
        && value['fileErrors'].every((error): error is string => typeof error === 'string')
        && Array.isArray(value['rows'])
        && value['rows'].every(isPreviewRow);
}
