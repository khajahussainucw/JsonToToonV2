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
    path: 'csv-viewer',
    loadComponent: () => import('./pages/csv/csv-viewer/csv-viewer.component').then(m => m.CsvViewerComponent)
  },
  {
    path: 'csv-formatter',
    loadComponent: () => import('./pages/csv/csv-formatter/csv-formatter.component').then(m => m.CsvFormatterComponent)
  },
  {
    path: 'csv-validator',
    loadComponent: () => import('./pages/csv/csv-validator/csv-validator.component').then(m => m.CsvValidatorComponent)
  },
  {
    path: 'csv-to-yaml',
    loadComponent: () => import('./pages/csv/csv-to-yaml/csv-to-yaml.component').then(m => m.CsvToYamlComponent)
  },
  {
    path: 'csv-to-xml',
    loadComponent: () => import('./pages/csv/csv-to-xml/csv-to-xml.component').then(m => m.CsvToXmlComponent)
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
    path: 'xml-formatter',
    loadComponent: () => import('./pages/xml/xml-formatter/xml-formatter.component').then(m => m.XmlFormatterComponent)
  },
  {
    path: 'xml-validator',
    loadComponent: () => import('./pages/xml/xml-validator/xml-validator.component').then(m => m.XmlValidatorComponent)
  },
  {
    path: 'xml-to-json',
    loadComponent: () => import('./pages/xml/xml-to-json/xml-to-json.component').then(m => m.XmlToJsonComponent)
  },
  {
    path: 'json-to-xml',
    loadComponent: () => import('./pages/xml/json-to-xml/json-to-xml.component').then(m => m.JsonToXmlComponent)
  },
  {
    path: 'xml-minifier',
    loadComponent: () => import('./pages/xml/xml-minifier/xml-minifier.component').then(m => m.XmlMinifierComponent)
  },
  {
    path: 'js-formatter',
    loadComponent: () => import('./pages/javascript/js-formatter/js-formatter.component').then(m => m.JsFormatterComponent)
  },
  {
    path: 'js-minifier',
    loadComponent: () => import('./pages/javascript/js-minifier/js-minifier.component').then(m => m.JsMinifierComponent)
  },
  {
    path: 'js-validator',
    loadComponent: () => import('./pages/javascript/js-validator/js-validator.component').then(m => m.JsValidatorComponent)
  },
  {
    path: 'js-obfuscator',
    loadComponent: () => import('./pages/javascript/js-obfuscator/js-obfuscator.component').then(m => m.JsObfuscatorComponent)
  },
  {
    path: 'js-deobfuscator',
    loadComponent: () => import('./pages/javascript/js-deobfuscator/js-deobfuscator.component').then(m => m.JsDeobfuscatorComponent)
  },
  {
    path: 'js-to-typescript',
    loadComponent: () => import('./pages/javascript/js-to-typescript/js-to-typescript.component').then(m => m.JsToTypescriptComponent)
  },
  {
    path: 'jsx-formatter',
    loadComponent: () => import('./pages/javascript/jsx-formatter/jsx-formatter.component').then(m => m.JsxFormatterComponent)
  },
  {
    path: 'js-console',
    loadComponent: () => import('./pages/javascript/js-console/js-console.component').then(m => m.JsConsoleComponent)
  },
  {
    path: 'css-formatter',
    loadComponent: () => import('./pages/css/css-formatter/css-formatter.component').then(m => m.CssFormatterComponent)
  },
  {
    path: 'css-minifier',
    loadComponent: () => import('./pages/css/css-minifier/css-minifier.component').then(m => m.CssMinifierComponent)
  },
  {
    path: 'css-validator',
    loadComponent: () => import('./pages/css/css-validator/css-validator.component').then(m => m.CssValidatorComponent)
  },
  {
    path: 'scss-to-css',
    loadComponent: () => import('./pages/css/scss-to-css/scss-to-css.component').then(m => m.ScssToCssComponent)
  },
  {
    path: 'css-to-scss',
    loadComponent: () => import('./pages/css/css-to-scss/css-to-scss.component').then(m => m.CssToScssComponent)
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
