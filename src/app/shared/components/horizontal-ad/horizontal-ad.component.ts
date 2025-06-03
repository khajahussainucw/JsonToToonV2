import { Component, AfterViewInit, PLATFORM_ID, Inject, Input } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-horizontal-ad',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './horizontal-ad.component.html',
  styleUrl: './horizontal-ad.component.css'
})
export class HorizontalAdComponent implements AfterViewInit {
  @Input() adSlot: string = '2356742626'; // Default ad slot
  @Input() adClient: string = 'ca-pub-9839651695221972'; // Default ad client
  @Input() adFormat: string = 'auto'; // Default ad format
  @Input() maxWidth: string = '1200px'; // Default max width
  @Input() margin: string = '20px auto'; // Default margin

  private adInitialized = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Delay initialization to ensure the DOM is ready
      setTimeout(() => {
        this.initializeAdSense();
      }, 100);
    }
  }

  private initializeAdSense() {
    // Only initialize AdSense if it's available, not on mobile, and not already initialized
    if (typeof window !== 'undefined' && 
        (window as any).adsbygoogle && 
        !this.isMobileDevice() && 
        !this.adInitialized) {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        this.adInitialized = true;
      } catch (e) {
        console.log('AdSense error:', e);
      }
    }
  }

  private isMobileDevice(): boolean {
    if (typeof navigator === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
}
