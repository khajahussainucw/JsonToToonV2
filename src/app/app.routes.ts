import { Routes } from '@angular/router';
import { JsonToTableComponent } from './pages/json-to-table/json-to-table.component';
import { JsonFixerComponent } from './pages/json-fixer/json-fixer.component';

//export const routes: Routes = [];


export const routes: Routes = [
  { path: '', component: JsonToTableComponent },
  { path: 'json-fixer', component: JsonFixerComponent },
  { path: '**', redirectTo: '' }
];
