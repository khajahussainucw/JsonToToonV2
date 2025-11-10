import { Component, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';

declare const ace: any;

@Component({
  selector: 'app-xml-to-base64',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './xml-to-base64.component.html',
  styleUrl: './xml-to-base64.component.css'
})
export class XmlToBase64Component implements AfterViewInit {
  @ViewChild('inputEditor') private inputEditor!: ElementRef<HTMLElement>;
  @ViewChild('outputEditor') private outputEditor!: ElementRef<HTMLElement>;
  @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;

  private aceInputEditor: any;
  private aceOutputEditor: any;
  private debounceTimer: any;
  
  errorModalVisible = false;
  errorMessage = '';
  copySuccessVisible = false;
  copySuccessMessage = '';
  copyErrorVisible = false;
  copyErrorMessage = '';
  isEncoding = true;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private meta: Meta,
    private title: Title
  ) {
    this.setupMetaTags();
  }

  private setupMetaTags() {
    this.title.setTitle('XML to Base64 Converter - Encode/Decode XML to Base64 Online');
    this.meta.updateTag({
      name: 'description',
      content: 'Encode XML to Base64 or decode Base64 to XML online. Fast and reliable XML Base64 encoder/decoder tool.'
    });
    this.meta.updateTag({
      name: 'keywords',
      content: 'xml to base64, xml base64 encoder, base64 to xml, xml base64 decoder'
    });
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.initializeEditors();
        window.addEventListener('resize', () => {
          if (this.aceInputEditor) this.aceInputEditor.resize();
          if (this.aceOutputEditor) this.aceOutputEditor.resize();
        });
      }, 100);
    }
  }

  private initializeEditors() {
    if (typeof window === 'undefined' || typeof ace === 'undefined') {
      console.error('Ace editor is not loaded');
      return;
    }

    this.aceInputEditor = ace.edit(this.inputEditor.nativeElement);
    this.aceInputEditor.setTheme('ace/theme/github');
    this.aceInputEditor.session.setMode('ace/mode/xml');
    this.aceInputEditor.setOptions({
      useWrapMode: true,
      fontSize: '14px',
      showPrintMargin: false,
    });
    this.aceInputEditor.getSession().setUseWrapMode(true);

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

    this.aceInputEditor.session.on('change', () => {
      this.debouncedConvert();
    });

    setTimeout(() => {
      this.aceInputEditor.resize(true);
      this.aceOutputEditor.resize(true);
    }, 100);
  }

  private debouncedConvert() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      if (this.isEncoding) {
        this.encodeXmlToBase64();
      } else {
        this.decodeBase64ToXml();
      }
    }, 300);
  }

  toggleMode() {
    this.isEncoding = !this.isEncoding;
    const inputValue = this.aceInputEditor.getValue();
    const outputValue = this.aceOutputEditor.getValue();
    this.aceInputEditor.setValue(outputValue, -1);
    this.aceOutputEditor.setValue(inputValue, -1);
    this.aceInputEditor.session.setMode(this.isEncoding ? 'ace/mode/xml' : 'ace/mode/text');
    this.debouncedConvert();
  }

  private encodeXmlToBase64() {
    try {
      const inputXml = this.aceInputEditor.getValue().trim();
      if (!inputXml) {
        this.aceOutputEditor.setValue('');
        return;
      }

      // Validate XML first
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(inputXml, 'text/xml');
      const parserError = xmlDoc.getElementsByTagName('parsererror');
      if (parserError.length > 0) {
        throw new Error('Invalid XML syntax');
      }

      const base64 = btoa(unescape(encodeURIComponent(inputXml)));
      this.aceOutputEditor.setValue(base64, -1);
      this.aceOutputEditor.clearSelection();
    }
    catch (error: any) {
      this.aceOutputEditor.setValue('Error: ' + error.message, -1);
      this.aceOutputEditor.clearSelection();
    }
  }

  private decodeBase64ToXml() {
    try {
      const inputBase64 = this.aceInputEditor.getValue().trim();
      if (!inputBase64) {
        this.aceOutputEditor.setValue('');
        return;
      }

      const xmlString = decodeURIComponent(escape(atob(inputBase64)));
      
      // Validate XML
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
      const parserError = xmlDoc.getElementsByTagName('parsererror');
      if (parserError.length > 0) {
        throw new Error('Decoded string is not valid XML');
      }

      this.aceOutputEditor.setValue(xmlString, -1);
      this.aceOutputEditor.session.setMode('ace/mode/xml');
      this.aceOutputEditor.clearSelection();
    }
    catch (error: any) {
      this.aceOutputEditor.setValue('Error: ' + error.message, -1);
      this.aceOutputEditor.clearSelection();
    }
  }

  loadSampleXml() {
    const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <message>Sample XML content</message>
</root>`;

    this.aceInputEditor.setValue(sampleXml, -1);
    this.aceInputEditor.clearSelection();
    if (this.isEncoding) {
      this.encodeXmlToBase64();
    }
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
      if (this.isEncoding) {
        this.encodeXmlToBase64();
      } else {
        this.decodeBase64ToXml();
      }
    };
    reader.readAsText(file);
  }

  showErrorModal(message: string): void {
    this.errorMessage = message;
    this.errorModalVisible = true;
  }

  closeErrorModal(): void {
    this.errorModalVisible = false;
  }

  clearInput(): void {
    this.aceInputEditor.setValue('', -1);
    this.aceInputEditor.clearSelection();
    this.aceOutputEditor.setValue('', -1);
  }

  copyToClipboard(): void {
    const outputContent = this.aceOutputEditor.getValue();
    if (!outputContent || outputContent.trim() === '' || outputContent.startsWith('Error:')) {
      this.copyErrorMessage = 'Nothing to copy';
      this.copyErrorVisible = true;
      setTimeout(() => {
        this.copyErrorVisible = false;
      }, 3000);
      return;
    }
    
    navigator.clipboard.writeText(outputContent).then(() => {
      this.copySuccessMessage = (this.isEncoding ? 'Base64' : 'XML') + ' copied to clipboard!';
      this.copySuccessVisible = true;
      setTimeout(() => {
        this.copySuccessVisible = false;
      }, 3000);
    }).catch(err => {
      this.copyErrorMessage = 'Failed to copy to clipboard';
      this.copyErrorVisible = true;
      setTimeout(() => {
        this.copyErrorVisible = false;
      }, 3000);
    });
  }

  downloadOutput(): void {
    const outputContent = this.aceOutputEditor.getValue();
    if (!outputContent || outputContent.trim() === '' || outputContent.startsWith('Error:')) {
      this.copyErrorMessage = 'Nothing to download';
      this.copyErrorVisible = true;
      setTimeout(() => {
        this.copyErrorVisible = false;
      }, 3000);
      return;
    }
    
    const blob = new Blob([outputContent], { type: this.isEncoding ? 'text/plain' : 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = this.isEncoding ? 'encoded.txt' : 'decoded.xml';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    this.copySuccessMessage = 'File downloaded successfully!';
    this.copySuccessVisible = true;
    setTimeout(() => {
      this.copySuccessVisible = false;
    }, 3000);
  }
}

