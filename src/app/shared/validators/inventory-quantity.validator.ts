import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const MIN_INVENTORY_QUANTITY = 1;
export const MAX_INVENTORY_QUANTITY = 10_000;

export function isValidInventoryQuantity(value: unknown): value is number {
    return Number.isInteger(value)
        && (value as number) >= MIN_INVENTORY_QUANTITY
        && (value as number) <= MAX_INVENTORY_QUANTITY;
}

export const inventoryQuantityValidator: ValidatorFn = (
    control: AbstractControl
): ValidationErrors | null => {
    if (control.value === null || control.value === undefined || control.value === '') {
        return null;
    }

    return isValidInventoryQuantity(control.value)
        ? null
        : { inventoryQuantity: true };
};
