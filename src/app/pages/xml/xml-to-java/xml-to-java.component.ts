import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

declare const ace: any;

@Component({
  selector: 'app-xml-to-java',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './xml-to-java.component.html',
  styleUrl: './xml-to-java.component.css'
})
export class XmlToJavaComponent implements AfterViewInit {
  @ViewChild('inputEditor') private inputEditor!: ElementRef<HTMLElement>;
  @ViewChild('outputEditor') private outputEditor!: ElementRef<HTMLElement>;
  @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;

  private aceInputEditor: any;
  private aceOutputEditor: any;
  private isMobile = false;
  private debounceTimer: any;
  
  className: string = 'RootObject';
  packageName: string = 'com.example';
  useGettersSetters: boolean = true;
  useNullableTypes: boolean = false;
  
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
    this.title.setTitle('XML to Java Converter - Generate Java Classes from XML');
    this.meta.updateTag({
      name: 'description',
      content: 'Convert XML to Java classes online. Generate Java POJOs from XML data instantly for Spring, Android, and Java development.'
    });
    this.meta.updateTag({
      name: 'keywords',
      content: 'xml to java, xml to class, java class generator, xml to pojo, java code generator, xml parser'
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

    // Initialize output editor for Java
    this.aceOutputEditor = ace.edit(this.outputEditor.nativeElement);
    this.aceOutputEditor.setTheme('ace/theme/github');
    this.aceOutputEditor.session.setMode('ace/mode/java');
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
      this.convertXmlToJava();
    }, 300);
  }

  onClassNameChange() {
    this.convertXmlToJava();
  }

  onPackageNameChange() {
    this.convertXmlToJava();
  }

  onUseGettersSettersChange() {
    this.convertXmlToJava();
  }

  onUseNullableTypesChange() {
    this.convertXmlToJava();
  }

  private convertXmlToJava() {
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

      if (!xmlDoc.documentElement) {
        throw new Error('XML must have a root element');
      }

      const jsonObj = this.xmlToJson(xmlDoc.documentElement);
      const java = this.generateJava(jsonObj, this.className);
      
      this.aceOutputEditor.setValue(java, -1);
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

  private generateJava(obj: any, className: string): string {
    const classes: string[] = [];
    const usedClassNames = new Set<string>();
    let packageStr = '';
    
    if (this.packageName) {
      packageStr = `package ${this.packageName};\n\n`;
    }
    
    const generateClass = (value: any, className: string, indent: string = ''): string => {
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
          return 'List<Object>';
        }
        const firstItem = value[0];
        if (typeof firstItem === 'object' && firstItem !== null) {
          const itemClassName = this.singularize(className) + 'Item';
          generateClass(firstItem, itemClassName, indent);
          return `List<${itemClassName}>`;
        }
        const itemType = this.getJavaType(firstItem);
        return `List<${itemType}>`;
      }
      
      if (typeof value !== 'object' || value === null) {
        return this.getJavaType(value);
      }
      
      const fields: string[] = [];
      const methods: string[] = [];
      
      if (value['@attributes']) {
        for (const attrKey in value['@attributes']) {
          const attrValue = value['@attributes'][attrKey];
          const fieldType = this.getJavaType(attrValue);
          const fieldName = this.camelCase(attrKey);
          
          fields.push(`${indent}    private ${fieldType} ${fieldName};`);
          
          if (this.useGettersSetters) {
            const getterName = `get${this.pascalCase(attrKey)}`;
            const setterName = `set${this.pascalCase(attrKey)}`;
            methods.push(`${indent}    public ${fieldType} ${getterName}() {\n${indent}        return ${fieldName};\n${indent}    }`);
            methods.push(`${indent}    public void ${setterName}(${fieldType} ${fieldName}) {\n${indent}        this.${fieldName} = ${fieldName};\n${indent}    }`);
          }
        }
      }
      
      if (value['#text'] !== undefined) {
        const fieldType = this.getJavaType(value['#text']);
        const fieldName = 'text';
        
        fields.push(`${indent}    private ${fieldType} ${fieldName};`);
        
        if (this.useGettersSetters) {
          methods.push(`${indent}    public ${fieldType} getText() {\n${indent}        return ${fieldName};\n${indent}    }`);
          methods.push(`${indent}    public void setText(${fieldType} ${fieldName}) {\n${indent}        this.${fieldName} = ${fieldName};\n${indent}    }`);
        }
      }
      
      for (const key in value) {
        if (key === '@attributes' || key === '#text') {
          continue;
        }
        
        const propValue = value[key];
        let fieldType: string;
        
        if (propValue === null) {
          fieldType = 'Object';
        } else if (Array.isArray(propValue)) {
          if (propValue.length === 0) {
            fieldType = 'List<Object>';
          } else {
            const firstItem = propValue[0];
            if (typeof firstItem === 'object' && firstItem !== null) {
              const childClassName = this.pascalCase(key);
              generateClass(firstItem, childClassName, indent);
              fieldType = `List<${childClassName}>`;
            } else {
              const itemType = this.getJavaType(firstItem);
              fieldType = `List<${itemType}>`;
            }
          }
        } else if (typeof propValue === 'object') {
          const childClassName = this.pascalCase(key);
          generateClass(propValue, childClassName, indent);
          fieldType = childClassName;
        } else {
          fieldType = this.getJavaType(propValue);
        }
        
        const fieldName = this.camelCase(key);
        fields.push(`${indent}    private ${fieldType} ${fieldName};`);
        
        if (this.useGettersSetters) {
          const getterName = `get${this.pascalCase(key)}`;
          const setterName = `set${this.pascalCase(key)}`;
          methods.push(`${indent}    public ${fieldType} ${getterName}() {\n${indent}        return ${fieldName};\n${indent}    }`);
          methods.push(`${indent}    public void ${setterName}(${fieldType} ${fieldName}) {\n${indent}        this.${fieldName} = ${fieldName};\n${indent}    }`);
        }
      }
      
      const allMembers = [...fields];
      if (methods.length > 0) {
        allMembers.push('');
        allMembers.push(...methods);
      }
      
      const classStr = `${indent}public class ${className} {\n${allMembers.join('\n')}\n${indent}}`;
      classes.push(classStr);
      
      return className;
    };
    
    generateClass(obj, className);
    
    const importsStr = classes.some(c => c.includes('List<')) ? 'import java.util.List;\n\n' : '';
    return packageStr + importsStr + classes.reverse().join('\n\n');
  }

  private getJavaType(value: any): string {
    if (value === null) {
      return 'Object';
    }
    
    const type = typeof value;
    switch (type) {
      case 'string':
        return 'String';
      case 'number':
        return Number.isInteger(value) ? 'int' : 'double';
      case 'boolean':
        return 'boolean';
      case 'object':
        return 'Object';
      default:
        return 'Object';
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
</user>`;

    this.aceInputEditor.setValue(sampleXml, -1);
    this.aceInputEditor.clearSelection();
    this.convertXmlToJava();
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
      this.convertXmlToJava();
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
    this.convertXmlToJava();
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
      this.copySuccessMessage = 'Java code copied to clipboard!';
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

  downloadJava(): void {
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
    link.download = `${this.className}.java`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    this.copySuccessMessage = 'Java file downloaded successfully!';
    this.copySuccessVisible = true;
    setTimeout(() => {
      this.copySuccessVisible = false;
    }, 3000);
  }

  private checkMobileView() {
    this.isMobile = window.innerWidth <= 768;
  }
}

