import { Component, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';

declare var ace: any;

@Component({
  selector: 'app-xml-to-json',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './xml-to-json.component.html',
  styleUrl: './xml-to-json.component.css'
})
export class XmlToJsonComponent implements AfterViewInit {
  @ViewChild('inputEditor') private inputEditor!: ElementRef<HTMLElement>;
  @ViewChild('outputEditor') private outputEditor!: ElementRef<HTMLElement>;

  private aceInputEditor: any;
  private aceOutputEditor: any;

  errorMessage = '';
  successMessage = '';
  showConfig = false;
  compact = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private titleService: Title, 
    private metaService: Meta
  ) {
    this.titleService.setTitle('XML to JSON Converter - Convert XML to JSON Online');
    this.metaService.updateTag({
      name: 'description',
      content: 'Convert XML to JSON format online. Free XML to JSON converter with custom formatting options.'
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
    this.aceInputEditor.session.setMode('ace/mode/xml');
    this.aceInputEditor.setOptions({
      fontSize: '14px',
      showPrintMargin: false,
      highlightActiveLine: true,
      wrap: true
    });

    // Auto-convert on input change
    this.aceInputEditor.session.on('change', () => {
      this.convertXmlToJson();
    });

    this.aceOutputEditor = ace.edit(this.outputEditor.nativeElement);
    this.aceOutputEditor.setTheme('ace/theme/github');
    this.aceOutputEditor.session.setMode('ace/mode/json');
    this.aceOutputEditor.setOptions({
      fontSize: '14px',
      showPrintMargin: false,
      highlightActiveLine: true,
      wrap: true,
      readOnly: true
    });

    this.loadSampleXml();
  }

  loadSampleXml() {
    const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <person id="1">
    <name>John Doe</name>
    <age>30</age>
    <email>john@example.com</email>
  </person>
  <person id="2">
    <name>Jane Smith</name>
    <age>25</age>
    <email>jane@example.com</email>
  </person>
</root>`;
    
    this.aceInputEditor.setValue(sampleXml, -1);
    this.aceInputEditor.clearSelection();
    this.convertXmlToJson();
  }

  convertXmlToJson() {
    try {
      this.errorMessage = '';
      this.successMessage = '';

      const xmlContent = this.aceInputEditor.getValue().trim();
      
      if (!xmlContent) {
        this.aceOutputEditor.setValue('');
        return;
      }

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
      
      // Check for parsing errors
      const parserError = xmlDoc.getElementsByTagName('parsererror');
      if (parserError.length > 0) {
        throw new Error('Invalid XML syntax');
      }

      const jsonObj = this.xmlToJson(xmlDoc);
      const jsonString = JSON.stringify(jsonObj, null, this.compact ? 0 : 2);
      
      this.aceOutputEditor.setValue(jsonString, -1);
      this.aceOutputEditor.clearSelection();
      this.successMessage = 'Converted successfully!';
    } catch (error: any) {
      this.errorMessage = 'Error converting XML: ' + error.message;
      this.aceOutputEditor.setValue('');
    }
  }

  private xmlToJson(xml: any): any {
    let obj: any = {};

    if (xml.nodeType === 1) { // element
      // Attributes
      if (xml.attributes.length > 0) {
        obj['@attributes'] = {};
        for (let j = 0; j < xml.attributes.length; j++) {
          const attribute = xml.attributes.item(j);
          obj['@attributes'][attribute!.nodeName] = attribute!.nodeValue;
        }
      }
    } else if (xml.nodeType === 3) { // text
      const text = xml.nodeValue?.trim();
      return text || null;
    }

    // Children
    if (xml.hasChildNodes()) {
      let textContent = '';
      let hasElementChildren = false;

      for (let i = 0; i < xml.childNodes.length; i++) {
        const item = xml.childNodes.item(i);
        const nodeName = item!.nodeName;

        if (item!.nodeType === 3) { // text node
          textContent += item!.nodeValue || '';
        } else if (item!.nodeType === 1) { // element node
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

      // If only text content and no element children
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

  downloadJson() {
    const content = this.aceOutputEditor.getValue();
    if (!content) {
      this.errorMessage = 'No output to download';
      return;
    }

    const blob = new Blob([content], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted.json';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  copyJson() {
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

