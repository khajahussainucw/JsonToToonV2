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
    path: 'json-to-csharp',
    loadComponent: () => import('./pages/json/json-to-csharp/json-to-csharp.component').then(m => m.JsonToCsharpComponent)
  },
  {
    path: 'json-escape',
    loadComponent: () => import('./pages/json/json-escape/json-escape.component').then(m => m.JsonEscapeComponent)
  },
  {
    path: 'json-diff',
    loadComponent: () => import('./pages/json/json-diff/json-diff.component').then(m => m.JsonDiffComponent)
  },
  {
    path: 'json-merge',
    loadComponent: () => import('./pages/json/json-merge/json-merge.component').then(m => m.JsonMergeComponent)
  },
  {
    path: 'json-path',
    loadComponent: () => import('./pages/json/json-path/json-path.component').then(m => m.JsonPathComponent)
  },
  {
    path: 'json-schema-generator',
    loadComponent: () => import('./pages/json/json-schema-generator/json-schema-generator.component').then(m => m.JsonSchemaGeneratorComponent)
  },
  {
    path: 'json-sort',
    loadComponent: () => import('./pages/json/json-sort/json-sort.component').then(m => m.JsonSortComponent)
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
    path: 'yaml-to-xml',
    loadComponent: () => import('./pages/yaml/yaml-to-xml/yaml-to-xml.component').then(m => m.YamlToXmlComponent)
  },
  {
    path: 'yaml-to-csv',
    loadComponent: () => import('./pages/yaml/yaml-to-csv/yaml-to-csv.component').then(m => m.YamlToCsvComponent)
  },
  {
    path: 'yaml-to-toml',
    loadComponent: () => import('./pages/yaml/yaml-to-toml/yaml-to-toml.component').then(m => m.YamlToTomlComponent)
  },
  {
    path: 'yaml-minifier',
    loadComponent: () => import('./pages/yaml/yaml-minifier/yaml-minifier.component').then(m => m.YamlMinifierComponent)
  },
  {
    path: 'yaml-to-typescript',
    loadComponent: () => import('./pages/yaml/yaml-to-typescript/yaml-to-typescript.component').then(m => m.YamlToTypescriptComponent)
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
    path: 'xml-to-yaml',
    loadComponent: () => import('./pages/xml/xml-to-yaml/xml-to-yaml.component').then(m => m.XmlToYamlComponent)
  },
  {
    path: 'xml-to-csv',
    loadComponent: () => import('./pages/xml/xml-to-csv/xml-to-csv.component').then(m => m.XmlToCsvComponent)
  },
  {
    path: 'xml-parser',
    loadComponent: () => import('./pages/xml/xml-parser/xml-parser.component').then(m => m.XmlParserComponent)
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
    path: 'markdown-editor',
    loadComponent: () => import('./pages/markdown/markdown-editor/markdown-editor.component').then(m => m.MarkdownEditorComponent)
  },
  {
    path: 'markdown-to-html',
    loadComponent: () => import('./pages/markdown/markdown-to-html/markdown-to-html.component').then(m => m.MarkdownToHtmlComponent)
  },
  {
    path: 'html-to-markdown',
    loadComponent: () => import('./pages/markdown/html-to-markdown/html-to-markdown.component').then(m => m.HtmlToMarkdownComponent)
  },
  {
    path: 'markdown-formatter',
    loadComponent: () => import('./pages/markdown/markdown-formatter/markdown-formatter.component').then(m => m.MarkdownFormatterComponent)
  },
  {
    path: 'markdown-table-generator',
    loadComponent: () => import('./pages/markdown/markdown-table-generator/markdown-table-generator.component').then(m => m.MarkdownTableGeneratorComponent)
  },
  {
    path: 'toml-formatter',
    loadComponent: () => import('./pages/toml/toml-formatter/toml-formatter.component').then(m => m.TomlFormatterComponent)
  },
  {
    path: 'toml-validator',
    loadComponent: () => import('./pages/toml/toml-validator/toml-validator.component').then(m => m.TomlValidatorComponent)
  },
  {
    path: 'toml-to-json',
    loadComponent: () => import('./pages/toml/toml-to-json/toml-to-json.component').then(m => m.TomlToJsonComponent)
  },
  {
    path: 'json-to-toml',
    loadComponent: () => import('./pages/toml/json-to-toml/json-to-toml.component').then(m => m.JsonToTomlComponent)
  },
  {
    path: 'toml-to-yaml',
    loadComponent: () => import('./pages/toml/toml-to-yaml/toml-to-yaml.component').then(m => m.TomlToYamlComponent)
  },
  {
    path: 'toml-to-xml',
    loadComponent: () => import('./pages/toml/toml-to-xml/toml-to-xml.component').then(m => m.TomlToXmlComponent)
  },
  {
    path: 'toml-to-csv',
    loadComponent: () => import('./pages/toml/toml-to-csv/toml-to-csv.component').then(m => m.TomlToCsvComponent)
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
