import { Component, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';

declare var ace: any;

@Component({
  selector: 'app-xml-beautifier',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './xml-beautifier.component.html',
  styleUrl: './xml-beautifier.component.css'
})
export class XmlBeautifierComponent implements AfterViewInit {
  @ViewChild('inputEditor') private inputEditor!: ElementRef<HTMLElement>;
  @ViewChild('outputEditor') private outputEditor!: ElementRef<HTMLElement>;

  private aceInputEditor: any;
  private aceOutputEditor: any;
  indentSize = 2;

  errorMessage = '';
  copySuccessMessage = '';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private titleService: Title, 
    private metaService: Meta
  ) {
    this.titleService.setTitle('XML Beautifier - Beautify XML with Custom Options Online');
    this.metaService.updateTag({
      name: 'description',
      content: 'Beautify XML with customizable indentation options. Alternative XML formatting tool with more control.'
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

    this.aceInputEditor.session.on('change', () => {
      this.beautifyXml();
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
    const sampleXml = `<?xml version="1.0" encoding="UTF-8"?><root><person id="1"><name>John Doe</name><age>30</age></person></root>`;
    this.aceInputEditor.setValue(sampleXml, -1);
    this.aceInputEditor.clearSelection();
    this.beautifyXml();
  }

  beautifyXml() {
    try {
      this.errorMessage = '';
      const xmlContent = this.aceInputEditor.getValue().trim();
      
      if (!xmlContent) {
        this.aceOutputEditor.setValue('');
        return;
      }

      const indent = ' '.repeat(this.indentSize);
      const formatted = this.formatXml(xmlContent, indent);
      this.aceOutputEditor.setValue(formatted, -1);
      this.aceOutputEditor.clearSelection();
    } catch (error: any) {
      this.errorMessage = 'Invalid XML: ' + error.message;
      this.aceOutputEditor.setValue('');
    }
  }

  private formatXml(xml: string, indent: string = '  '): string {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, 'text/xml');
    
    const parserError = xmlDoc.getElementsByTagName('parsererror');
    if (parserError.length > 0) {
      throw new Error('Invalid XML syntax');
    }

    return this.formatXmlNode(xmlDoc, '', indent);
  }

  private formatXmlNode(node: any, indent: string, indentStr: string): string {
    let formatted = '';
    
    if (node.nodeType === Node.DOCUMENT_NODE) {
      if (node.childNodes && node.childNodes.length > 0) {
        for (let i = 0; i < node.childNodes.length; i++) {
          formatted += this.formatXmlNode(node.childNodes[i], indent, indentStr);
        }
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      formatted += indent + '<' + node.nodeName;
      
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

  onIndentChange() {
    this.beautifyXml();
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
    a.download = 'beautified.xml';
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

