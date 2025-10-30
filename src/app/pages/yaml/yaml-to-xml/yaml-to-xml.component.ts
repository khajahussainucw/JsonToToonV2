import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import * as yaml from 'js-yaml';

declare const ace: any;

@Component({
  selector: 'app-yaml-to-xml',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './yaml-to-xml.component.html',
  styleUrl: './yaml-to-xml.component.css'
})
export class YamlToXmlComponent implements AfterViewInit {
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
    this.title.setTitle('YAML to XML Converter - Convert YAML to XML Online');
    this.meta.updateTag({
      name: 'description',
      content: 'Convert YAML to XML online with our fast and reliable YAML to XML converter tool. Perfect for developers working with configuration files and data transformation.'
    });
    this.meta.updateTag({
      name: 'keywords',
      content: 'yaml to xml, yaml converter, convert yaml to xml, yaml to xml online, yml to xml'
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
    if (typeof ace === 'undefined') {
      console.error('Ace editor is not loaded');
      return;
    }

    this.aceInputEditor = ace.edit(this.inputEditor.nativeElement);
    this.aceInputEditor.setTheme('ace/theme/github');
    this.aceInputEditor.session.setMode('ace/mode/yaml');
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
      this.convertYamlToXml();
    }, 300);
  }

  private convertYamlToXml() {
    try {
      const inputYaml = this.aceInputEditor.getValue().trim();
      if (!inputYaml) {
        this.aceOutputEditor.setValue('');
        return;
      }

      const parsedYaml = yaml.load(inputYaml);
      const xmlString = this.jsonToXml(parsedYaml, 'root');
      const formattedXml = this.formatXml(xmlString);
      
      this.aceOutputEditor.setValue(formattedXml, -1);
      this.aceOutputEditor.clearSelection();
    }
    catch (error: any) {
      this.aceOutputEditor.setValue('Invalid YAML: ' + error.message, -1);
      this.aceOutputEditor.clearSelection();
    }
  }

  private jsonToXml(obj: any, rootName: string = 'root'): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += this.objectToXml(obj, rootName);
    return xml;
  }

  private objectToXml(obj: any, nodeName: string): string {
    if (obj === null || obj === undefined) {
      return `<${nodeName}/>`;
    }

    if (typeof obj !== 'object') {
      const escaped = this.escapeXml(String(obj));
      return `<${nodeName}>${escaped}</${nodeName}>`;
    }

    if (Array.isArray(obj)) {
      let xml = '';
      obj.forEach((item, index) => {
        xml += this.objectToXml(item, nodeName);
      });
      return xml;
    }

    let xml = `<${nodeName}>`;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        xml += this.objectToXml(obj[key], key);
      }
    }
    xml += `</${nodeName}>`;
    return xml;
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private formatXml(xml: string): string {
    const PADDING = '  ';
    const reg = /(>)(<)(\/*)/g;
    let pad = 0;
    
    xml = xml.replace(reg, '$1\n$2$3');
    
    return xml.split('\n').map((node) => {
      let indent = 0;
      if (node.match(/.+<\/\w[^>]*>$/)) {
        indent = 0;
      } else if (node.match(/^<\/\w/) && pad > 0) {
        pad -= 1;
      } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
        indent = 1;
      } else {
        indent = 0;
      }
      
      const padding = PADDING.repeat(pad);
      pad += indent;
      
      return padding + node;
    }).join('\n');
  }

  loadSampleYaml() {
    const sampleYaml = `# Sample YAML Configuration
server:
  host: localhost
  port: 8080
  ssl: true
  
database:
  connection:
    host: db.example.com
    port: 5432
    username: admin
  pool:
    min: 5
    max: 20
    
users:
  - name: John Doe
    email: john@example.com
    role: admin
  - name: Jane Smith
    email: jane@example.com
    role: user`;

    this.aceInputEditor.setValue(sampleYaml, -1);
    this.aceInputEditor.clearSelection();
    this.convertYamlToXml();
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
        yaml.load(content);
        this.aceInputEditor.setValue(content, -1);
        this.aceInputEditor.clearSelection();
        this.convertYamlToXml();
      } catch (error: any) {
        this.showErrorModal('Please upload a valid YAML document.');
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
    this.convertYamlToXml();
  }

  copyToClipboard(): void {
    const outputContent = this.aceOutputEditor.getValue();
    if (!outputContent || outputContent.trim() === '' || outputContent.startsWith('Invalid YAML')) {
      this.copyErrorMessage = 'Nothing to copy';
      this.copyErrorVisible = true;
      setTimeout(() => {
        this.copyErrorVisible = false;
      }, 3000);
      return;
    }
    
    navigator.clipboard.writeText(outputContent).then(() => {
      this.copySuccessMessage = 'XML copied to clipboard!';
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

  downloadXml(): void {
    const outputContent = this.aceOutputEditor.getValue();
    if (!outputContent || outputContent.trim() === '' || outputContent.startsWith('Invalid YAML')) {
      this.copyErrorMessage = 'Nothing to download';
      this.copyErrorVisible = true;
      setTimeout(() => {
        this.copyErrorVisible = false;
      }, 3000);
      return;
    }
    
    const blob = new Blob([outputContent], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'converted.xml';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    this.copySuccessMessage = 'XML downloaded successfully!';
    this.copySuccessVisible = true;
    setTimeout(() => {
      this.copySuccessVisible = false;
    }, 3000);
  }
}

