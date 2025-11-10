import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

declare const ace: any;

@Component({
  selector: 'app-xml-to-typescript',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './xml-to-typescript.component.html',
  styleUrl: './xml-to-typescript.component.css'
})
export class XmlToTypescriptComponent implements AfterViewInit {
  @ViewChild('inputEditor') private inputEditor!: ElementRef<HTMLElement>;
  @ViewChild('outputEditor') private outputEditor!: ElementRef<HTMLElement>;
  @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;

  private aceInputEditor: any;
  private aceOutputEditor: any;
  private isMobile = false;
  private debounceTimer: any;
  
  interfaceName: string = 'RootObject';
  useInterfaces: boolean = true;
  useOptionalTypes: boolean = true;
  
  // Modal dialog state
  errorModalVisible = false;
  errorMessage = '';
  // Copy success message state
  copySuccessVisible = false;
  copySuccessMessage = '';
  // Copy error message state
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
    this.title.setTitle('XML to TypeScript Converter - Generate TypeScript Interfaces from XML');
    this.meta.updateTag({
      name: 'description',
      content: 'Convert XML to TypeScript interfaces online. Generate TypeScript types from XML data instantly for Angular, React, and Node.js development.'
    });
    this.meta.updateTag({
      name: 'keywords',
      content: 'xml to typescript, xml to ts, xml to interface, typescript interface generator, xml to type, typescript code generator, xml parser'
    });
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.initializeEditors();
        this.checkMobileView();

