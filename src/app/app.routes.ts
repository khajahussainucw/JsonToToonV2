import { Routes } from '@angular/router';
import { JsonToTableComponent } from './pages/json-to-table/json-to-table.component';
import { JsonFixerComponent } from './pages/json-fixer/json-fixer.component';
import { JsonFormatterComponent } from './pages/json-formatter/json-formatter.component';

//export const routes: Routes = [];


export const routes: Routes = [
  { path: '', component: JsonToTableComponent },
  { path: 'json-fixer', component: JsonFixerComponent },
  { path: 'json-formatter', component: JsonFormatterComponent },
  { path: '**', redirectTo: '' }
];
