import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/json-to-table/json-to-table.component').then(m => m.JsonToTableComponent)
  },
  {
    path: 'json-to-table',
    loadComponent: () => import('./pages/json-to-table/json-to-table.component').then(m => m.JsonToTableComponent)
  },
  {
    path: 'json-fixer',
    loadComponent: () => import('./pages/json-fixer/json-fixer.component').then(m => m.JsonFixerComponent)
  },
  {
    path: 'json-formatter',
    loadComponent: () => import('./pages/json-formatter/json-formatter.component').then(m => m.JsonFormatterComponent)
  },
  {
    path: 'string-to-json',
    loadComponent: () => import('./pages/string-to-json/string-to-json.component').then(m => m.StringToJsonComponent)
  },
  {
    path: 'privacy-policy',
    loadComponent: () => import('./pages/privacy-policy/privacy-policy.component').then(m => m.PrivacyPolicyComponent)
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about.component').then(m => m.AboutComponent)
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact.component').then(m => m.ContactComponent)
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
