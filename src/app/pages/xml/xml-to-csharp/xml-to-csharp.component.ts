import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

declare const ace: any;

@Component({
  selector: 'app-xml-to-csharp',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './xml-to-csharp.component.html',
  styleUrl: './xml-to-csharp.component.css'
})
export class XmlToCsharpComponent implements AfterViewInit {
  @ViewChild('inputEditor') private inputEditor!: ElementRef<HTMLElement>;
  @ViewChild('outputEditor') private outputEditor!: ElementRef<HTMLElement>;
  @ViewChild('splitter') private splitter!: ElementRef<HTMLElement>;
  @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;

  private aceInputEditor: any;
  private aceOutputEditor: any;
  private isDragging = false;
  private leftPane: HTMLElement | null = null;
  private rightPane: HTMLElement | null = null;
  private initialX = 0;
  private initialLeftWidth = 0;
  private containerWidth = 0;
  private isMobile = false;
  private debounceTimer: any;
  
  className: string = 'RootObject';
  useProperties: boolean = true;
  useNullableTypes: boolean = true;
  
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
    this.title.setTitle('XML to C# Converter - Generate C# Classes from XML');
    this.meta.updateTag({
      name: 'description',
      content: 'Convert XML to C# classes online. Generate C# POCO classes from XML data instantly for .NET development.'
    });
    this.meta.updateTag({
      name: 'keywords',
      content: 'xml to csharp, xml to c#, xml to class, c# class generator, xml to poco, c# code generator, xml parser'
    });
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.initializeEditors();
        this.checkMobileView();
        this.initSplitter();

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

