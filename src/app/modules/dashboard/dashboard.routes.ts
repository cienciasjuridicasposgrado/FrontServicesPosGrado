import { Routes } from '@angular/router';
import { LayoutComponent } from './components/layout/layout.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: DashboardComponent },

      // --- Rutas de Administración Maestra ---
      { 
        path: 'roles', 
        loadChildren: () => import('../roles/roles.route').then(m => m.ROLES_ROUTES)
      },
      {
        path: 'users',
        loadChildren: () => import('../users/users.routes').then(m => m.USERS_ROUTES)
      },
      { 
        path: 'items', 
        loadChildren: () => import('../items/items.routes').then(m => m.ITEMS_ROUTES)
      },
      { 
        path: 'departamentos',
        loadChildren: () => import('../departamentos/departamentos.routes').then(m => m.DEPARTAMENTOS_ROUTES) 
      },

      // --- Rutas de Inventario Transaccional ---
      { 
        path: 'entries',
        loadChildren: () => import('../inventory/inventory.routes').then(m => m.ENTRIES_ROUTES) 
      },
      { 
        path: 'outputs', // Ruta: /dashboard/outputs
        loadChildren: () => import('../inventory/inventory.routes').then(m => m.OUTPUTS_ROUTES) 
      },
    ]
  }
];