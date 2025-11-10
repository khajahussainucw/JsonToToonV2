import { Component, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';

declare var ace: any;

@Component({
  selector: 'app-json-to-xml',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './json-to-xml.component.html',
  styleUrl: './json-to-xml.component.css'
})
export class JsonToXmlComponent implements AfterViewInit {
  @ViewChild('inputEditor') private inputEditor!: ElementRef<HTMLElement>;
  @ViewChild('outputEditor') private outputEditor!: ElementRef<HTMLElement>;

  private aceInputEditor: any;
  private aceOutputEditor: any;

  errorMessage = '';
  successMessage = '';
  showConfig = false;
  rootElement = 'root';
  includeDeclaration = true;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private titleService: Title, 
    private metaService: Meta
  ) {
    this.titleService.setTitle('JSON to XML Converter - Convert JSON to XML Online');
    this.metaService.updateTag({
      name: 'description',
      content: 'Convert JSON to XML format online. Free JSON to XML converter with custom formatting options.'
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
    this.aceInputEditor.session.setMode('ace/mode/json');
    this.aceInputEditor.setOptions({
      fontSize: '14px',
      showPrintMargin: false,
      highlightActiveLine: true,
      wrap: true
    });

    // Auto-convert on input change
    this.aceInputEditor.session.on('change', () => {
      this.convertJsonToXml();
    });

    this.aceOutputEditor = ace.edit(this.outputEditor.nativeElement);
    this.aceOutputEditor.setTheme('ace/theme/github');
    this.aceOutputEditor.session.setMode('ace/mode/xml');
    this.aceOutputEditor.setOptions({
      fontSize: '14px',
      showPrintMargin: false,
      highlightActiveLine: true,
      wrap: true,
      readOnly: true
    });

    this.loadSampleJson();
  }

  loadSampleJson() {
    const sampleJson = `{
  "person": [
    {
      "id": "1",
      "name": "John Doe",
      "age": 30,
      "email": "john@example.com"
    },
    {
      "id": "2",
      "name": "Jane Smith",
      "age": 25,
      "email": "jane@example.com"
    }
  ]
}`;
    
    this.aceInputEditor.setValue(sampleJson, -1);
    this.aceInputEditor.clearSelection();
    this.convertJsonToXml();
  }

  convertJsonToXml() {
    try {
      this.errorMessage = '';
      this.successMessage = '';

      const jsonContent = this.aceInputEditor.getValue().trim();
      
      if (!jsonContent) {
        this.aceOutputEditor.setValue('');
        return;
      }

      const jsonObj = JSON.parse(jsonContent);
      let xml = '';
      
      if (this.includeDeclaration) {
        xml += '<?xml version="1.0" encoding="UTF-8"?>\n';
      }
      
      xml += this.jsonToXml(jsonObj, this.rootElement, 0);
      
      this.aceOutputEditor.setValue(xml, -1);
      this.aceOutputEditor.clearSelection();
      this.successMessage = 'Converted successfully!';
    } catch (error: any) {
      this.errorMessage = 'Error converting JSON: ' + error.message;
      this.aceOutputEditor.setValue('');
    }
  }

  private jsonToXml(obj: any, name: string, indent: number): string {
    const indentStr = '  '.repeat(indent);
    let xml = '';

    if (obj === null || obj === undefined) {
      xml += `${indentStr}<${name} />\n`;
    } else if (typeof obj === 'object') {
      if (Array.isArray(obj)) {
        obj.forEach(item => {
          xml += this.jsonToXml(item, name, indent);
        });
      } else {
        xml += `${indentStr}<${name}>\n`;
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            xml += this.jsonToXml(obj[key], key, indent + 1);
          }
        }
        xml += `${indentStr}</${name}>\n`;
      }
    } else {
      const value = this.escapeXml(String(obj));
      xml += `${indentStr}<${name}>${value}</${name}>\n`;
    }

    return xml;
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
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

  downloadXml() {
    const content = this.aceOutputEditor.getValue();
    if (!content) {
      this.errorMessage = 'No output to download';
      return;
    }

    const blob = new Blob([content], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted.xml';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  copyXml() {
    const content = this.aceOutputEditor.getValue();
    if (!content) {
      this.errorMessage = 'No output to copy';
      return;
    }

    navigator.clipboard.writeText(content).then(() => {
      this.successMessage = 'Copied to clipboard!';
      setTimeout(() => this.successMessage = '', 2000);
    });
  }

  clearInput() {
    this.aceInputEditor.setValue('');
    this.aceOutputEditor.setValue('');
    this.errorMessage = '';
    this.successMessage = '';
  }
}

