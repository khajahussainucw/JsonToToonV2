import { Component, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';

declare const ace: any;

@Component({
  selector: 'app-xml-to-html',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './xml-to-html.component.html',
  styleUrl: './xml-to-html.component.css'
})
export class XmlToHtmlComponent implements AfterViewInit {
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

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private meta: Meta,
    private title: Title
  ) {
    this.setupMetaTags();
  }

  private setupMetaTags() {
    this.title.setTitle('XML to HTML Converter - Convert XML to HTML Online');
    this.meta.updateTag({
      name: 'description',
      content: 'Convert XML to HTML online with our fast and reliable XML to HTML converter tool. Perfect for developers working with web content and data transformation.'
    });
    this.meta.updateTag({
      name: 'keywords',
      content: 'xml to html, xml converter, convert xml to html, xml to html online'
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
    this.aceOutputEditor.session.setMode('ace/mode/html');
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
      this.convertXmlToHtml();
    }, 300);
  }

  private convertXmlToHtml() {
    try {
      const inputXml = this.aceInputEditor.getValue().trim();
      if (!inputXml) {
        this.aceOutputEditor.setValue('');
        return;
      }

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(inputXml, 'text/xml');
      
      const parserError = xmlDoc.getElementsByTagName('parsererror');
      if (parserError.length > 0) {
        throw new Error('Invalid XML syntax');
      }

      // Convert XML to HTML by transforming elements
      const htmlString = this.xmlToHtml(xmlDoc);
      
      this.aceOutputEditor.setValue(htmlString, -1);
      this.aceOutputEditor.clearSelection();
    }
    catch (error: any) {
      this.aceOutputEditor.setValue('Invalid XML: ' + error.message, -1);
      this.aceOutputEditor.clearSelection();
    }
  }

  private xmlToHtml(xmlDoc: Document): string {
    const serializer = new XMLSerializer();
    let html = serializer.serializeToString(xmlDoc.documentElement || xmlDoc);
    
    // Basic transformation: wrap in HTML structure if needed
    if (!html.includes('<html')) {
      html = `<!DOCTYPE html>\n<html>\n<head>\n<meta charset="UTF-8">\n<title>Converted XML</title>\n</head>\n<body>\n${html}\n</body>\n</html>`;
    }
    
    return html;
  }

  loadSampleXml() {
    const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <article>
    <title>Sample Article</title>
    <content>
      <paragraph>This is a sample paragraph.</paragraph>
      <paragraph>Another paragraph with <strong>bold text</strong>.</paragraph>
    </content>
  </article>
</root>`;

    this.aceInputEditor.setValue(sampleXml, -1);
    this.aceInputEditor.clearSelection();
    this.convertXmlToHtml();
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
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(content, 'text/xml');
        const parserError = xmlDoc.getElementsByTagName('parsererror');
        if (parserError.length > 0) {
          throw new Error('Invalid XML');
        }
        this.aceInputEditor.setValue(content, -1);
        this.aceInputEditor.clearSelection();
        this.convertXmlToHtml();
      } catch (error: any) {
        this.showErrorModal('Please upload a valid XML document.');
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
    this.convertXmlToHtml();
  }

  copyToClipboard(): void {
    const outputContent = this.aceOutputEditor.getValue();
    if (!outputContent || outputContent.trim() === '' || outputContent.startsWith('Invalid XML')) {
      this.copyErrorMessage = 'Nothing to copy';
      this.copyErrorVisible = true;
      setTimeout(() => {
        this.copyErrorVisible = false;
      }, 3000);
      return;
    }
    
    navigator.clipboard.writeText(outputContent).then(() => {
      this.copySuccessMessage = 'HTML copied to clipboard!';
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

  downloadHtml(): void {
    const outputContent = this.aceOutputEditor.getValue();
    if (!outputContent || outputContent.trim() === '' || outputContent.startsWith('Invalid XML')) {
      this.copyErrorMessage = 'Nothing to download';
      this.copyErrorVisible = true;
      setTimeout(() => {
        this.copyErrorVisible = false;
      }, 3000);
      return;
    }
    
    const blob = new Blob([outputContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'converted.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    this.copySuccessMessage = 'HTML downloaded successfully!';
    this.copySuccessVisible = true;
    setTimeout(() => {
      this.copySuccessVisible = false;
    }, 3000);
  }
}

