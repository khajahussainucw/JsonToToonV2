import { Component, OnInit } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

interface NavLink {
  label: string;
  route: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, CommonModule], 
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'json-parser-angular';
  primaryPages: NavLink[] = [];
  dropdownPages: NavLink[] = [];
  currentPageType: string = 'JSON';

  // Define pages by category (4 primary + additional for dropdown)
  private pagesByCategory: { [key: string]: { primary: NavLink[], dropdown: NavLink[] } } = {
    'json': {
      primary: [
        { label: 'JSON Parser', route: '/' },
        { label: 'JSON Grid', route: '/json-grid' },
        { label: 'JSON Formatter', route: '/json-formatter' },
        { label: 'JSON Validator', route: '/json-validator' }
      ],
      dropdown: [
        { label: 'JSON Minifier', route: '/json-minifier' },
        { label: 'JSON Fixer', route: '/json-fixer' },
        { label: 'JSON Escape', route: '/json-escape' },
        { label: 'JSON Diff', route: '/json-diff' },
        { label: 'JSON Merge', route: '/json-merge' },
        { label: 'JSON Path', route: '/json-path' },
        { label: 'JSON Schema', route: '/json-schema-generator' },
        { label: 'JSON Sort', route: '/json-sort' }
      ]
    },
    'xml': {
      primary: [
        { label: 'XML Formatter', route: '/xml-formatter' },
        { label: 'XML Validator', route: '/xml-validator' },
        { label: 'XML to JSON', route: '/xml-to-json' },
        { label: 'JSON to XML', route: '/json-to-xml' }
      ],
      dropdown: [
        { label: 'XML Minifier', route: '/xml-minifier' },
        { label: 'XML to YAML', route: '/xml-to-yaml' },
        { label: 'XML to CSV', route: '/xml-to-csv' }
      ]
    },
    'yaml': {
      primary: [
        { label: 'YAML to JSON', route: '/yaml-to-json' },
        { label: 'JSON to YAML', route: '/json-to-yaml' },
        { label: 'YAML Validator', route: '/yaml-validator' },
        { label: 'YAML Formatter', route: '/yaml-formatter' }
      ],
      dropdown: [
        { label: 'YAML to XML', route: '/yaml-to-xml' },
        { label: 'YAML to CSV', route: '/yaml-to-csv' },
        { label: 'YAML to TOML', route: '/yaml-to-toml' },
        { label: 'YAML Minifier', route: '/yaml-minifier' },
        { label: 'YAML to TypeScript', route: '/yaml-to-typescript' }
      ]
    },
    'csv': {
      primary: [
        { label: 'CSV Viewer', route: '/csv-viewer' },
        { label: 'CSV to JSON', route: '/csv-to-json' },
        { label: 'CSV Formatter', route: '/csv-formatter' },
        { label: 'CSV Validator', route: '/csv-validator' }
      ],
      dropdown: [
        { label: 'CSV to YAML', route: '/csv-to-yaml' },
        { label: 'CSV to XML', route: '/csv-to-xml' }
      ]
    },
    'toml': {
      primary: [
        { label: 'TOML Formatter', route: '/toml-formatter' },
        { label: 'TOML Validator', route: '/toml-validator' },
        { label: 'TOML to JSON', route: '/toml-to-json' },
        { label: 'JSON to TOML', route: '/json-to-toml' }
      ],
      dropdown: [
        { label: 'TOML to YAML', route: '/toml-to-yaml' },
        { label: 'TOML to XML', route: '/toml-to-xml' },
        { label: 'TOML to CSV', route: '/toml-to-csv' }
      ]
    },
    'toon': {
      primary: [
        { label: 'JSON to TOON', route: '/json-to-toon' },
        { label: 'TOON to JSON', route: '/toon-to-json' },
        { label: 'TOON Formatter', route: '/toon-formatter' },
        { label: 'TOON Validator', route: '/toon-validator' }
      ],
      dropdown: [
        { label: 'TOON to CSV', route: '/toon-to-csv' },
        { label: 'TOON to YAML', route: '/toon-to-yaml' },
        { label: 'TOON to XML', route: '/toon-to-xml' },
        { label: 'TOON to TOML', route: '/toon-to-toml' }
      ]
    },
    'javascript': {
      primary: [
        { label: 'JS Formatter', route: '/js-formatter' },
        { label: 'JS Minifier', route: '/js-minifier' },
        { label: 'JS Validator', route: '/js-validator' },
        { label: 'JS Console', route: '/js-console' }
      ],
      dropdown: [
        { label: 'JS Obfuscator', route: '/js-obfuscator' },
        { label: 'JS Deobfuscator', route: '/js-deobfuscator' },
        { label: 'JS to TypeScript', route: '/js-to-typescript' },
        { label: 'JSX Formatter', route: '/jsx-formatter' }
      ]
    },
    'css': {
      primary: [
        { label: 'CSS Formatter', route: '/css-formatter' },
        { label: 'CSS Minifier', route: '/css-minifier' },
        { label: 'CSS Validator', route: '/css-validator' },
        { label: 'SCSS to CSS', route: '/scss-to-css' }
      ],
      dropdown: [
        { label: 'CSS to SCSS', route: '/css-to-scss' }
      ]
    },
    'markdown': {
      primary: [
        { label: 'Markdown Editor', route: '/markdown-editor' },
        { label: 'Markdown to HTML', route: '/markdown-to-html' },
        { label: 'HTML to Markdown', route: '/html-to-markdown' },
        { label: 'Markdown Formatter', route: '/markdown-formatter' }
      ],
      dropdown: [
        { label: 'Table Generator', route: '/markdown-table-generator' }
      ]
    }
  };

  constructor(private router: Router) {}

  ngOnInit() {
    // Set initial related pages
    this.updateRelatedPages(this.router.url);

    // Listen to route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateRelatedPages(event.urlAfterRedirects);
    });
  }

  private updateRelatedPages(url: string) {
    // Determine the page type from the current URL
    const pageType = this.getPageTypeFromUrl(url);
    this.currentPageType = pageType.toUpperCase();
    const pages = this.pagesByCategory[pageType] || this.pagesByCategory['json'];
    this.primaryPages = pages.primary;
    this.dropdownPages = pages.dropdown;
  }

  private getPageTypeFromUrl(url: string): string {
    // Remove leading slash and get the first part
    const path = url.substring(1);
    
    // Check for specific page types
    if (path === '' || path.startsWith('json') || path.startsWith('string-to-json')) {
      return 'json';
    } else if (path.startsWith('xml')) {
      return 'xml';
    } else if (path.startsWith('yaml')) {
      return 'yaml';
    } else if (path.startsWith('csv')) {
      return 'csv';
    } else if (path.startsWith('toml')) {
      return 'toml';
    } else if (path.startsWith('toon')) {
      return 'toon';
    } else if (path.startsWith('js') || path.startsWith('jsx')) {
      return 'javascript';
    } else if (path.startsWith('css') || path.startsWith('scss')) {
      return 'css';
    } else if (path.startsWith('markdown') || path.startsWith('html-to-markdown')) {
      return 'markdown';
    }
    
    // Default to json
    return 'json';
  }

  onLogoClick(event: MouseEvent) {
    event.preventDefault();
    // Navigate to home and force a full reload
    window.location.href = '/';
  }
}
