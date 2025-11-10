import { Component, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

declare const ace: any;

@Component({
  selector: 'app-xml-to-python',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './xml-to-python.component.html',
  styleUrl: './xml-to-python.component.css'
})
export class XmlToPythonComponent implements AfterViewInit {
  @ViewChild('inputEditor') private inputEditor!: ElementRef<HTMLElement>;
  @ViewChild('outputEditor') private outputEditor!: ElementRef<HTMLElement>;
  @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;

  private aceInputEditor: any;
  private aceOutputEditor: any;
  private debounceTimer: any;
  
  className: string = 'RootObject';
  useDataclass: boolean = true;
  useTyping: boolean = true;
  
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
    this.title.setTitle('XML to Python Converter - Generate Python Classes from XML');
    this.meta.updateTag({
      name: 'description',
      content: 'Convert XML to Python classes online. Generate Python dataclasses from XML data instantly for Django, Flask, and Python development.'
    });
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.initializeEditors();
      }, 100);
    }
  }

  private initializeEditors() {
    if (typeof window === 'undefined' || typeof ace === 'undefined') return;

    this.aceInputEditor = ace.edit(this.inputEditor.nativeElement);
    this.aceInputEditor.setTheme('ace/theme/github');
    this.aceInputEditor.session.setMode('ace/mode/xml');
    this.aceInputEditor.setOptions({
      useWrapMode: true,
      fontSize: '14px',
      showPrintMargin: false,
    });

    this.aceOutputEditor = ace.edit(this.outputEditor.nativeElement);
    this.aceOutputEditor.setTheme('ace/theme/github');
    this.aceOutputEditor.session.setMode('ace/mode/python');
    this.aceOutputEditor.setOptions({
      useWrapMode: true,
      fontSize: '14px',
      showPrintMargin: false,
      readOnly: true
    });

    this.aceInputEditor.session.on('change', () => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => this.convert(), 300);
    });
  }

  onClassNameChange() { this.convert(); }
  onUseDataclassChange() { this.convert(); }
  onUseTypingChange() { this.convert(); }

  private convert() {
    try {
      const inputXml = this.aceInputEditor.getValue().trim();
      if (!inputXml) {
        this.aceOutputEditor.setValue('');
        return;
      }

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(inputXml, 'text/xml');
      
      if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
        throw new Error('Invalid XML syntax');
      }

      const jsonObj = this.xmlToJson(xmlDoc.documentElement);
      const python = this.generatePython(jsonObj, this.className);
      
      this.aceOutputEditor.setValue(python, -1);
      this.aceOutputEditor.clearSelection();
    }
    catch (error: any) {
      this.aceOutputEditor.setValue('Invalid XML: ' + error.message, -1);
    }
  }

  private xmlToJson(xml: any): any {
    if (!xml) return null;
    let obj: any = {};

    if (xml.nodeType === 1 && xml.attributes?.length > 0) {
      obj['@attributes'] = {};
      for (let j = 0; j < xml.attributes.length; j++) {
        const attr = xml.attributes.item(j);
        if (attr) obj['@attributes'][attr.nodeName] = attr.nodeValue || '';
      }
    }

    if (xml.hasChildNodes?.()) {
      for (let i = 0; i < xml.childNodes.length; i++) {
        const item = xml.childNodes.item(i);
        if (!item) continue;
        
        if (item.nodeType === 1) {
          const childJson = this.xmlToJson(item);
          if (typeof obj[item.nodeName] === 'undefined') {
            obj[item.nodeName] = childJson;
          } else {
            if (!Array.isArray(obj[item.nodeName])) {
              obj[item.nodeName] = [obj[item.nodeName]];
            }
            obj[item.nodeName].push(childJson);
          }
        }
      }
    }

    return Object.keys(obj).length > 0 ? obj : null;
  }

  private generatePython(obj: any, className: string): string {
    const classes: string[] = [];
    const used = new Set<string>();
    
    const gen = (value: any, name: string): string => {
      if (used.has(name)) {
        let i = 1;
        while (used.has(name + i)) i++;
        name = name + i;
      }
      used.add(name);

      if (Array.isArray(value)) {
        const itemType = value.length > 0 && typeof value[0] === 'object' ? gen(value[0], name + 'Item') : 'Any';
        return this.useTyping ? `List[${itemType}]` : 'list';
      }
      
      if (typeof value !== 'object' || !value) return this.useTyping ? 'Any' : '';
      
      const props: string[] = [];
      for (const key in value) {
        if (key === '@attributes') continue;
        let type = '';
        if (this.useTyping) {
          type = Array.isArray(value[key]) 
            ? (value[key].length > 0 && typeof value[key][0] === 'object' ? `List[${gen(value[key][0], this.pascalCase(key))}]` : 'List[Any]')
            : typeof value[key] === 'object' ? gen(value[key], this.pascalCase(key)) : 'Any';
          type = ': ' + type;
        }
        props.push(`    ${this.snakeCase(key)}${type}`);
      }
      
      const decorator = this.useDataclass ? '@dataclass\n' : '';
      const classType = this.useDataclass ? 'class' : 'class';
      classes.push(`${decorator}${classType} ${name}:\n${props.join('\n')}`);
      return name;
    };
    
    gen(obj, className);
    
    const imports: string[] = [];
    if (this.useDataclass) imports.push('from dataclasses import dataclass');
    if (this.useTyping) imports.push('from typing import List, Any');
    
    const importsStr = imports.length > 0 ? imports.join('\n') + '\n\n' : '';
    return importsStr + classes.reverse().join('\n\n');
  }

  private pascalCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
  }

  private snakeCase(str: string): string {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  }

  loadSampleXml() {
    const sample = `<?xml version="1.0"?>
<user id="1">
  <name>John Doe</name>
  <email>john@example.com</email>
</user>`;
    this.aceInputEditor.setValue(sample, -1);
    this.aceInputEditor.clearSelection();
    this.convert();
  }

  triggerFileUpload() { this.fileInput.nativeElement.click(); }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.[0]) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.aceInputEditor.setValue(reader.result as string, -1);
      this.convert();
    };
    reader.readAsText(input.files[0]);
  }

  closeErrorModal() { this.errorModalVisible = false; }
  clearInput() { this.aceInputEditor.setValue('', -1); this.convert(); }

  copyToClipboard() {
    const content = this.aceOutputEditor.getValue();
    if (!content?.trim() || content.startsWith('Invalid')) {
      this.copyErrorMessage = 'Nothing to copy';
      this.copyErrorVisible = true;
      setTimeout(() => this.copyErrorVisible = false, 3000);
      return;
    }
    
    navigator.clipboard.writeText(content).then(() => {
      this.copySuccessMessage = 'Python code copied!';
      this.copySuccessVisible = true;
      setTimeout(() => this.copySuccessVisible = false, 3000);
    });
  }

  downloadPython() {
    const content = this.aceOutputEditor.getValue();
    if (!content?.trim() || content.startsWith('Invalid')) {
      this.copyErrorMessage = 'Nothing to download';
      this.copyErrorVisible = true;
      setTimeout(() => this.copyErrorVisible = false, 3000);
      return;
    }
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.snakeCase(this.className)}.py`;
    link.click();
    URL.revokeObjectURL(url);
    
    this.copySuccessMessage = 'Downloaded!';
    this.copySuccessVisible = true;
    setTimeout(() => this.copySuccessVisible = false, 3000);
  }
}

