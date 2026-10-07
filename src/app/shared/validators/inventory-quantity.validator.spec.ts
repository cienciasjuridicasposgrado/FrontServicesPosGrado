import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/application/services/auth.service';
import { GetAllDepartamentosUseCase } from '../../core/application/usecase/departamentos/get-all-departamentos.usecase';
import { CreateEntryUseCase } from '../../core/application/usecase/inventory-entries/create-entry.usecase';
import { CreateOutputUseCase } from '../../core/application/usecase/inventory-outputs/create-output.usecase';
import { GetAllItemsUseCase } from '../../core/application/usecase/items/get-all-items.usecase';
import { EntryFormComponent } from '../../modules/inventory/components/entry-form/entry-form.component';
import { OutputFormComponent } from '../../modules/inventory/components/output-form/output-form.component';
import { NotificationService } from '../services/notification.service';

describe('inventory quantity form validation', () => {
  const fb = new FormBuilder();
  const router = {} as Router;
  const auth = {} as AuthService;
  const notification = {} as NotificationService;
  const createEntry = {} as CreateEntryUseCase;
  const createOutput = {} as CreateOutputUseCase;
  const getItems = {} as GetAllItemsUseCase;
  const getDepartamentos = {} as GetAllDepartamentosUseCase;

  const cases: ReadonlyArray<{ value: unknown; valid: boolean }> = [
    { value: undefined, valid: false },
    { value: null, valid: false },
    { value: '', valid: false },
    { value: -1, valid: false },
    { value: 0, valid: false },
    { value: 1, valid: true },
    { value: '5', valid: false },
    { value: 1.5, valid: false },
    { value: 10_000, valid: true },
    { value: 10_001, valid: false }
  ];

  it('applies integer 1..10000 validation to the Entry form', () => {
    const component = new EntryFormComponent(
      fb, router, auth, notification, createEntry, getItems
    );
    const control = component.entryForm.controls['cantidad'];

    for (const testCase of cases) {
      control.setValue(testCase.value);
      expect(control.valid).withContext(`Entry cantidad ${String(testCase.value)}`).toBe(testCase.valid);
    }
  });

  it('applies integer 1..10000 validation to the Output form', () => {
    const component = new OutputFormComponent(
      fb, router, auth, notification, createOutput, getItems, getDepartamentos
    );
    const control = component.outputForm.controls['cantidad'];

    for (const testCase of cases) {
      control.setValue(testCase.value);
      expect(control.valid).withContext(`Output cantidad ${String(testCase.value)}`).toBe(testCase.valid);
    }
  });
});
