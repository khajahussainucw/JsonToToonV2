import { Component, Input, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-digital-ocean-ad',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './digital-ocean-ad.component.html',
  styleUrl: './digital-ocean-ad.component.css'
})
export class DigitalOceanAdComponent implements OnInit, OnDestroy {
  @Input() adLink: string = 'https://www.anrdoezrs.net/click-101521087-15836241'; // DigitalOcean affiliate link
  @Input() showDelay: number = 500; // Delay in milliseconds before showing ad (reduced to 500ms for testing)
  @Input() debugMode: boolean = true; // Set to true to always show ad (ignore localStorage)
  
  isVisible: boolean = false;
  isDismissed: boolean = false;
  private readonly STORAGE_KEY = 'digitalocean_ad_dismissed';
  private timeoutId: any;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    console.log('DigitalOcean Ad Component Initialized');
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

  onClose(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    console.log('Close button clicked');
    
    if (isPlatformBrowser(this.platformId)) {
      // Hide the ad with animation
      this.isVisible = false;
      console.log('Ad hidden, saving to localStorage');
      
      // Mark as dismissed in localStorage
      localStorage.setItem(this.STORAGE_KEY, 'true');
      
      // Wait for animation to complete before hiding completely
      setTimeout(() => {
        this.isDismissed = true;
        console.log('Ad completely dismissed');
      }, 400); // Match the CSS transition duration
    }
  }
}

