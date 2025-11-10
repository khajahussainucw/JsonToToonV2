import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';

declare const ace: any;

@Component({
  selector: 'app-xml-to-csv',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './xml-to-csv.component.html',
  styleUrl: './xml-to-csv.component.css'
})
export class XmlToCsvComponent implements AfterViewInit {
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
    this.title.setTitle('XML to CSV Converter - Convert XML to CSV Online');
    this.meta.updateTag({
      name: 'description',
      content: 'Convert XML to CSV online with our fast XML to CSV converter. Transform XML data into CSV format for Excel and data analysis.'
    });
    this.meta.updateTag({
      name: 'keywords',
      content: 'xml to csv, xml converter, convert xml to csv, xml to csv online'
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
      this.convertXmlToCsv();
    }, 300);
  }

  private convertXmlToCsv() {
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
      
      // Try to find an array in the JSON object
      let dataArray: any[] = [];
      if (Array.isArray(jsonObj)) {
        dataArray = jsonObj;
      } else if (typeof jsonObj === 'object' && jsonObj !== null) {
        // Find first array in the object
        for (const key in jsonObj) {
          if (Array.isArray(jsonObj[key])) {
            dataArray = jsonObj[key];
            break;
          }
          // Check nested objects
          if (typeof jsonObj[key] === 'object' && jsonObj[key] !== null) {
            for (const nestedKey in jsonObj[key]) {
              if (Array.isArray(jsonObj[key][nestedKey])) {
                dataArray = jsonObj[key][nestedKey];
                break;
              }
            }
            if (dataArray.length > 0) break;
          }
        }
      }

      if (dataArray.length === 0) {
        this.aceOutputEditor.setValue('Error: XML must contain an array of similar elements to convert to CSV', -1);
        this.aceOutputEditor.clearSelection();
        return;
      }

      const allKeys = new Set<string>();
      dataArray.forEach((item: any) => {
        if (typeof item === 'object' && item !== null) {
          Object.keys(item).forEach(key => {
            if (key !== '@attributes') allKeys.add(key);
          });
        }
      });

      const headers = Array.from(allKeys);
      let csv = headers.map(h => this.escapeCsvValue(h)).join(',') + '\n';
      
      dataArray.forEach((item: any) => {
        const row = headers.map(header => {
          const value = item[header];
          if (value === undefined || value === null) {
            return '';
          }
          if (typeof value === 'object') {
            return this.escapeCsvValue(JSON.stringify(value));
          }
          return this.escapeCsvValue(String(value));
        });
        csv += row.join(',') + '\n';
      });

      this.aceOutputEditor.setValue(csv, -1);
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

  private escapeCsvValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return '"' + value.replace(/"/g, '""') + '"';
    }
    return value;
  }

  loadSampleXml() {
    const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<users>
  <user>
    <name>John Doe</name>
    <email>john@example.com</email>
    <age>30</age>
    <city>New York</city>
  </user>
  <user>
    <name>Jane Smith</name>
    <email>jane@example.com</email>
    <age>28</age>
    <city>Los Angeles</city>
  </user>
  <user>
    <name>Bob Johnson</name>
    <email>bob@example.com</email>
    <age>35</age>
    <city>Chicago</city>
  </user>
</users>`;

    this.aceInputEditor.setValue(sampleXml, -1);
    this.aceInputEditor.clearSelection();
    this.convertXmlToCsv();
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
        this.convertXmlToCsv();
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
    this.convertXmlToCsv();
  }

  copyToClipboard(): void {
    const outputContent = this.aceOutputEditor.getValue();
    if (!outputContent || outputContent.trim() === '' || outputContent.startsWith('Invalid XML') || outputContent.startsWith('Error:')) {
      this.copyErrorMessage = 'Nothing to copy';
      this.copyErrorVisible = true;
      setTimeout(() => {
        this.copyErrorVisible = false;
      }, 3000);
      return;
    }
    
    navigator.clipboard.writeText(outputContent).then(() => {
      this.copySuccessMessage = 'CSV copied to clipboard!';
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

  downloadCsv(): void {
    const outputContent = this.aceOutputEditor.getValue();
    if (!outputContent || outputContent.trim() === '' || outputContent.startsWith('Invalid XML') || outputContent.startsWith('Error:')) {
      this.copyErrorMessage = 'Nothing to download';
      this.copyErrorVisible = true;
      setTimeout(() => {
        this.copyErrorVisible = false;
      }, 3000);
      return;
    }
    
    const blob = new Blob([outputContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'converted.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    this.copySuccessMessage = 'CSV downloaded successfully!';
    this.copySuccessVisible = true;
    setTimeout(() => {
      this.copySuccessVisible = false;
    }, 3000);
  }
}

