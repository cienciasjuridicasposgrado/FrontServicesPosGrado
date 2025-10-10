// src/app/modules/inventory/inventory.routes.ts

import { Routes } from '@angular/router';
import { EntriesListComponent } from './components/entries-list/entries-list.component';
import { EntryFormComponent } from './components/entry-form/entry-form.component';
import { OutputsListComponent } from './components/outputs-list/outputs-list.component';
import { OutputFormComponent } from './components/output-form/output-form.component';

export const ENTRIES_ROUTES: Routes = [
    // Ruta principal: Listado de entradas
    { path: '', component: EntriesListComponent },
    
    // Ruta para crear una nueva entrada
    { path: 'new', component: EntryFormComponent },
    
    // No se recomienda la edición por ID en transacciones, pero se puede listar:
    { path: ':id', component: EntryFormComponent }, 
];

export const OUTPUTS_ROUTES: Routes = [
    { path: '', component: OutputsListComponent },
    { path: 'new', component: OutputFormComponent },
    { path: ':id', component: OutputFormComponent },
];

// Opcional: Si quieres agrupar todas las rutas de inventario aquí
// export const INVENTORY_ROUTES: Routes = [
//     { path: 'entries', children: ENTRIES_ROUTES },
//     { path: 'outputs', children: OUTPUTS_ROUTES }, // asumir que OUTPUTS_ROUTES existe
// ];