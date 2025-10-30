import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';

declare var ace: any;

@Component({
  selector: 'app-xml-minifier',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './xml-minifier.component.html',
  styleUrl: './xml-minifier.component.css'
})
export class XmlMinifierComponent implements AfterViewInit {
  @ViewChild('inputEditor') private inputEditor!: ElementRef<HTMLElement>;
  @ViewChild('outputEditor') private outputEditor!: ElementRef<HTMLElement>;

  private aceInputEditor: any;
  private aceOutputEditor: any;

  errorMessage = '';
  copySuccessMessage = '';

  constructor(private titleService: Title, private metaService: Meta) {
    this.titleService.setTitle('XML Minifier - Minify XML Online');
    this.metaService.updateTag({
      name: 'description',
      content: 'Minify XML by removing whitespace and comments. Free online XML minifier tool.'
    });
  }

  ngAfterViewInit() {
    this.initializeEditor();
  }

  private initializeEditor() {
    this.aceInputEditor = ace.edit(this.inputEditor.nativeElement);
    this.aceInputEditor.setTheme('ace/theme/github');
    this.aceInputEditor.session.setMode('ace/mode/xml');
    this.aceInputEditor.setOptions({
      fontSize: '14px',
      showPrintMargin: false,
      highlightActiveLine: true,
      wrap: true
    });

    // Auto-minify on input change
    this.aceInputEditor.session.on('change', () => {
      this.minifyXml();
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

    this.loadSampleXml();
  }

  loadSampleXml() {
    const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Sample XML document -->
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
    this.minifyXml();
  }

  minifyXml() {
    try {
      this.errorMessage = '';
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

      const serializer = new XMLSerializer();
      let minified = serializer.serializeToString(xmlDoc);
      
      // Additional minification: remove whitespace between tags
      minified = minified.replace(/>\s+</g, '><');
      
      this.aceOutputEditor.setValue(minified, -1);
      this.aceOutputEditor.clearSelection();
    } catch (error: any) {
      this.errorMessage = 'Invalid XML: ' + error.message;
      this.aceOutputEditor.setValue('');
    }
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
    a.download = 'minified.xml';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  copyToClipboard() {
    const content = this.aceOutputEditor.getValue();
    if (!content) {
      this.errorMessage = 'No output to copy';
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
  }
}

