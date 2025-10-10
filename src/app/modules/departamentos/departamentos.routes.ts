// src/app/modules/departamentos/departamentos.routes.ts

import { Routes } from '@angular/router';
import { DepartamentosListComponent } from './components/departamentos-list/departamentos-list.component';

export const DEPARTAMENTOS_ROUTES: Routes = [
    // Ruta principal: Listado de departamentos
    { path: '', component: DepartamentosListComponent },
    
    // Rutas para crear/editar (pendientes de implementación de formularios)
    // { path: 'new', component: DepartamentoFormComponent },
    // { path: 'edit/:id', component: DepartamentoFormComponent },
];