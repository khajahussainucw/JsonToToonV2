import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

declare const ace: any;

@Component({
  selector: 'app-json-to-rust',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './json-to-java.component.html',
  styleUrl: './json-to-java.component.css'
})
export class JsonToRustComponent implements AfterViewInit {
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
  structName: string = 'RootObject';
  packageName: string = 'com.example';
  useLombok: boolean = true;
  useNullableTypes: boolean = true;
  useSerde: boolean = true;
  useOptionTypes: boolean = true;
  
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
    this.title.setTitle('JSON to Rust Converter - Generate Rust Structs');
    this.meta.updateTag({
      name: 'description',
      content: 'Convert JSON to Rust structs online. Generate Rust structs with Serde from JSON data instantly for Rust development.'
    });
    this.meta.updateTag({
      name: 'keywords',
      content: 'json to rust, json to rust struct, rust struct generator, json to serde, rust code generator'
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

    this.aceInputEditor = ace.edit(this.inputEditor.nativeElement);
    this.aceInputEditor.setTheme('ace/theme/github');
    this.aceInputEditor.session.setMode('ace/mode/json');
    this.aceInputEditor.setOptions({
      useWrapMode: true,
      fontSize: '14px',
      showPrintMargin: false,
    });
    this.aceInputEditor.getSession().setUseWrapMode(true);

    this.aceOutputEditor = ace.edit(this.outputEditor.nativeElement);
    this.aceOutputEditor.setTheme('ace/theme/github');
    this.aceOutputEditor.session.setMode('ace/mode/rust');
    this.aceOutputEditor.setOptions({
      useWrapMode: true,
      fontSize: '14px',
      showPrintMargin: false,
      readOnly: true
    });
    this.aceOutputEditor.getSession().setUseWrapMode(true);

    this.aceInputEditor.session.on('change', () => {
      this.debouncedConvert();
    });

    setTimeout(() => {
      this.aceInputEditor.resize(true);
      this.aceOutputEditor.resize(true);
    }, 100);
  }

  private debouncedConvert() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.convertJsonToRust();
    }, 300);
  }

  onStructNameChange() {
    this.convertJsonToRust();
  }

  onClassNameChange() {
    this.convertJsonToRust();
  }

  onPackageNameChange() {
    this.convertJsonToRust();
  }

  onUseLombokChange() {
    this.convertJsonToRust();
  }

  onUseNullableTypesChange() {
    this.convertJsonToRust();
  }

  onUseSerdeChange() {
    this.convertJsonToRust();
  }

  onUseOptionTypesChange() {
    this.convertJsonToRust();
  }

  private convertJsonToRust() {
    try {
      const inputJson = this.aceInputEditor.getValue().trim();
      if (!inputJson) {
        this.aceOutputEditor.setValue('');
        return;
      }

      const parsedJson = JSON.parse(inputJson);
      const rust = this.generateRust(parsedJson, this.structName);
      
      this.aceOutputEditor.setValue(rust, -1);
      this.aceOutputEditor.clearSelection();
    }
    catch (error: any) {
      this.aceOutputEditor.setValue('Invalid JSON: ' + error.message, -1);
      this.aceOutputEditor.clearSelection();
      return;
    }
  }

  private generateRust(obj: any, structName: string): string {
    const structs: string[] = [];
    const usedStructNames = new Set<string>();
    
    const generateStruct = (value: any, structName: string, indent: string = ''): string => {
      if (usedStructNames.has(structName)) {
        let counter = 1;
        let newStructName = structName + counter;
        while (usedStructNames.has(newStructName)) {
          counter++;
          newStructName = structName + counter;
        }
        structName = newStructName;
      }
      usedStructNames.add(structName);

      if (Array.isArray(value)) {
        if (value.length === 0) {
          return 'Vec<serde_json::Value>';
        }
        const firstItem = value[0];
        if (typeof firstItem === 'object' && firstItem !== null) {
          const itemStructName = this.singularize(structName) + 'Item';
          generateStruct(firstItem, itemStructName, indent);
          return `Vec<${itemStructName}>`;
        }
        const itemType = this.getRustType(firstItem);
        return `Vec<${itemType}>`;
      }
      
      if (typeof value !== 'object' || value === null) {
        return this.getRustType(value);
      }
      
      const fields: string[] = [];
      
      for (const key in value) {
        const propValue = value[key];
        let fieldType: string;
        
        if (propValue === null) {
          if (this.useOptionTypes) {
            fieldType = 'Option<serde_json::Value>';
          } else {
            fieldType = 'serde_json::Value';
          }
        } else if (Array.isArray(propValue)) {
          if (propValue.length === 0) {
            fieldType = 'Vec<serde_json::Value>';
          } else {
            const firstItem = propValue[0];
            if (typeof firstItem === 'object' && firstItem !== null) {
              const childStructName = this.snakeToPascal(key);
              generateStruct(firstItem, childStructName, indent);
              fieldType = `Vec<${childStructName}>`;
            } else {
              const itemType = this.getRustType(firstItem);
              fieldType = `Vec<${itemType}>`;
            }
          }
        } else if (typeof propValue === 'object') {
          const childStructName = this.snakeToPascal(key);
          generateStruct(propValue, childStructName, indent);
          if (this.useOptionTypes) {
            fieldType = `Option<${childStructName}>`;
          } else {
            fieldType = childStructName;
          }
        } else {
          fieldType = this.getRustType(propValue);
        }
        
        const fieldName = this.toSnakeCase(key);
        let fieldStr = `${indent}    pub ${fieldName}: ${fieldType}`;
        
        if (this.useSerde && key !== fieldName) {
          fieldStr += `,\n${indent}    #[serde(rename = "${key}")]`;
        }
        
        fields.push(fieldStr);
      }
      
      let structStr = '';
      if (this.useSerde) {
        structStr += '#[derive(Serialize, Deserialize)]\n';
      }
      structStr += `${indent}pub struct ${structName} {\n`;
      structStr += fields.join(',\n');
      structStr += `\n${indent}}`;
      structs.push(structStr);
      
      return structName;
    };
    
    generateStruct(obj, structName);
    
    return structs.reverse().join('\n\n');
  }

  private getRustType(value: any): string {
    if (value === null) {
      return this.useOptionTypes ? 'Option<serde_json::Value>' : 'serde_json::Value';
    }
    
    const type = typeof value;
    switch (type) {
      case 'string':
        return 'String';
      case 'number':
        return Number.isInteger(value) ? 'i64' : 'f64';
      case 'boolean':
        return 'bool';
      case 'object':
        return 'serde_json::Value';
      default:
        return 'serde_json::Value';
    }
  }

  private snakeToPascal(str: string): string {
    return str.split(/[-_\s]+/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
  }

  private toSnakeCase(str: string): string {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '').replace(/[-_\s]+/g, '_');
  }

  private singularize(str: string): string {
    if (str.endsWith('s') && str.length > 1) {
      return str.slice(0, -1);
    }
    return str;
  }

  loadSampleJson() {
    const sampleJson = {
      "user": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "age": 30,
        "isActive": true,
        "address": {
          "street": "123 Main St",
          "city": "New York",
          "zipCode": "10001"
        },
        "phoneNumbers": [
          {
            "type": "home",
            "number": "555-1234"
          },
          {
            "type": "work",
            "number": "555-5678"
          }
        ],
        "hobbies": ["reading", "gaming", "hiking"]
      }
    };

    this.aceInputEditor.setValue(JSON.stringify(sampleJson, null, 2), -1);
    this.aceInputEditor.clearSelection();
    this.convertJsonToRust();
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
        const parsed = JSON.parse(content);
        const formatted = JSON.stringify(parsed, null, 2);
        this.aceInputEditor.setValue(formatted, -1);
        this.aceInputEditor.clearSelection();
        this.convertJsonToRust();
      } catch (error: any) {
        this.showErrorModal('Please upload a valid JSON document.');
        return;
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
    this.convertJsonToRust();
  }

  copyToClipboard(): void {
    const outputContent = this.aceOutputEditor.getValue();
    if (!outputContent || outputContent.trim() === '' || outputContent.startsWith('Invalid JSON')) {
      this.copyErrorMessage = 'Nothing to copy';
      this.copyErrorVisible = true;
      setTimeout(() => {
        this.copyErrorVisible = false;
      }, 3000);
      return;
    }
    
    navigator.clipboard.writeText(outputContent).then(() => {
      this.copySuccessMessage = 'Rust code copied to clipboard!';
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

  downloadRust(): void {
    const outputContent = this.aceOutputEditor.getValue();
    if (!outputContent || outputContent.trim() === '' || outputContent.startsWith('Invalid JSON')) {
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
    link.download = `${this.structName.toLowerCase()}.rs`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    this.copySuccessMessage = 'Rust file downloaded successfully!';
    this.copySuccessVisible = true;
    setTimeout(() => {
      this.copySuccessVisible = false;
    }, 3000);
  }

  downloadJava(): void {
    this.downloadRust();
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

