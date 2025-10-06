import { Routes } from '@angular/router';
import { LayoutComponent } from './components/layout/layout.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: DashboardComponent },
      { path: 'items', loadChildren: () => import('../items/items.routes').then(m => m.ITEMS_ROUTES)},
      // Aquí agregaremos más rutas para items, entries, outputs, etc.
    ]
  }
];