    // Initialize output editor for C#
    this.aceOutputEditor = ace.edit(this.outputEditor.nativeElement);
    this.aceOutputEditor.setTheme('ace/theme/github');
    this.aceOutputEditor.session.setMode('ace/mode/csharp');
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
      this.convertXmlToCsharp();
    }, 300);
  }

  onClassNameChange() {
    this.convertXmlToCsharp();
  }

  onUsePropertiesChange() {
    this.convertXmlToCsharp();
  }

  onUseNullableTypesChange() {
    this.convertXmlToCsharp();
  }

  private convertXmlToCsharp() {
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
      
      // Generate C# from JSON structure
      const csharp = this.generateCsharp(jsonObj, this.className);
      
      this.aceOutputEditor.setValue(csharp, -1);
      this.aceOutputEditor.clearSelection();
    }
    catch (error: any) {
      this.aceOutputEditor.setValue('Invalid XML: ' + error.message, -1);
      this.aceOutputEditor.clearSelection();
      return;
    }
  }

  private xmlToJson(xml: any): any {
    // Handle null or undefined
    if (!xml) {
      return null;
    }

    let obj: any = {};

    // Element node
    if (xml.nodeType === 1) {
      // Attributes
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
    // Text node
    else if (xml.nodeType === 3) {
      const text = xml.nodeValue?.trim();
      return text || null;
    }
    // CDATA node
    else if (xml.nodeType === 4) {
      return xml.nodeValue || '';
    }
    // Comment node - skip comments
    else if (xml.nodeType === 8) {
      return null;
    }
    // Processing instruction - skip
    else if (xml.nodeType === 7) {
      return null;
    }

    // Process children
    if (xml.hasChildNodes && xml.hasChildNodes()) {
      let textContent = '';
      let hasElementChildren = false;
      const childNodes = xml.childNodes;

      for (let i = 0; i < childNodes.length; i++) {
        const item = childNodes.item(i);
        if (!item) continue;

        const nodeType = item.nodeType;
        const nodeName = item.nodeName;

        // Text node
        if (nodeType === 3) {
          textContent += item.nodeValue || '';
        }
        // CDATA node
        else if (nodeType === 4) {
          textContent += item.nodeValue || '';
        }
        // Element node
        else if (nodeType === 1) {
          hasElementChildren = true;
          
          const childJson = this.xmlToJson(item);
          // Skip null values (comments, processing instructions)
          if (childJson === null) {
            continue;
          }
          
          if (typeof obj[nodeName] === 'undefined') {
            obj[nodeName] = childJson;
          } else {
            // Convert to array if multiple children with same name
            if (!Array.isArray(obj[nodeName])) {
              const old = obj[nodeName];
              obj[nodeName] = [old];
            }
            obj[nodeName].push(childJson);
          }
        }
        // Skip comments (nodeType === 8) and processing instructions (nodeType === 7)
      }

      // Handle text content
      const trimmedText = textContent.trim();
      if (!hasElementChildren && trimmedText) {
        // If no attributes and only text, return text directly
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
        // Empty element with no children
        if (Object.keys(obj).length === 0) {
          return null;
        } else if (Object.keys(obj).length === 1 && obj['@attributes']) {
          // Element with only attributes, no text
          return obj;
        }
      }
    }

    // Return empty object if nothing was processed
    return Object.keys(obj).length > 0 ? obj : null;
  }

  private generateCsharp(obj: any, className: string): string {
    const classes: string[] = [];
    const usedClassNames = new Set<string>();
    let needsXmlSerialization = false;
    
    const generateClass = (value: any, className: string, indent: string = ''): string => {
      // Prevent duplicate class names
      if (usedClassNames.has(className)) {
        let counter = 1;
        let newClassName = className + counter;
        while (usedClassNames.has(newClassName)) {
          counter++;
          newClassName = className + counter;
        }
        className = newClassName;
      }
      usedClassNames.add(className);

      if (Array.isArray(value)) {
        if (value.length === 0) {
          return 'List<object>';
        }
        const firstItem = value[0];
        if (typeof firstItem === 'object' && firstItem !== null) {
          const itemClassName = this.singularize(className) + 'Item';
          generateClass(firstItem, itemClassName, indent);
          return `List<${itemClassName}>`;
        }
        const itemType = this.getCsharpType(firstItem);
        return `List<${itemType}>`;
      }
      
      if (typeof value !== 'object' || value === null) {
        return this.getCsharpType(value);
      }
      
      const properties: string[] = [];
      
      // Handle XML attributes
      if (value['@attributes']) {
        needsXmlSerialization = true;
        for (const attrKey in value['@attributes']) {
          const attrValue = value['@attributes'][attrKey];
          const propType = this.getCsharpType(attrValue);
          const nullable = (this.useNullableTypes) ? '?' : '';
          const propName = this.pascalCase(attrKey);
          
          if (this.useProperties) {
            properties.push(`${indent}    [XmlAttribute("${attrKey}")]\n${indent}    public ${propType}${nullable} ${propName} { get; set; }`);
          } else {
            properties.push(`${indent}    [XmlAttribute("${attrKey}")]\n${indent}    public ${propType}${nullable} ${propName};`);
          }
        }
      }
      
      // Handle XML text content
      if (value['#text'] !== undefined) {
        needsXmlSerialization = true;
        const propType = this.getCsharpType(value['#text']);
        const nullable = (this.useNullableTypes) ? '?' : '';
        
        if (this.useProperties) {
          properties.push(`${indent}    [XmlText]\n${indent}    public ${propType}${nullable} Text { get; set; }`);
        } else {
          properties.push(`${indent}    [XmlText]\n${indent}    public ${propType}${nullable} Text;`);
        }
      }
      
      // Handle child elements
      for (const key in value) {
        if (key === '@attributes' || key === '#text') {
          continue;
        }
        
        const propValue = value[key];
        let propType: string;
        
        if (propValue === null) {
          propType = this.useNullableTypes ? 'object?' : 'object';
        } else if (Array.isArray(propValue)) {
          if (propValue.length === 0) {
            propType = 'List<object>';
          } else {
            const firstItem = propValue[0];
            if (typeof firstItem === 'object' && firstItem !== null) {
              const childClassName = this.pascalCase(key);
              generateClass(firstItem, childClassName, indent);
              propType = `List<${childClassName}>`;
            } else {
              const itemType = this.getCsharpType(firstItem);
              propType = `List<${itemType}>`;
            }
          }
        } else if (typeof propValue === 'object') {
          const childClassName = this.pascalCase(key);
          generateClass(propValue, childClassName, indent);
          propType = childClassName;
        } else {
          propType = this.getCsharpType(propValue);
        }
        
        const nullable = (propValue === null && this.useNullableTypes) ? '?' : '';
        const propName = this.pascalCase(key);
        
        needsXmlSerialization = true;
        if (this.useProperties) {
          properties.push(`${indent}    [XmlElement("${key}")]\n${indent}    public ${propType}${nullable} ${propName} { get; set; }`);
        } else {
          properties.push(`${indent}    [XmlElement("${key}")]\n${indent}    public ${propType}${nullable} ${propName};`);
        }
      }
      
      const classStr = `${indent}public class ${className}\n${indent}{\n${properties.join('\n')}\n${indent}}`;
      classes.push(classStr);
      
      return className;
    };
    
    generateClass(obj, className);
    
    const usingStatement = needsXmlSerialization ? 'using System.Xml.Serialization;\n\n' : '';
    return usingStatement + classes.reverse().join('\n\n');
  }

  private getCsharpType(value: any): string {
    if (value === null) {
      return this.useNullableTypes ? 'object?' : 'object';
    }
    
    const type = typeof value;
    switch (type) {
      case 'string':
        return 'string';
      case 'number':
        return Number.isInteger(value) ? 'int' : 'double';
      case 'boolean':
        return 'bool';
      case 'object':
        return 'object';
      default:
        return 'object';
    }
  }

  private pascalCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
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
    this.convertXmlToCsharp();
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
      this.convertXmlToCsharp();
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
    this.convertXmlToCsharp();
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
      this.copySuccessMessage = 'C# code copied to clipboard!';
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

  downloadCsharp(): void {
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
    link.download = `${this.className}.cs`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    this.copySuccessMessage = 'C# file downloaded successfully!';
    this.copySuccessVisible = true;
    setTimeout(() => {
      this.copySuccessVisible = false;
    }, 3000);
  }

  private checkMobileView() {
    this.isMobile = window.innerWidth <= 768;
    this.adjustLayoutForMobile();
  }

  private adjustLayoutForMobile() {
    if (!this.leftPane || !this.rightPane) return;

    if (this.isMobile) {
      this.leftPane.style.height = 'calc(50vh - 12px)';
      this.rightPane.style.height = 'calc(50vh - 12px)';
      this.leftPane.style.width = '100%';
      this.rightPane.style.width = '100%';
    } else {
      this.leftPane.style.height = '100%';
      this.rightPane.style.height = '100%';
      this.leftPane.style.flex = '0.5';
      this.rightPane.style.flex = '0.5';
    }
  }

  private initSplitter() {
    this.leftPane = document.querySelector('.input-container');
    this.rightPane = document.querySelector('.output-container');

    if (!this.leftPane || !this.rightPane || !this.splitter) {
      return;
    }

    if (!this.isMobile) {
      this.splitter.nativeElement.addEventListener('mousedown', this.startDrag.bind(this));
    }
  }

  private startDrag(e: MouseEvent) {
    if (!this.leftPane || !this.rightPane || this.isMobile) return;

    this.isDragging = true;
    this.initialX = e.clientX;

    const leftRect = this.leftPane.getBoundingClientRect();
    const containerRect = this.leftPane.parentElement?.getBoundingClientRect();

    this.initialLeftWidth = leftRect.width;
    this.containerWidth = containerRect?.width || 0;

    document.documentElement.classList.add('resize-cursor');
    this.splitter.nativeElement.classList.add('dragging');

    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('mouseup', this.onMouseUp.bind(this));
    document.addEventListener('selectstart', this.preventSelection);
  }

  private onMouseMove(e: MouseEvent) {
    if (!this.isDragging || !this.leftPane || !this.rightPane || this.isMobile) return;

    const deltaX = e.clientX - this.initialX;
    const minWidth = 200;
    const maxWidth = this.containerWidth - minWidth;
    const newLeftWidth = Math.max(
      minWidth,
      Math.min(maxWidth, this.initialLeftWidth + deltaX)
    );

    const leftRatio = newLeftWidth / this.containerWidth;
    const rightRatio = 1 - leftRatio;

    this.leftPane.style.flex = `${leftRatio}`;
    this.rightPane.style.flex = `${rightRatio}`;

    if (this.aceInputEditor && this.aceOutputEditor) {
      this.aceInputEditor.resize();
      this.aceOutputEditor.resize();
    }
  }

  private onMouseUp() {
    if (this.isDragging) {
      this.isDragging = false;
      document.documentElement.classList.remove('resize-cursor');
      this.splitter.nativeElement.classList.remove('dragging');
      document.removeEventListener('mousemove', this.onMouseMove.bind(this));
      document.removeEventListener('mouseup', this.onMouseUp.bind(this));
      document.removeEventListener('selectstart', this.preventSelection);

      if (this.aceInputEditor && this.aceOutputEditor) {
        this.aceInputEditor.resize();
        this.aceOutputEditor.resize();
      }
    }
  }

  private preventSelection(e: Event) {
    e.preventDefault();
    return false;
  }
}

