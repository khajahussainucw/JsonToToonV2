import { Component, Input, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-shopify-ad',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shopify-ad.component.html',
  styleUrl: './shopify-ad.component.css'
})
export class ShopifyAdComponent implements OnInit, OnDestroy {
  @Input() adLink: string = 'https://shopify.pxf.io/rao5jd'; // Shopify affiliate link
  @Input() showDelay: number = 500; // Delay in milliseconds before showing ad
  @Input() debugMode: boolean = true; // Set to true to always show ad (ignore localStorage)
  
  isVisible: boolean = false;
  isDismissed: boolean = false;
  private readonly STORAGE_KEY = 'shopify_ad_dismissed';
  private timeoutId: any;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    console.log('Shopify Ad Component Initialized');
    console.log('Platform:', isPlatformBrowser(this.platformId) ? 'Browser' : 'Server');
    console.log('Debug Mode:', this.debugMode);
    
    if (isPlatformBrowser(this.platformId)) {
      // Check if ad was previously dismissed (skip check in debug mode)
      if (!this.debugMode) {
        const dismissed = localStorage.getItem(this.STORAGE_KEY);
        console.log('Ad dismissed status from localStorage:', dismissed);
        
        if (dismissed === 'true') {
          this.isDismissed = true;
          console.log('Ad is dismissed, not showing');
          return;
        }
      } else {
        console.log('Debug mode active - ignoring localStorage, will show ad');
      }

      // Show ad after delay
      console.log(`Ad will appear after ${this.showDelay}ms`);
      this.timeoutId = setTimeout(() => {
        console.log('Showing ad now - setting isVisible to true');
        this.isVisible = true;
      }, this.showDelay);
    }
  }

  ngOnDestroy() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  onAdClick(event: Event) {
    // Allow the link to work normally
    if (this.adLink) {
      window.open(this.adLink, '_blank', 'noopener,noreferrer');
    }
  }

  onImageError(event: any) {
    console.error('Shopify banner image failed to load:', event);
    // Fallback to direct URL if local asset fails
    if (event.target) {
      event.target.src = 'https://app.impact.com/display-ad/13624-2944579?v=0';
    }
  }
}

