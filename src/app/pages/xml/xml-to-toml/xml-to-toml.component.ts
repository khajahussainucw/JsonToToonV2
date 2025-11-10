import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import * as TOML from 'smol-toml';

declare const ace: any;

@Component({
  selector: 'app-xml-to-toml',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './xml-to-toml.component.html',
  styleUrl: './xml-to-toml.component.css'
})
export class XmlToTomlComponent implements AfterViewInit {
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
    this.title.setTitle('XML to TOML Converter - Convert XML to TOML Online');
    this.meta.updateTag({
      name: 'description',
      content: 'Convert XML to TOML online with our fast and reliable XML to TOML converter tool. Perfect for developers working with configuration files and data transformation.'
    });
    this.meta.updateTag({
      name: 'keywords',
      content: 'xml to toml, xml converter, convert xml to toml, xml to toml online'
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
    this.aceOutputEditor.session.setMode('ace/mode/toml');
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
      this.convertXmlToToml();
    }, 300);
  }

  private convertXmlToToml() {
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

      const jsonObj = this.xmlToJson(xmlDoc);
      const tomlString = TOML.stringify(jsonObj);
      
      this.aceOutputEditor.setValue(tomlString, -1);
      this.aceOutputEditor.clearSelection();
    }
    catch (error: any) {
      this.aceOutputEditor.setValue('Invalid XML: ' + error.message, -1);
      this.aceOutputEditor.clearSelection();
    }
  }

  private xmlToJson(xml: any): any {
    let obj: any = {};

    if (xml.nodeType === 1) {
      if (xml.attributes.length > 0) {
        obj['@attributes'] = {};
        for (let j = 0; j < xml.attributes.length; j++) {
          const attribute = xml.attributes.item(j);
          obj['@attributes'][attribute!.nodeName] = attribute!.nodeValue;
        }
      }
    } else if (xml.nodeType === 3) {
      const text = xml.nodeValue?.trim();
      return text || null;
    }

    if (xml.hasChildNodes()) {
      let textContent = '';
      let hasElementChildren = false;

      for (let i = 0; i < xml.childNodes.length; i++) {
        const item = xml.childNodes.item(i);
        const nodeName = item!.nodeName;

        if (item!.nodeType === 3) {
          textContent += item!.nodeValue || '';
        } else if (item!.nodeType === 1) {
          hasElementChildren = true;
          
          if (typeof obj[nodeName] === 'undefined') {
            obj[nodeName] = this.xmlToJson(item);
          } else {
            if (!Array.isArray(obj[nodeName])) {
              const old = obj[nodeName];
              obj[nodeName] = [];
              obj[nodeName].push(old);
            }
            obj[nodeName].push(this.xmlToJson(item));
          }
        }
      }

      if (!hasElementChildren && textContent.trim()) {
        if (Object.keys(obj).length === 0) {
          return textContent.trim();
        } else {
          obj['#text'] = textContent.trim();
        }
      } else if (!hasElementChildren && !textContent.trim() && Object.keys(obj).length === 0) {
        return null;
      }
    }

    return obj;
  }

  loadSampleXml() {
    const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <server>
    <host>localhost</host>
    <port>8080</port>
    <ssl>true</ssl>
  </server>
  <database>
    <connection>
      <host>db.example.com</host>
      <port>5432</port>
      <username>admin</username>
    </connection>
  </database>
</root>`;

    this.aceInputEditor.setValue(sampleXml, -1);
    this.aceInputEditor.clearSelection();
    this.convertXmlToToml();
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
        this.convertXmlToToml();
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
    this.convertXmlToToml();
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
      this.copySuccessMessage = 'TOML copied to clipboard!';
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

  downloadToml(): void {
    const outputContent = this.aceOutputEditor.getValue();
    if (!outputContent || outputContent.trim() === '' || outputContent.startsWith('Invalid XML')) {
      this.copyErrorMessage = 'Nothing to download';
      this.copyErrorVisible = true;
      setTimeout(() => {
        this.copyErrorVisible = false;
      }, 3000);
      return;
    }
    
    const blob = new Blob([outputContent], { type: 'text/toml' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'converted.toml';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    this.copySuccessMessage = 'TOML downloaded successfully!';
    this.copySuccessVisible = true;
    setTimeout(() => {
      this.copySuccessVisible = false;
    }, 3000);
  }
}

