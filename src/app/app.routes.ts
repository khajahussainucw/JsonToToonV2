import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/json/json-parser/json-parser.component').then(m => m.JsonParserComponent)
  },
  {
    path: 'json-parser',
    loadComponent: () => import('./pages/json/json-parser/json-parser.component').then(m => m.JsonParserComponent)
  },
  {
    path: 'json-grid',
    loadComponent: () => import('./pages/json/json-grid/json-grid.component').then(m => m.JsonGridComponent)
  },
  {
    path: 'json-fixer',
    loadComponent: () => import('./pages/json/json-fixer/json-fixer.component').then(m => m.JsonFixerComponent)
  },
  {
    path: 'json-formatter',
    loadComponent: () => import('./pages/json/json-formatter/json-formatter.component').then(m => m.JsonFormatterComponent)
  },
  {
    path: 'string-to-json',
    loadComponent: () => import('./pages/json/string-to-json/string-to-json.component').then(m => m.StringToJsonComponent)
  },
  {
    path: 'json-minifier',
    loadComponent: () => import('./pages/json/json-minifier/json-minifier.component').then(m => m.JsonMinifierComponent)
  },
  {
    path: 'json-validator',
    loadComponent: () => import('./pages/json/json-validator/json-validator.component').then(m => m.JsonValidatorComponent)
  },
  {
    path: 'json-to-csv',
    loadComponent: () => import('./pages/json/json-to-csv/json-to-csv.component').then(m => m.JsonToCsvComponent)
  },
  {
    path: 'json-to-typescript',
    loadComponent: () => import('./pages/json/json-to-typescript/json-to-typescript.component').then(m => m.JsonToTypescriptComponent)
  },
  {
    path: 'csv-to-json',
    loadComponent: () => import('./pages/csv/csv-to-json/csv-to-json.component').then(m => m.CsvToJsonComponent)
  },
  {
    path: 'yaml-to-json',
    loadComponent: () => import('./pages/yaml/yaml-to-json/yaml-to-json.component').then(m => m.YamlToJsonComponent)
  },
  {
    path: 'json-to-yaml',
    loadComponent: () => import('./pages/yaml/json-to-yaml/json-to-yaml.component').then(m => m.JsonToYamlComponent)
  },
  {
    path: 'yaml-validator',
    loadComponent: () => import('./pages/yaml/yaml-validator/yaml-validator.component').then(m => m.YamlValidatorComponent)
  },
  {
    path: 'yaml-formatter',
    loadComponent: () => import('./pages/yaml/yaml-formatter/yaml-formatter.component').then(m => m.YamlFormatterComponent)
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