        window.addEventListener('resize', () => {
          this.checkMobileView();
          if (this.aceInputEditor) {
            this.aceInputEditor.resize();
          }
          if (this.aceOutputEditor) {
            this.aceOutputEditor.resize();
          }
        });
      }, 100);
    }
  }

  private initializeEditors() {
    if (typeof window === 'undefined' || typeof ace === 'undefined') {
      console.error('Ace editor is not loaded');
      return;
    }

    // Initialize input editor for XML
    this.aceInputEditor = ace.edit(this.inputEditor.nativeElement);
    this.aceInputEditor.setTheme('ace/theme/github');
    this.aceInputEditor.session.setMode('ace/mode/xml');
    this.aceInputEditor.setOptions({
      useWrapMode: true,
      fontSize: '14px',
      showPrintMargin: false,
    });
    this.aceInputEditor.getSession().setUseWrapMode(true);

    // Initialize output editor for TypeScript
    this.aceOutputEditor = ace.edit(this.outputEditor.nativeElement);
    this.aceOutputEditor.setTheme('ace/theme/github');
    this.aceOutputEditor.session.setMode('ace/mode/typescript');
    this.aceOutputEditor.setOptions({
      useWrapMode: true,
      fontSize: '14px',
      showPrintMargin: false,
      readOnly: true
    });
    this.aceOutputEditor.getSession().setUseWrapMode(true);

    // Add change listener to input editor
    this.aceInputEditor.session.on('change', () => {
      this.debouncedConvert();
    });

    // Force resize after initialization
    setTimeout(() => {
      this.aceInputEditor.resize(true);
      this.aceOutputEditor.resize(true);
    }, 100);
  }

  private debouncedConvert() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.convertXmlToTypescript();
    }, 300);
  }

  onInterfaceNameChange() {
    this.convertXmlToTypescript();
  }

  onUseInterfacesChange() {
    this.convertXmlToTypescript();
  }

  onUseOptionalTypesChange() {
    this.convertXmlToTypescript();
  }

  private convertXmlToTypescript() {
    try {
      const inputXml = this.aceInputEditor.getValue().trim();
      if (!inputXml) {
        this.aceOutputEditor.setValue('');
        return;
      }

      // Parse XML to JSON-like structure
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(inputXml, 'text/xml');
      
      // Check for parsing errors
      const parserError = xmlDoc.getElementsByTagName('parsererror');
      if (parserError.length > 0) {
        throw new Error('Invalid XML syntax');
      }

      if (!xmlDoc.documentElement) {
        throw new Error('XML must have a root element');
      }

      // Convert XML to JSON-like structure
      const jsonObj = this.xmlToJson(xmlDoc.documentElement);
      
      // Generate TypeScript from JSON structure
      const typescript = this.generateTypescript(jsonObj, this.interfaceName);
      
      this.aceOutputEditor.setValue(typescript, -1);
      this.aceOutputEditor.clearSelection();
    }
    catch (error: any) {
      this.aceOutputEditor.setValue('Invalid XML: ' + error.message, -1);
      this.aceOutputEditor.clearSelection();
      return;
    }
  }

  private xmlToJson(xml: any): any {
    if (!xml) {
      return null;
    }

    let obj: any = {};

    if (xml.nodeType === 1) {
      if (xml.attributes && xml.attributes.length > 0) {
        obj['@attributes'] = {};
        for (let j = 0; j < xml.attributes.length; j++) {
          const attribute = xml.attributes.item(j);
          if (attribute) {
            obj['@attributes'][attribute.nodeName] = attribute.nodeValue || '';
          }
        }
      }
    } 
    else if (xml.nodeType === 3) {
      const text = xml.nodeValue?.trim();
      return text || null;
    }
    else if (xml.nodeType === 4) {
      return xml.nodeValue || '';
    }
    else if (xml.nodeType === 8 || xml.nodeType === 7) {
      return null;
    }

    if (xml.hasChildNodes && xml.hasChildNodes()) {
      let textContent = '';
      let hasElementChildren = false;
      const childNodes = xml.childNodes;

      for (let i = 0; i < childNodes.length; i++) {
        const item = childNodes.item(i);
        if (!item) continue;

        const nodeType = item.nodeType;
        const nodeName = item.nodeName;

        if (nodeType === 3) {
          textContent += item.nodeValue || '';
        }
        else if (nodeType === 4) {
          textContent += item.nodeValue || '';
        }
        else if (nodeType === 1) {
          hasElementChildren = true;
          
          const childJson = this.xmlToJson(item);
          if (childJson === null) {
            continue;
          }
          
          if (typeof obj[nodeName] === 'undefined') {
            obj[nodeName] = childJson;
          } else {
            if (!Array.isArray(obj[nodeName])) {
              const old = obj[nodeName];
              obj[nodeName] = [old];
            }
            obj[nodeName].push(childJson);
          }
        }
      }

      const trimmedText = textContent.trim();
      if (!hasElementChildren && trimmedText) {
        if (Object.keys(obj).length === 0 || (Object.keys(obj).length === 1 && obj['@attributes'])) {
          if (obj['@attributes']) {
            obj['#text'] = trimmedText;
          } else {
            return trimmedText;
          }
        } else {
          obj['#text'] = trimmedText;
        }
      } else if (!hasElementChildren && !trimmedText) {
        if (Object.keys(obj).length === 0) {
          return null;
        } else if (Object.keys(obj).length === 1 && obj['@attributes']) {
          return obj;
        }
      }
    }

    return Object.keys(obj).length > 0 ? obj : null;
  }

  private generateTypescript(obj: any, interfaceName: string): string {
    const interfaces: string[] = [];
    const usedInterfaceNames = new Set<string>();
    
    const generateInterface = (value: any, interfaceName: string, indent: string = ''): string => {
      if (usedInterfaceNames.has(interfaceName)) {
        let counter = 1;
        let newInterfaceName = interfaceName + counter;
        while (usedInterfaceNames.has(newInterfaceName)) {
          counter++;
          newInterfaceName = interfaceName + counter;
        }
        interfaceName = newInterfaceName;
      }
      usedInterfaceNames.add(interfaceName);

      if (Array.isArray(value)) {
        if (value.length === 0) {
          return 'any[]';
        }
        const firstItem = value[0];
        if (typeof firstItem === 'object' && firstItem !== null) {
          const itemInterfaceName = this.singularize(interfaceName) + 'Item';
          generateInterface(firstItem, itemInterfaceName, indent);
          return `${itemInterfaceName}[]`;
        }
        const itemType = this.getTypescriptType(firstItem);
        return `${itemType}[]`;
      }
      
      if (typeof value !== 'object' || value === null) {
        return this.getTypescriptType(value);
      }
      
      const properties: string[] = [];
      
      if (value['@attributes']) {
        for (const attrKey in value['@attributes']) {
          const attrValue = value['@attributes'][attrKey];
          const propType = this.getTypescriptType(attrValue);
          const optional = this.useOptionalTypes ? '?' : '';
          const propName = this.camelCase(attrKey);
          properties.push(`${indent}  ${propName}${optional}: ${propType};`);
        }
      }
      
      if (value['#text'] !== undefined) {
        const propType = this.getTypescriptType(value['#text']);
        const optional = this.useOptionalTypes ? '?' : '';
        properties.push(`${indent}  text${optional}: ${propType};`);
      }
      
      for (const key in value) {
        if (key === '@attributes' || key === '#text') {
          continue;
        }
        
        const propValue = value[key];
        let propType: string;
        
        if (propValue === null) {
          propType = this.useOptionalTypes ? 'any' : 'any';
        } else if (Array.isArray(propValue)) {
          if (propValue.length === 0) {
            propType = 'any[]';
          } else {
            const firstItem = propValue[0];
            if (typeof firstItem === 'object' && firstItem !== null) {
              const childInterfaceName = this.pascalCase(key);
              generateInterface(firstItem, childInterfaceName, indent);
              propType = `${childInterfaceName}[]`;
            } else {
              const itemType = this.getTypescriptType(firstItem);
              propType = `${itemType}[]`;
            }
          }
        } else if (typeof propValue === 'object') {
          const childInterfaceName = this.pascalCase(key);
          generateInterface(propValue, childInterfaceName, indent);
          propType = childInterfaceName;
        } else {
          propType = this.getTypescriptType(propValue);
        }
        
        const optional = (propValue === null && this.useOptionalTypes) ? '?' : '';
        const propName = this.camelCase(key);
        properties.push(`${indent}  ${propName}${optional}: ${propType};`);
      }
      
      const keyword = this.useInterfaces ? 'interface' : 'type';
      const separator = this.useInterfaces ? '' : ' =';
      const interfaceStr = `${indent}export ${keyword} ${interfaceName}${separator} {\n${properties.join('\n')}\n${indent}}`;
      interfaces.push(interfaceStr);
      
      return interfaceName;
    };
    
    generateInterface(obj, interfaceName);
    
    return interfaces.reverse().join('\n\n');
  }

  private getTypescriptType(value: any): string {
    if (value === null) {
      return 'any';
    }
    
    const type = typeof value;
    switch (type) {
      case 'string':
        return 'string';
      case 'number':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'object':
        return 'any';
      default:
        return 'any';
    }
  }

  private pascalCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
  }

  private camelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1).replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
  }

  private singularize(str: string): string {
    if (str.endsWith('s') && str.length > 1) {
      return str.slice(0, -1);
    }
    return str;
  }

  loadSampleXml() {
    const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<user id="1" active="true">
  <name>John Doe</name>
  <age>30</age>
  <email>john@example.com</email>
  <address>
    <street>123 Main St</street>
    <city>New York</city>
    <zipCode>10001</zipCode>
  </address>
  <phoneNumbers>
    <phone type="home">555-1234</phone>
    <phone type="work">555-5678</phone>
  </phoneNumbers>
  <hobbies>
    <hobby>reading</hobby>
    <hobby>gaming</hobby>
    <hobby>hiking</hobby>
  </hobbies>
</user>`;

    this.aceInputEditor.setValue(sampleXml, -1);
    this.aceInputEditor.clearSelection();
    this.convertXmlToTypescript();
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
      this.aceInputEditor.setValue(content, -1);
      this.aceInputEditor.clearSelection();
      this.convertXmlToTypescript();
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
    this.convertXmlToTypescript();
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
      this.copySuccessMessage = 'TypeScript code copied to clipboard!';
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

  downloadTypescript(): void {
    const outputContent = this.aceOutputEditor.getValue();
    if (!outputContent || outputContent.trim() === '' || outputContent.startsWith('Invalid XML')) {
      this.copyErrorMessage = 'Nothing to download';
      this.copyErrorVisible = true;
      setTimeout(() => {
        this.copyErrorVisible = false;
      }, 3000);
      return;
    }
    
    const blob = new Blob([outputContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.interfaceName}.ts`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    this.copySuccessMessage = 'TypeScript file downloaded successfully!';
    this.copySuccessVisible = true;
    setTimeout(() => {
      this.copySuccessVisible = false;
    }, 3000);
  }

  private checkMobileView() {
    this.isMobile = window.innerWidth <= 768;
  }
}

