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
    path: 'json-to-java',
    loadComponent: () => import('./pages/json/json-to-java/json-to-java.component').then(m => m.JsonToJavaComponent)
  },
  {
    path: 'json-to-php',
    loadComponent: () => import('./pages/json/json-to-php/json-to-php.component').then(m => m.JsonToPhpComponent)
  },
  {
    path: 'json-to-python',
    loadComponent: () => import('./pages/json/json-to-python/json-to-python.component').then(m => m.JsonToPythonComponent)
  },
  {
    path: 'json-to-go',
    loadComponent: () => import('./pages/json/json-to-go/json-to-go.component').then(m => m.JsonToGoComponent)
  },
  {
    path: 'json-to-swift',
    loadComponent: () => import('./pages/json/json-to-swift/json-to-swift.component').then(m => m.JsonToSwiftComponent)
  },
  {
    path: 'json-to-kotlin',
    loadComponent: () => import('./pages/json/json-to-kotlin/json-to-kotlin.component').then(m => m.JsonToKotlinComponent)
  },
  {
    path: 'json-to-dart',
    loadComponent: () => import('./pages/json/json-to-dart/json-to-dart.component').then(m => m.JsonToDartComponent)
  },
  {
    path: 'json-to-ruby',
    loadComponent: () => import('./pages/json/json-to-ruby/json-to-ruby.component').then(m => m.JsonToRubyComponent)
  },
  {
    path: 'json-to-rust',
    loadComponent: () => import('./pages/json/json-to-rust/json-to-rust.component').then(m => m.JsonToRustComponent)
  },
  {
    path: 'json-to-scala',
    loadComponent: () => import('./pages/json/json-to-scala/json-to-scala.component').then(m => m.JsonToScalaComponent)
  },
  {
    path: 'json-to-cpp',
    loadComponent: () => import('./pages/json/json-to-cpp/json-to-cpp.component').then(m => m.JsonToCppComponent)
  },
  {
    path: 'json-to-c',
    loadComponent: () => import('./pages/json/json-to-c/json-to-c.component').then(m => m.JsonToCComponent)
  },
  {
    path: 'json-to-perl',
    loadComponent: () => import('./pages/json/json-to-perl/json-to-perl.component').then(m => m.JsonToPerlComponent)
  },
  {
    path: 'json-to-lua',
    loadComponent: () => import('./pages/json/json-to-lua/json-to-lua.component').then(m => m.JsonToLuaComponent)
  },
  {
    path: 'json-to-fsharp',
    loadComponent: () => import('./pages/json/json-to-fsharp/json-to-fsharp.component').then(m => m.JsonToFsharpComponent)
  },
  {
    path: 'json-to-objectivec',
    loadComponent: () => import('./pages/json/json-to-objectivec/json-to-objectivec.component').then(m => m.JsonToObjectivecComponent)
  },
  {
    path: 'json-to-powershell',
    loadComponent: () => import('./pages/json/json-to-powershell/json-to-powershell.component').then(m => m.JsonToPowershellComponent)
  },
  {
    path: 'json-to-shell',
    loadComponent: () => import('./pages/json/json-to-shell/json-to-shell.component').then(m => m.JsonToShellComponent)
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
    path: 'xml-to-csharp',
    loadComponent: () => import('./pages/xml/xml-to-csharp/xml-to-csharp.component').then(m => m.XmlToCsharpComponent)
  },
  {
    path: 'xml-to-typescript',
    loadComponent: () => import('./pages/xml/xml-to-typescript/xml-to-typescript.component').then(m => m.XmlToTypescriptComponent)
  },
  {
    path: 'xml-to-java',
    loadComponent: () => import('./pages/xml/xml-to-java/xml-to-java.component').then(m => m.XmlToJavaComponent)
  },
  {
    path: 'xml-to-php',
    loadComponent: () => import('./pages/xml/xml-to-php/xml-to-php.component').then(m => m.XmlToPhpComponent)
  },
  {
    path: 'xml-to-python',
    loadComponent: () => import('./pages/xml/xml-to-python/xml-to-python.component').then(m => m.XmlToPythonComponent)
  },
  {
    path: 'xml-to-go',
    loadComponent: () => import('./pages/xml/xml-to-go/xml-to-go.component').then(m => m.XmlToGoComponent)
  },
  {
    path: 'xml-to-swift',
    loadComponent: () => import('./pages/xml/xml-to-swift/xml-to-swift.component').then(m => m.XmlToSwiftComponent)
  },
  {
    path: 'xml-to-kotlin',
    loadComponent: () => import('./pages/xml/xml-to-kotlin/xml-to-kotlin.component').then(m => m.XmlToKotlinComponent)
  },
  {
    path: 'xml-to-dart',
    loadComponent: () => import('./pages/xml/xml-to-dart/xml-to-dart.component').then(m => m.XmlToDartComponent)
  },
  {
    path: 'xml-to-ruby',
    loadComponent: () => import('./pages/xml/xml-to-ruby/xml-to-ruby.component').then(m => m.XmlToRubyComponent)
  },
  {
    path: 'xml-to-rust',
    loadComponent: () => import('./pages/xml/xml-to-rust/xml-to-rust.component').then(m => m.XmlToRustComponent)
  },
  {
    path: 'xml-to-scala',
    loadComponent: () => import('./pages/xml/xml-to-scala/xml-to-scala.component').then(m => m.XmlToScalaComponent)
  },
  {
    path: 'xml-to-cpp',
    loadComponent: () => import('./pages/xml/xml-to-cpp/xml-to-cpp.component').then(m => m.XmlToCppComponent)
  },
  {
    path: 'xml-to-c',
    loadComponent: () => import('./pages/xml/xml-to-c/xml-to-c.component').then(m => m.XmlToCComponent)
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
