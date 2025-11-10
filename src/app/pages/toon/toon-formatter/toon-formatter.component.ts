import { Component, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { encode, decode } from '@toon-format/toon';

declare const ace: any;

@Component({
  selector: 'app-toon-formatter',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './toon-formatter.component.html',
  styleUrl: './toon-formatter.component.css'
})
export class ToonFormatterComponent implements AfterViewInit {
  @ViewChild('inputEditor') private inputEditor!: ElementRef<HTMLElement>;
  @ViewChild('outputEditor') private outputEditor!: ElementRef<HTMLElement>;
  @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;

  private aceInputEditor: any;
  private aceOutputEditor: any;
  private debounceTimer: any;
  
  errorMessage = '';
  copySuccessMessage = '';
  copyErrorVisible = false;
  copyErrorMessage = '';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private meta: Meta,
    private title: Title
  ) {
    this.setupMetaTags();
  }

  private setupMetaTags() {
    this.title.setTitle('TOON Formatter - Format and Beautify TOON Online');
    this.meta.updateTag({
      name: 'description',
      content: 'Format and beautify TOON (Token-Oriented Object Notation) files online. Free TOON formatter with proper indentation and readability.'
    });
    this.meta.updateTag({
      name: 'keywords',
      content: 'toon formatter, toon beautifier, format toon, toon format online, token oriented object notation formatter'
    });
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.initializeEditors();
      }, 100);
    }
  }

  private initializeEditors() {
    if (typeof ace === 'undefined') {
      console.error('Ace editor is not loaded');
      return;
    }

    // Initialize input editor for TOON
    this.aceInputEditor = ace.edit(this.inputEditor.nativeElement);
    this.aceInputEditor.setTheme('ace/theme/github');
    this.aceInputEditor.session.setMode('ace/mode/text');
    this.aceInputEditor.setOptions({
      useWrapMode: true,
      fontSize: '14px',
      showPrintMargin: false,
    });
    this.aceInputEditor.getSession().setUseWrapMode(true);

    // Initialize output editor for formatted TOON
    this.aceOutputEditor = ace.edit(this.outputEditor.nativeElement);
    this.aceOutputEditor.setTheme('ace/theme/github');
    this.aceOutputEditor.session.setMode('ace/mode/text');
    this.aceOutputEditor.setOptions({
      useWrapMode: true,
      fontSize: '14px',
      showPrintMargin: false,
      readOnly: true
    });
    this.aceOutputEditor.getSession().setUseWrapMode(true);

    // Add change listener to input editor
    this.aceInputEditor.session.on('change', () => {
      this.debouncedFormatToon();
    });

    // Force resize after initialization
    setTimeout(() => {
      this.aceInputEditor.resize(true);
      this.aceOutputEditor.resize(true);
    }, 100);
  }

  private debouncedFormatToon() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.formatToon();
    }, 300);
  }

  formatToon() {
    try {
      this.errorMessage = '';
      this.copySuccessMessage = '';

      const toonContent = this.aceInputEditor.getValue().trim();
      
      if (!toonContent) {
        this.aceOutputEditor.setValue('');
        return;
      }

      // Decode TOON to JSON, then encode back with formatting
      const decodedJson = decode(toonContent);
      const formattedToon = encode(decodedJson, { indent: 2 });
      
      this.aceOutputEditor.setValue(formattedToon, -1);
      this.aceOutputEditor.clearSelection();
    } catch (error: any) {
      this.errorMessage = 'Error formatting TOON: ' + error.message;
      this.aceOutputEditor.setValue('');
    }
  }

  loadSampleToon() {
    const sampleToon = `users[3]{id,name,role}:
1,Alice,admin
2,Bob,user
3,Charlie,editor`;

    this.aceInputEditor.setValue(sampleToon, -1);
    this.aceInputEditor.clearSelection();
    this.formatToon();
  }

  triggerFileUpload(): void {
    this.fileInput.nativeElement.value = '';
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      this.aceInputEditor.setValue(content, -1);
      this.aceInputEditor.clearSelection();
      this.formatToon();
    };
    reader.readAsText(file);
  }

  clearInput(): void {
    this.aceInputEditor.setValue('', -1);
    this.aceInputEditor.clearSelection();
    this.formatToon();
  }

  copyToClipboard(): void {
    const outputContent = this.aceOutputEditor.getValue();
    if (!outputContent || outputContent.trim() === '') {
      this.copyErrorMessage = 'Nothing to copy';
      this.copyErrorVisible = true;
      setTimeout(() => {
        this.copyErrorVisible = false;
      }, 3000);
      return;
    }
    
    navigator.clipboard.writeText(outputContent).then(() => {
      this.copySuccessMessage = 'Formatted TOON copied to clipboard!';
      setTimeout(() => {
        this.copySuccessMessage = '';
      }, 3000);
    }).catch(err => {
      this.copyErrorMessage = 'Failed to copy to clipboard';
      this.copyErrorVisible = true;
      setTimeout(() => {
        this.copyErrorVisible = false;
      }, 3000);
    });
  }

  downloadToon(): void {
    const outputContent = this.aceOutputEditor.getValue();
    if (!outputContent || outputContent.trim() === '') {
      this.copyErrorMessage = 'Nothing to download';
      this.copyErrorVisible = true;
      setTimeout(() => {
        this.copyErrorVisible = false;
      }, 3000);
      return;
    }
    
    const blob = new Blob([outputContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'formatted.toon';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    this.copySuccessMessage = 'Formatted TOON downloaded successfully!';
    setTimeout(() => {
      this.copySuccessMessage = '';
    }, 3000);
  }
}

