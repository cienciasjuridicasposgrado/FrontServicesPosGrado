import { Routes } from '@angular/router';
import { DepartamentosListComponent } from './components/departamentos-list/departamentos-list.component';
import { DepartamentoFormComponent } from './components/departamento-form/departamento-form.component';

export const DEPARTAMENTOS_ROUTES: Routes = [
    { path: '', component: DepartamentosListComponent },    
    { path: 'new', component: DepartamentoFormComponent },
    { path: 'edit/:id', component: DepartamentoFormComponent },
];