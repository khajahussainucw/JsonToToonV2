import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';

declare var ace: any;

@Component({
  selector: 'app-xml-formatter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './xml-formatter.component.html',
  styleUrl: './xml-formatter.component.css'
})
export class XmlFormatterComponent implements AfterViewInit {
  @ViewChild('inputEditor') private inputEditor!: ElementRef<HTMLElement>;
  @ViewChild('outputEditor') private outputEditor!: ElementRef<HTMLElement>;

  private aceInputEditor: any;
  private aceOutputEditor: any;

  errorMessage = '';
  copySuccessMessage = '';

  constructor(private titleService: Title, private metaService: Meta) {
    this.titleService.setTitle('XML Formatter - Beautify and Format XML Online');
    this.metaService.updateTag({
      name: 'description',
      content: 'Format, beautify and validate your XML data with proper indentation. Free online XML formatter tool.'
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

    // Auto-format on input change
    this.aceInputEditor.session.on('change', () => {
      this.formatXml();
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
    const sampleXml = `<?xml version="1.0" encoding="UTF-8"?><root><person id="1"><name>John Doe</name><age>30</age><email>john@example.com</email></person><person id="2"><name>Jane Smith</name><age>25</age><email>jane@example.com</email></person></root>`;
    
    this.aceInputEditor.setValue(sampleXml, -1);
    this.aceInputEditor.clearSelection();
    this.formatXml();
  }

  formatXml() {
    try {
      this.errorMessage = '';
      const xmlContent = this.aceInputEditor.getValue().trim();
      
      if (!xmlContent) {
        this.aceOutputEditor.setValue('');
        return;
      }

      const formatted = this.beautifyXml(xmlContent, '  ');
      this.aceOutputEditor.setValue(formatted, -1);
      this.aceOutputEditor.clearSelection();
    } catch (error: any) {
      this.errorMessage = 'Invalid XML: ' + error.message;
      this.aceOutputEditor.setValue('');
    }
  }

  private beautifyXml(xml: string, indent: string = '  '): string {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, 'text/xml');
    
    // Check for parsing errors
    const parserError = xmlDoc.getElementsByTagName('parsererror');
    if (parserError.length > 0) {
      throw new Error('Invalid XML syntax');
    }

    return this.formatXmlNode(xmlDoc, '', indent);
  }

  private formatXmlNode(node: any, indent: string, indentStr: string): string {
    let formatted = '';
    
    if (node.nodeType === Node.DOCUMENT_NODE) {
      // Handle document node
      if (node.childNodes && node.childNodes.length > 0) {
        for (let i = 0; i < node.childNodes.length; i++) {
          formatted += this.formatXmlNode(node.childNodes[i], indent, indentStr);
        }
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // Handle element node
      formatted += indent + '<' + node.nodeName;
      
      // Add attributes
      if (node.attributes && node.attributes.length > 0) {
        for (let i = 0; i < node.attributes.length; i++) {
          const attr = node.attributes[i];
          formatted += ' ' + attr.name + '="' + attr.value + '"';
        }
      }
      
      if (node.childNodes && node.childNodes.length > 0) {
        const hasElementChildren = Array.from(node.childNodes).some((child: any) => child.nodeType === Node.ELEMENT_NODE);
        
        if (hasElementChildren) {
          formatted += '>\n';
          for (let i = 0; i < node.childNodes.length; i++) {
            formatted += this.formatXmlNode(node.childNodes[i], indent + indentStr, indentStr);
          }
          formatted += indent + '</' + node.nodeName + '>\n';
        } else {
          // Text-only content
          formatted += '>';
          for (let i = 0; i < node.childNodes.length; i++) {
            if (node.childNodes[i].nodeType === Node.TEXT_NODE) {
              formatted += node.childNodes[i].nodeValue?.trim() || '';
            }
          }
          formatted += '</' + node.nodeName + '>\n';
        }
      } else {
        formatted += ' />\n';
      }
    } else if (node.nodeType === Node.PROCESSING_INSTRUCTION_NODE) {
      formatted += indent + '<?' + node.nodeName + ' ' + node.nodeValue + '?>\n';
    } else if (node.nodeType === Node.COMMENT_NODE) {
      formatted += indent + '<!--' + node.nodeValue + '-->\n';
    }
    
    return formatted;
  }

  minifyXml() {
    try {
      this.errorMessage = '';
      const xmlContent = this.aceInputEditor.getValue().trim();
      
      if (!xmlContent) {
        return;
      }

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
      
      const parserError = xmlDoc.getElementsByTagName('parsererror');
      if (parserError.length > 0) {
        this.errorMessage = 'Invalid XML syntax';
        return;
      }

      const serializer = new XMLSerializer();
      const minified = serializer.serializeToString(xmlDoc);
      
      this.aceOutputEditor.setValue(minified, -1);
      this.aceOutputEditor.clearSelection();
    } catch (error: any) {
      this.errorMessage = 'Error minifying XML: ' + error.message;
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
    a.download = 'formatted.xml';
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

