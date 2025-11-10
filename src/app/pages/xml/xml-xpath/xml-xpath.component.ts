import { Component, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';

declare const ace: any;

@Component({
  selector: 'app-xml-xpath',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './xml-xpath.component.html',
  styleUrl: './xml-xpath.component.css'
})
export class XmlXpathComponent implements AfterViewInit {
  @ViewChild('inputEditor') private inputEditor!: ElementRef<HTMLElement>;
  @ViewChild('outputEditor') private outputEditor!: ElementRef<HTMLElement>;
  @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;

  private aceInputEditor: any;
  private aceOutputEditor: any;
  
  errorModalVisible = false;
  errorMessage = '';
  copySuccessVisible = false;
  copySuccessMessage = '';
  copyErrorVisible = false;
  copyErrorMessage = '';
  xpathQuery = '//*';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private meta: Meta,
    private title: Title
  ) {
    this.setupMetaTags();
  }

  private setupMetaTags() {
    this.title.setTitle('XML XPath Query Tool - Query XML with XPath Online');
    this.meta.updateTag({
      name: 'description',
      content: 'Query XML documents using XPath expressions. Fast and reliable XML XPath query tool.'
    });
    this.meta.updateTag({
      name: 'keywords',
      content: 'xml xpath, xpath query, xml query, xpath tool'
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
    this.aceOutputEditor.session.setMode('ace/mode/xml');
    this.aceOutputEditor.setOptions({
      useWrapMode: true,
      fontSize: '14px',
      showPrintMargin: false,
      readOnly: true
    });
    this.aceOutputEditor.getSession().setUseWrapMode(true);

    setTimeout(() => {
      this.aceInputEditor.resize(true);
      this.aceOutputEditor.resize(true);
    }, 100);
  }

  executeXPath() {
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

      if (!this.xpathQuery || !this.xpathQuery.trim()) {
        this.aceOutputEditor.setValue('Please enter an XPath query');
        return;
      }

      // Simple XPath implementation using DOM methods
      const results = this.evaluateXPath(xmlDoc, this.xpathQuery);
      
      if (results.length === 0) {
        this.aceOutputEditor.setValue('No results found for XPath: ' + this.xpathQuery);
      } else {
        const serializer = new XMLSerializer();
        const resultXml = results.map(node => serializer.serializeToString(node)).join('\n\n');
        this.aceOutputEditor.setValue(resultXml, -1);
      }
      this.aceOutputEditor.clearSelection();
    }
    catch (error: any) {
      this.aceOutputEditor.setValue('Error: ' + error.message, -1);
      this.aceOutputEditor.clearSelection();
    }
  }

  private evaluateXPath(doc: Document, xpath: string): Node[] {
    const results: Node[] = [];
    
    // Simple XPath-like evaluation for common patterns
    if (xpath.startsWith('//')) {
      const tagName = xpath.substring(2);
      if (tagName === '*' || tagName === '') {
        const allElements = doc.getElementsByTagName('*');
        for (let i = 0; i < allElements.length; i++) {
          results.push(allElements[i]);
        }
      } else {
        const elements = doc.getElementsByTagName(tagName);
        for (let i = 0; i < elements.length; i++) {
          results.push(elements[i]);
        }
      }
    } else if (xpath.startsWith('/')) {
      const parts = xpath.split('/').filter(p => p);
      let current: Node = doc;
      for (const part of parts) {
        if (part === '*') {
          const children = Array.from(current.childNodes).filter(n => n.nodeType === Node.ELEMENT_NODE);
          if (children.length > 0) current = children[0];
        } else {
          const element = (current as Element).getElementsByTagName(part)[0];
          if (!element) break;
          current = element;
        }
      }
      if (current !== doc) results.push(current);
    } else {
      // Try as tag name
      const elements = doc.getElementsByTagName(xpath);
      for (let i = 0; i < elements.length; i++) {
        results.push(elements[i]);
      }
    }
    
    return results;
  }

  loadSampleXml() {
    const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <person id="1">
    <name>John Doe</name>
    <age>30</age>
  </person>
  <person id="2">
    <name>Jane Smith</name>
    <age>25</age>
  </person>
</root>`;

    this.aceInputEditor.setValue(sampleXml, -1);
    this.aceInputEditor.clearSelection();
    this.xpathQuery = '//person';
    this.executeXPath();
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
    this.aceOutputEditor.setValue('', -1);
    this.xpathQuery = '//*';
  }

  copyToClipboard(): void {
    const outputContent = this.aceOutputEditor.getValue();
    if (!outputContent || outputContent.trim() === '' || outputContent.startsWith('Error:') || outputContent.startsWith('No results')) {
      this.copyErrorMessage = 'Nothing to copy';
      this.copyErrorVisible = true;
      setTimeout(() => {
        this.copyErrorVisible = false;
      }, 3000);
      return;
    }
    
    navigator.clipboard.writeText(outputContent).then(() => {
      this.copySuccessMessage = 'Results copied to clipboard!';
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
}

