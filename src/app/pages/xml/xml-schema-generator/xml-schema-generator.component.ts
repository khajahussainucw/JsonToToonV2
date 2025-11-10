import { Component, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';

declare const ace: any;

@Component({
  selector: 'app-xml-schema-generator',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './xml-schema-generator.component.html',
  styleUrl: './xml-schema-generator.component.css'
})
export class XmlSchemaGeneratorComponent implements AfterViewInit {
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
    this.title.setTitle('XML Schema Generator - Generate XSD from XML Online');
    this.meta.updateTag({
      name: 'description',
      content: 'Generate XML Schema (XSD) from XML documents. Fast and reliable XML Schema generator tool.'
    });
    this.meta.updateTag({
      name: 'keywords',
      content: 'xml schema generator, xsd generator, generate xsd from xml, xml schema'
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

    this.aceInputEditor.session.on('change', () => {
      this.debouncedGenerate();
    });

    setTimeout(() => {
      this.aceInputEditor.resize(true);
      this.aceOutputEditor.resize(true);
    }, 100);
  }

  private debouncedGenerate() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.generateSchema();
    }, 300);
  }

  private generateSchema() {
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

      const xsd = this.generateXSD(xmlDoc);
      this.aceOutputEditor.setValue(xsd, -1);
      this.aceOutputEditor.clearSelection();
    }
    catch (error: any) {
      this.aceOutputEditor.setValue('Error: ' + error.message, -1);
      this.aceOutputEditor.clearSelection();
    }
  }

  private generateXSD(doc: Document): string {
    const rootElement = doc.documentElement;
    if (!rootElement) {
      return '<?xml version="1.0" encoding="UTF-8"?>\n<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">\n</xs:schema>';
    }

    let xsd = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xsd += '<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">\n';
    xsd += this.generateElement(rootElement, '  ');
    xsd += '</xs:schema>';
    
    return xsd;
  }

  private generateElement(element: Element, indent: string): string {
    const tagName = element.tagName;
    let xsd = indent + `<xs:element name="${tagName}">\n`;
    xsd += indent + '  <xs:complexType>\n';
    
    if (element.hasChildNodes()) {
      const hasElementChildren = Array.from(element.childNodes).some(n => n.nodeType === Node.ELEMENT_NODE);
      if (hasElementChildren) {
        xsd += indent + '    <xs:sequence>\n';
        const processedChildren = new Set<string>();
        for (const child of Array.from(element.childNodes)) {
          if (child.nodeType === Node.ELEMENT_NODE) {
            const childElement = child as Element;
            const childTag = childElement.tagName;
            if (!processedChildren.has(childTag)) {
              processedChildren.add(childTag);
              xsd += indent + `      <xs:element name="${childTag}" type="${childTag}Type"/>\n`;
            }
          }
        }
        xsd += indent + '    </xs:sequence>\n';
        
        // Generate child element types
        for (const child of Array.from(element.childNodes)) {
          if (child.nodeType === Node.ELEMENT_NODE) {
            const childElement = child as Element;
            const childTag = childElement.tagName;
            if (!processedChildren.has(childTag + 'Type')) {
              processedChildren.add(childTag + 'Type');
              xsd += this.generateElement(childElement, indent);
            }
          }
        }
      } else {
        xsd += indent + '    <xs:simpleContent>\n';
        xsd += indent + '      <xs:extension base="xs:string"/>\n';
        xsd += indent + '    </xs:simpleContent>\n';
      }
    }
    
    if (element.attributes.length > 0) {
      xsd += indent + '    <xs:attribute name="';
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        xsd += attr.name + '" type="xs:string"/>\n';
        if (i < element.attributes.length - 1) {
          xsd += indent + '    <xs:attribute name="';
        }
      }
    }
    
    xsd += indent + '  </xs:complexType>\n';
    xsd += indent + '</xs:element>\n';
    
    return xsd;
  }

  loadSampleXml() {
    const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <person id="1">
    <name>John Doe</name>
    <age>30</age>
  </person>
</root>`;

    this.aceInputEditor.setValue(sampleXml, -1);
    this.aceInputEditor.clearSelection();
    this.generateSchema();
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
        this.generateSchema();
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
    this.generateSchema();
  }

  copyToClipboard(): void {
    const outputContent = this.aceOutputEditor.getValue();
    if (!outputContent || outputContent.trim() === '' || outputContent.startsWith('Error:')) {
      this.copyErrorMessage = 'Nothing to copy';
      this.copyErrorVisible = true;
      setTimeout(() => {
        this.copyErrorVisible = false;
      }, 3000);
      return;
    }
    
    navigator.clipboard.writeText(outputContent).then(() => {
      this.copySuccessMessage = 'XSD copied to clipboard!';
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

  downloadXsd(): void {
    const outputContent = this.aceOutputEditor.getValue();
    if (!outputContent || outputContent.trim() === '' || outputContent.startsWith('Error:')) {
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
    link.download = 'schema.xsd';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    this.copySuccessMessage = 'XSD downloaded successfully!';
    this.copySuccessVisible = true;
    setTimeout(() => {
      this.copySuccessVisible = false;
    }, 3000);
  }
}

