import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/toon/json-to-toon/json-to-toon.component').then(m => m.JsonToToonComponent)
  },
  {
    path: 'json-to-toon',
    loadComponent: () => import('./pages/toon/json-to-toon/json-to-toon.component').then(m => m.JsonToToonComponent)
  },
  {
    path: 'toon-to-json',
    loadComponent: () => import('./pages/toon/toon-to-json/toon-to-json.component').then(m => m.ToonToJsonComponent)
  },
  {
    path: 'toon-formatter',
    loadComponent: () => import('./pages/toon/toon-formatter/toon-formatter.component').then(m => m.ToonFormatterComponent)
  },
  {
    path: 'toon-validator',
    loadComponent: () => import('./pages/toon/toon-validator/toon-validator.component').then(m => m.ToonValidatorComponent)
  },
  {
    path: 'toon-to-csv',
    loadComponent: () => import('./pages/toon/toon-to-csv/toon-to-csv.component').then(m => m.ToonToCsvComponent)
  },
  {
    path: 'toon-to-yaml',
    loadComponent: () => import('./pages/toon/toon-to-yaml/toon-to-yaml.component').then(m => m.ToonToYamlComponent)
  },
  {
    path: 'toon-to-xml',
    loadComponent: () => import('./pages/toon/toon-to-xml/toon-to-xml.component').then(m => m.ToonToXmlComponent)
  },
  {
    path: 'toon-to-toml',
    loadComponent: () => import('./pages/toon/toon-to-toml/toon-to-toml.component').then(m => m.ToonToTomlComponent)
  },
  {
    path: '**',
    loadComponent: () => import('./pages/toon/json-to-toon/json-to-toon.component').then(m => m.JsonToToonComponent)
  }
];
