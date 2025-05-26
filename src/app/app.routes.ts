import { Routes } from '@angular/router';
import { AboutComponent } from './pages/about/about.component';
import { JsonToTableComponent } from './pages/json-to-table/json-to-table.component';
import { JsonToTablePlusComponent } from './pages/json-to-table-plus/json-to-table-plus.component';

//export const routes: Routes = [];


export const routes: Routes = [
  { path: '', component: JsonToTableComponent },
  { path: 'json-to-table-plus', component: JsonToTablePlusComponent },
  { path: 'about', component: AboutComponent },
  { path: 'about.html', component: AboutComponent }, // ✅ Support for /about.
  { path: '**', redirectTo: '' }
];
