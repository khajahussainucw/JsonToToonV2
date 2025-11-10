import { Component, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';

declare var ace: any;

@Component({
  selector: 'app-js-minifier',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './js-minifier.component.html',
  styleUrl: './js-minifier.component.css'
})
export class JsMinifierComponent implements AfterViewInit {
  @ViewChild('inputEditor') private inputEditor!: ElementRef<HTMLElement>;
  @ViewChild('outputEditor') private outputEditor!: ElementRef<HTMLElement>;

  private aceInputEditor: any;
  private aceOutputEditor: any;

  errorMessage = '';
  copySuccessMessage = '';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private titleService: Title, 
    private metaService: Meta
  ) {
    this.titleService.setTitle('JavaScript Minifier - Compress JS Code Online');
    this.metaService.updateTag({
      name: 'description',
      content: 'Minify and compress JavaScript code online. Reduce file size for faster loading.'
    });
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.initializeEditor();
      }, 100);
    }
  }

  private initializeEditor() {
    if (typeof window === 'undefined' || typeof ace === 'undefined') {
      console.error('Ace editor is not loaded');
      return;
    }
    this.aceInputEditor = ace.edit(this.inputEditor.nativeElement);
    this.aceInputEditor.setTheme('ace/theme/github');
    this.aceInputEditor.session.setMode('ace/mode/javascript');
    this.aceInputEditor.setOptions({
      fontSize: '14px',
      showPrintMargin: false,
      highlightActiveLine: true,
      wrap: true
    });

    this.aceInputEditor.session.on('change', () => {
      this.minifyJavaScript();
    });

    this.aceOutputEditor = ace.edit(this.outputEditor.nativeElement);
    this.aceOutputEditor.setTheme('ace/theme/github');
    this.aceOutputEditor.session.setMode('ace/mode/javascript');
    this.aceOutputEditor.setOptions({
      fontSize: '14px',
      showPrintMargin: false,
      highlightActiveLine: true,
      wrap: true,
      readOnly: true
    });
  }

  loadSampleJs() {
    const sampleJs = `function calculateTotal(items) {
  let total = 0;
  
  for (let i = 0; i < items.length; i++) {
    total += items[i].price * items[i].quantity;
  }
  
  return total;
}

const products = [
  { name: "Laptop", price: 999, quantity: 2 },
  { name: "Mouse", price: 25, quantity: 5 }
];

console.log("Total:", calculateTotal(products));`;
    
    this.aceInputEditor.setValue(sampleJs, -1);
    this.aceInputEditor.clearSelection();
  }

  minifyJavaScript() {
    try {
      this.errorMessage = '';
      this.copySuccessMessage = '';

      const jsContent = this.aceInputEditor.getValue().trim();
      
      if (!jsContent) {
        this.aceOutputEditor.setValue('');
        return;
      }

      const minified = this.minifyJs(jsContent);
      
      this.aceOutputEditor.setValue(minified, -1);
      this.aceOutputEditor.clearSelection();
    } catch (error: any) {
      this.errorMessage = 'Error minifying JavaScript: ' + error.message;
      this.aceOutputEditor.setValue('');
    }
  }

  private minifyJs(code: string): string {
    let minified = code;
    
    // Remove multi-line comments
    minified = minified.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Remove single-line comments (but preserve URLs)
    minified = minified.replace(/([^:])\/\/.*/g, '$1');
    
    // Remove leading/trailing whitespace from each line
    minified = minified.replace(/^\s+|\s+$/gm, '');
    
    // Replace multiple spaces with single space
    minified = minified.replace(/\s{2,}/g, ' ');
    
    // Remove spaces around operators and special characters
    minified = minified.replace(/\s*([{};,:\[\]()=+\-*/<>!&|])\s*/g, '$1');
    
    // Remove empty lines
    minified = minified.replace(/\n+/g, '');
    
    return minified.trim();
  }

  uploadFile(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.aceInputEditor.setValue(e.target.result, -1);
        this.aceInputEditor.clearSelection();
      };
      reader.readAsText(file);
    }
    event.target.value = '';
  }

  downloadJs() {
    const content = this.aceOutputEditor.getValue();
    if (!content) {
      this.errorMessage = 'No output to download';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    const blob = new Blob([content], { type: 'application/javascript' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'minified.js';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  copyToClipboard() {
    const content = this.aceOutputEditor.getValue();
    if (!content) {
      this.errorMessage = 'No output to copy';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    navigator.clipboard.writeText(content).then(() => {
      this.copySuccessMessage = 'Copied to clipboard!';
      setTimeout(() => this.copySuccessMessage = '', 2000);
    });
  }

  clearInput() {
    this.aceInputEditor.setValue('');
    this.aceOutputEditor.setValue('');
    this.errorMessage = '';
    this.copySuccessMessage = '';
  }
}

