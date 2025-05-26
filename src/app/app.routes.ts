import { Routes } from '@angular/router';
import { AboutComponent } from './pages/about/about.component';
import { JsonToTableComponent } from './pages/json-to-table/json-to-table.component';

//export const routes: Routes = [];


export const routes: Routes = [
  { path: '', component: JsonToTableComponent },
  { path: 'about', component: AboutComponent },
  { path: 'about.html', component: AboutComponent }, // ✅ Support for /about.html
  { path: '**', redirectTo: '' }
];
