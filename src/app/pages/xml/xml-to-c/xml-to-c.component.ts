import { Component, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

declare const ace: any;

@Component({
  selector: 'app-xml-to-c',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './xml-to-c.component.html',
  styleUrl: './xml-to-c.component.css'
})
export class XmlToCComponent implements AfterViewInit {
  @ViewChild('inputEditor') private inputEditor!: ElementRef<HTMLElement>;
  @ViewChild('outputEditor') private outputEditor!: ElementRef<HTMLElement>;
  @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;

  private aceInputEditor: any;
  private aceOutputEditor: any;
  private debounceTimer: any;
  
  className: string = 'RootObject';
  packageName: string = 'com.example';
  useDataClass: boolean = true;
  useNullableTypes: boolean = true;
  
  copySuccessVisible = false;
  copySuccessMessage = '';
  copyErrorVisible = false;
  copyErrorMessage = '';

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private meta: Meta, private title: Title) {
    this.title.setTitle('XML to C Converter');
    this.meta.updateTag({ name: 'description', content: 'Convert XML to C structs online.' });
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.initializeEditors(), 100);
    }
  }

  private initializeEditors() {
    if (typeof window === 'undefined' || typeof ace === 'undefined') return;
    this.aceInputEditor = ace.edit(this.inputEditor.nativeElement);
    this.aceInputEditor.setTheme('ace/theme/github');
    this.aceInputEditor.session.setMode('ace/mode/xml');
    this.aceInputEditor.setOptions({ useWrapMode: true, fontSize: '14px', showPrintMargin: false });
    this.aceOutputEditor = ace.edit(this.outputEditor.nativeElement);
    this.aceOutputEditor.setTheme('ace/theme/github');
    this.aceOutputEditor.session.setMode('ace/mode/c_cpp');
    this.aceOutputEditor.setOptions({ useWrapMode: true, fontSize: '14px', showPrintMargin: false, readOnly: true });
    this.aceInputEditor.session.on('change', () => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => this.convert(), 300);
    });
  }

  onClassNameChange() { this.convert(); }
  onPackageNameChange() { this.convert(); }
  onUseDataClassChange() { this.convert(); }
  onUseNullableTypesChange() { this.convert(); }

  private convert() {
    try {
      const inputXml = this.aceInputEditor.getValue().trim();
      if (!inputXml) { this.aceOutputEditor.setValue(''); return; }
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(inputXml, 'text/xml');
      if (xmlDoc.getElementsByTagName('parsererror').length > 0) throw new Error('Invalid XML syntax');
      const jsonObj = this.xmlToJson(xmlDoc.documentElement);
      const kotlin = this.generateKotlin(jsonObj, this.className);
      this.aceOutputEditor.setValue(kotlin, -1);
      this.aceOutputEditor.clearSelection();
    } catch (error: any) {
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
        if (!item || item.nodeType !== 1) continue;
        const childJson = this.xmlToJson(item);
        if (typeof obj[item.nodeName] === 'undefined') {
          obj[item.nodeName] = childJson;
        } else {
          if (!Array.isArray(obj[item.nodeName])) obj[item.nodeName] = [obj[item.nodeName]];
          obj[item.nodeName].push(childJson);
        }
      }
    }
    return Object.keys(obj).length > 0 ? obj : null;
  }

  private generateKotlin(obj: any, className: string): string {
    const classes: string[] = [];
    const used = new Set<string>();
    const gen = (value: any, name: string): string => {
      if (used.has(name)) { let i = 1; while (used.has(name + i)) i++; name = name + i; }
      used.add(name);
      if (Array.isArray(value)) {
        const itemType = value.length > 0 && typeof value[0] === 'object' ? gen(value[0], name + 'Item') : 'String';
        return `List<${itemType}>`;
      }
      if (typeof value !== 'object' || !value) return 'String';
      const props: string[] = [];
      for (const key in value) {
        if (key === '@attributes') continue;
        const propName = this.camelCase(key);
        let propType = '';
        if (Array.isArray(value[key])) {
          const itemType = value[key].length > 0 && typeof value[key][0] === 'object' ? gen(value[key][0], this.pascalCase(key)) : 'String';
          propType = `List<${itemType}>`;
        } else if (typeof value[key] === 'object') {
          propType = gen(value[key], this.pascalCase(key));
        } else {
          propType = 'String';
        }
        const nullable = this.useNullableTypes ? '?' : '';
        props.push(`    val ${propName}: ${propType}${nullable}`);
      }
      const keyword = this.useDataClass ? 'data class' : 'class';
      classes.push(`${keyword} ${name}(\n${props.join(',\n')}\n)`);
      return name;
    };
    gen(obj, className);
    const pkg = this.packageName ? `package ${this.packageName}\n\n` : '';
    return pkg + classes.reverse().join('\n\n');
  }

  private pascalCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
  }

  private camelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1).replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
  }

  loadSampleXml() {
    const sample = `<?xml version="1.0"?>\n<user id="1">\n  <name>John Doe</name>\n  <email>john@example.com</email>\n</user>`;
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
      this.copySuccessMessage = 'C code copied!';
      this.copySuccessVisible = true;
      setTimeout(() => this.copySuccessVisible = false, 3000);
    });
  }

  downloadC() {
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
    link.download = `${this.className}.kt`;
    link.click();
    URL.revokeObjectURL(url);
    this.copySuccessMessage = 'Downloaded!';
    this.copySuccessVisible = true;
    setTimeout(() => this.copySuccessVisible = false, 3000);
  }
}

