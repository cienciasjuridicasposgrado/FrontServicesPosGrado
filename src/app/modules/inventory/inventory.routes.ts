import { Routes } from '@angular/router';
import { EntriesListComponent } from './components/entries-list/entries-list.component';
import { EntryFormComponent } from './components/entry-form/entry-form.component';
import { OutputsListComponent } from './components/outputs-list/outputs-list.component';
import { OutputFormComponent } from './components/output-form/output-form.component';
import { OutputEditComponent } from './components/output-edit/output-edit.component';
import { OutputDetailComponent } from './components/output-detail/output-detail.component';
import { EntryDetailComponent } from './components/entry-detail/entry-detail.component';
import { permissionGuard } from '../../core/application/guards/permission.guard';
import { PERMISSIONS } from '../../core/domain/models/permission.model';

export const ENTRIES_ROUTES: Routes = [
    { path: '', component: EntriesListComponent },
    {
        path: 'new',
        component: EntryFormComponent,
        canActivate: [permissionGuard],
        data: { permissions: { allOf: [PERMISSIONS.makeEntry] } }
    },
    { path: ':id', component: EntryDetailComponent }, 
];

export const OUTPUTS_ROUTES: Routes = [
    { path: '', component: OutputsListComponent },
    {
        path: 'new',
        component: OutputFormComponent,
        canActivate: [permissionGuard],
        data: { permissions: { allOf: [PERMISSIONS.makeOutput] } }
    },
    {
        path: 'edit/:id',
        component: OutputEditComponent,
        canActivate: [permissionGuard],
        data: { permissions: { allOf: [PERMISSIONS.makeOutput] } }
    },
    { path: ':id', component: OutputDetailComponent }
];
