import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NamecheapAdComponent } from '../namecheap-ad/namecheap-ad.component';
import { ShopifyAdComponent } from '../shopify-ad/shopify-ad.component';
import { DigitalOceanAdComponent } from '../digital-ocean-ad/digital-ocean-ad.component';
import { AdRotationService, AdConfig } from '../../services/ad-rotation.service';

@Component({
  selector: 'app-rotating-ad',
  standalone: true,
  imports: [CommonModule, NamecheapAdComponent, ShopifyAdComponent, DigitalOceanAdComponent],
  templateUrl: './rotating-ad.component.html',
  styleUrl: './rotating-ad.component.css'
})
export class RotatingAdComponent implements OnInit {
  currentAd: AdConfig | null = null;

  constructor(private adRotationService: AdRotationService) {}

  ngOnInit() {
    // Get a random ad on component initialization
    this.currentAd = this.adRotationService.getRandomAd();
    console.log('Rotating Ad - Displaying:', this.currentAd.name);
  }

  isNamecheapAd(): boolean {
    return this.currentAd?.component === 'namecheap';
  }

  isShopifyAd(): boolean {
    return this.currentAd?.component === 'shopify';
  }

  isDigitalOceanAd(): boolean {
    return this.currentAd?.component === 'digitalocean';
  }
}

