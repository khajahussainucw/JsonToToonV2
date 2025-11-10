import { Injectable } from '@angular/core';

export interface AdConfig {
  component: 'namecheap' | 'shopify' | 'digitalocean';
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdRotationService {
  private ads: AdConfig[] = [
    { component: 'namecheap', name: 'Namecheap' },
    { component: 'shopify', name: 'Shopify' },
    { component: 'digitalocean', name: 'DigitalOcean' }
  ];

  private currentAdIndex: number = -1;
  private readonly STORAGE_KEY = 'current_ad_rotation';

  constructor() {
    // Initialize with a random ad
    this.loadRotation();
  }

  private loadRotation(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      this.currentAdIndex = parseInt(stored, 10);
    } else {
      this.currentAdIndex = Math.floor(Math.random() * this.ads.length);
      this.saveRotation();
    }
  }

  private saveRotation(): void {
    localStorage.setItem(this.STORAGE_KEY, this.currentAdIndex.toString());
  }

  /**
   * Get the current ad to display
   */
  getCurrentAd(): AdConfig {
    return this.ads[this.currentAdIndex];
  }

  /**
   * Get a random ad (different from current if possible)
   */
  getRandomAd(): AdConfig {
    if (this.ads.length === 1) {
      return this.ads[0];
    }

    let newIndex: number;
    do {
      newIndex = Math.floor(Math.random() * this.ads.length);
    } while (newIndex === this.currentAdIndex);

    this.currentAdIndex = newIndex;
    this.saveRotation();
    return this.ads[this.currentAdIndex];
  }

  /**
   * Rotate to the next ad in sequence
   */
  rotateToNext(): AdConfig {
    this.currentAdIndex = (this.currentAdIndex + 1) % this.ads.length;
    this.saveRotation();
    return this.ads[this.currentAdIndex];
  }

  /**
   * Get ad for a specific page (you can customize logic per page)
   */
  getAdForPage(pageName: string): AdConfig {
    // For now, return a random ad for each page load
    // You could implement page-specific logic here if needed
    return this.getCurrentAd();
  }
}

