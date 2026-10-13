import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // Auth routes (public - no guard)
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
      },
    ],
  },

  // Protected routes
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },

  {
    path: 'expenses',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/expenses/expenses-list/expenses-list.component').then(
            (m) => m.ExpensesListComponent,
          ),
      },
      {
        path: 'add',
        loadComponent: () =>
          import('./features/expenses/add-expense/add-expense.component').then(
            (m) => m.AddExpenseComponent,
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./features/expenses/expense-detail/expense-detail.component').then(
            (m) => m.ExpenseDetailComponent,
          ),
      },
    ],
  },

  {
    path: 'settlements',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/settlements/balances/balances.component').then((m) => m.BalancesComponent),
  },

  {
    path: 'groups',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/groups/groups.component').then((m) => m.GroupsComponent),
  },

  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/profile/profile.component').then((m) => m.ProfileComponent),
  },

  {
    path: 'notifications',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/notifications/notifications.component').then((m) => m.NotificationsComponent),
  },

  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/profile/settings/settings.component').then((m) => m.SettingsComponent),
  },

  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
