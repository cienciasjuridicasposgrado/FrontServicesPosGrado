import { Routes } from '@angular/router';
import { SealNumbersListComponent } from './components/seal-numbers-list/seal-numbers-list.component';
import { SealNumberFormComponent } from './components/seal-number-form/seal-number-form.component';

export const SEAL_NUMBERS_ROUTES: Routes = [
  {
    path: '',
    component: SealNumbersListComponent,
  },
  {
    path: 'create',
    component: SealNumberFormComponent,
    data: { action: 'create' }
  },
  {
    path: 'edit/:id',
    component: SealNumberFormComponent,
    data: { action: 'edit' }
  }
];
