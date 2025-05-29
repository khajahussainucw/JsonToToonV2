import { Routes } from '@angular/router';
import { JsonToTableComponent } from './pages/json-to-table/json-to-table.component';
import { JsonFixerComponent } from './pages/json-fixer/json-fixer.component';
import { JsonFormatterComponent } from './pages/json-formatter/json-formatter.component';
import { StringToJsonComponent } from './pages/string-to-json/string-to-json.component';

//export const routes: Routes = [];


export const routes: Routes = [
  { path: '', component: JsonToTableComponent },
  { path: 'json-fixer', component: JsonFixerComponent },
  { path: 'json-formatter', component: JsonFormatterComponent },
  { path: 'string-to-json', component: StringToJsonComponent },
  { path: '**', redirectTo: '' }
];
