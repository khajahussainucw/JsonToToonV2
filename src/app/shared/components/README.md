# Shared AdSense Components

This directory contains reusable AdSense components for the application.

## HorizontalAdComponent

A horizontal banner ad component that can be used across different pages.

### Usage

```typescript
import { HorizontalAdComponent } from '../../shared/components';

@Component({
  imports: [HorizontalAdComponent],
  // ...
})
```

```html
<!-- Basic usage with default settings -->
<app-horizontal-ad></app-horizontal-ad>

<!-- With custom settings -->
<app-horizontal-ad 
  [adSlot]="'your-ad-slot'"
  [adClient]="'ca-pub-your-client-id'"
  [adFormat]="'auto'"
  [maxWidth]="'1000px'"
  [margin]="'30px auto'">
</app-horizontal-ad>
```

### Inputs

- `adSlot` (string): Google AdSense ad slot ID (default: '2356742626')
- `adClient` (string): Google AdSense client ID (default: 'ca-pub-9839651695221972')
- `adFormat` (string): Ad format type (default: 'auto')
- `maxWidth` (string): Maximum width of the ad container (default: '1200px')
- `margin` (string): CSS margin for the ad container (default: '20px auto')

### Features

- ✅ Mobile device detection (ads won't show on mobile)
- ✅ Server-side rendering compatible
- ✅ Responsive design
- ✅ Automatic AdSense initialization
- ✅ Prevents duplicate initialization
- ✅ Configurable styling

## VerticalAdComponent

A vertical sidebar ad component (to be implemented).

## Prerequisites

Make sure the AdSense script is loaded in your `index.html`:

```html
<script>
  if (!isMobileDevice()) {
    const script = document.createElement('script');
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9839651695221972';
    script.async = true;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
  }
</script>
``` 