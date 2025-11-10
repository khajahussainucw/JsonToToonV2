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
  relatedPages: NavLink[] = [];
  currentPageType: string = 'JSON';

  // Define pages by category (top 4 most popular for each)
  private pagesByCategory: { [key: string]: NavLink[] } = {
    'json': [
      { label: 'JSON Parser', route: '/' },
      { label: 'JSON Grid', route: '/json-grid' },
      { label: 'JSON Formatter', route: '/json-formatter' },
      { label: 'JSON Validator', route: '/json-validator' }
    ],
    'xml': [
      { label: 'XML Formatter', route: '/xml-formatter' },
      { label: 'XML Validator', route: '/xml-validator' },
      { label: 'XML to JSON', route: '/xml-to-json' },
      { label: 'JSON to XML', route: '/json-to-xml' }
    ],
    'yaml': [
      { label: 'YAML to JSON', route: '/yaml-to-json' },
      { label: 'JSON to YAML', route: '/json-to-yaml' },
      { label: 'YAML Validator', route: '/yaml-validator' },
      { label: 'YAML Formatter', route: '/yaml-formatter' }
    ],
    'csv': [
      { label: 'CSV Viewer', route: '/csv-viewer' },
      { label: 'CSV to JSON', route: '/csv-to-json' },
      { label: 'CSV Formatter', route: '/csv-formatter' },
      { label: 'CSV Validator', route: '/csv-validator' }
    ],
    'toml': [
      { label: 'TOML Formatter', route: '/toml-formatter' },
      { label: 'TOML Validator', route: '/toml-validator' },
      { label: 'TOML to JSON', route: '/toml-to-json' },
      { label: 'JSON to TOML', route: '/json-to-toml' }
    ],
    'toon': [
      { label: 'JSON to TOON', route: '/json-to-toon' },
      { label: 'TOON to JSON', route: '/toon-to-json' },
      { label: 'TOON Formatter', route: '/toon-formatter' },
      { label: 'TOON Validator', route: '/toon-validator' }
    ],
    'javascript': [
      { label: 'JS Formatter', route: '/js-formatter' },
      { label: 'JS Minifier', route: '/js-minifier' },
      { label: 'JS Validator', route: '/js-validator' },
      { label: 'JS Console', route: '/js-console' }
    ],
    'css': [
      { label: 'CSS Formatter', route: '/css-formatter' },
      { label: 'CSS Minifier', route: '/css-minifier' },
      { label: 'CSS Validator', route: '/css-validator' },
      { label: 'SCSS to CSS', route: '/scss-to-css' }
    ],
    'markdown': [
      { label: 'Markdown Editor', route: '/markdown-editor' },
      { label: 'Markdown to HTML', route: '/markdown-to-html' },
      { label: 'HTML to Markdown', route: '/html-to-markdown' },
      { label: 'Markdown Formatter', route: '/markdown-formatter' }
    ]
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
    this.relatedPages = this.pagesByCategory[pageType] || this.pagesByCategory['json'];
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
