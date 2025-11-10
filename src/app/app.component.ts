import { Component, OnInit } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { DigitalOceanAdComponent } from './advertisement/digital-ocean-ad/digital-ocean-ad.component';

interface NavLink {
  label: string;
  route: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, CommonModule, DigitalOceanAdComponent], 
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'JsonToToon';
  primaryPages: NavLink[] = [];
  dropdownPages: NavLink[] = [];
  currentPageType: string = 'TOON';

  // Define pages by category (4 primary + additional for dropdown)
  private pagesByCategory: { [key: string]: { primary: NavLink[], dropdown: NavLink[] } } = {
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
    // Always use toon pages
    const pages = this.pagesByCategory['toon'];
    this.primaryPages = pages.primary;
    this.dropdownPages = pages.dropdown;
  }

  onLogoClick(event: MouseEvent) {
    event.preventDefault();
    // Navigate to home and force a full reload
    window.location.href = '/';
  }
}
