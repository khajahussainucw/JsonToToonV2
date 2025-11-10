import { Component, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';

declare var ace: any;

@Component({
  selector: 'app-js-obfuscator',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './js-obfuscator.component.html',
  styleUrl: './js-obfuscator.component.css'
})
export class JsObfuscatorComponent implements AfterViewInit {
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
    this.titleService.setTitle('JavaScript Obfuscator - Obfuscate JS Code Online');
    this.metaService.updateTag({
      name: 'description',
      content: 'Obfuscate JavaScript code online to protect your source code from unauthorized access.'
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
      this.obfuscateJavaScript();
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
    const sampleJs = `function calculateSum(a, b) {
  return a + b;
}

const result = calculateSum(10, 20);
console.log("Result:", result);`;
    
    this.aceInputEditor.setValue(sampleJs, -1);
    this.aceInputEditor.clearSelection();
  }

  obfuscateJavaScript() {
    try {
      this.errorMessage = '';
      this.copySuccessMessage = '';

      const jsContent = this.aceInputEditor.getValue().trim();
      
      if (!jsContent) {
        this.aceOutputEditor.setValue('');
        return;
      }

      const obfuscated = this.obfuscateCode(jsContent);
      
      this.aceOutputEditor.setValue(obfuscated, -1);
      this.aceOutputEditor.clearSelection();
    } catch (error: any) {
      this.errorMessage = 'Error obfuscating JavaScript: ' + error.message;
      this.aceOutputEditor.setValue('');
    }
  }

  private obfuscateCode(code: string): string {
    // Remove comments
    let obfuscated = code
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*/g, '');
    
    // Minify
    obfuscated = obfuscated
      .replace(/\s+/g, ' ')
      .replace(/\s*([{};,:\[\]()=+\-*/<>!&|])\s*/g, '$1')
      .trim();
    
    // Encode strings to hex
    obfuscated = obfuscated.replace(/"([^"]*)"/g, (match, p1) => {
      const hex = Array.from(p1 as string).map((c) => '\\x' + (c as string).charCodeAt(0).toString(16).padStart(2, '0')).join('');
      return `"${hex}"`;
    });
    
    obfuscated = obfuscated.replace(/'([^']*)'/g, (match, p1) => {
      const hex = Array.from(p1 as string).map((c) => '\\x' + (c as string).charCodeAt(0).toString(16).padStart(2, '0')).join('');
      return `'${hex}'`;
    });
    
    // Wrap in eval for additional obfuscation
    const base64 = btoa(obfuscated);
    const wrapped = `(function(_0x${this.randomHex()}){var _0x${this.randomHex()}=atob(_0x${this.randomHex()}='${base64}');eval(_0x${this.randomHex()});})();`;
    
    return wrapped;
  }

  private randomHex(): string {
    return Math.random().toString(16).substring(2, 8);
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
    a.download = 'obfuscated.js';
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

