import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';

declare const ace: any;

@Component({
  selector: 'app-json-to-typescript',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './json-to-typescript.component.html',
  styleUrl: './json-to-typescript.component.css'
})
export class JsonToTypescriptComponent implements AfterViewInit {
  @ViewChild('inputEditor') private inputEditor!: ElementRef<HTMLElement>;
  @ViewChild('outputEditor') private outputEditor!: ElementRef<HTMLElement>;
  @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;

  private aceInputEditor: any;
  private aceOutputEditor: any;
  private isMobile = false;
  private debounceTimer: any;
  
  interfaceName: string = 'RootObject';
  
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
    this.title.setTitle('JSON to TypeScript Converter - Generate TypeScript Interfaces');
    this.meta.updateTag({
      name: 'description',
      content: 'Convert JSON to TypeScript interfaces online. Generate TypeScript types from JSON data instantly for type-safe development.'
    });
    this.meta.updateTag({
      name: 'keywords',
      content: 'json to typescript, json to ts, typescript interface generator, json to interface, typescript types from json'
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

    // Initialize input editor for JSON
    this.aceInputEditor = ace.edit(this.inputEditor.nativeElement);
    this.aceInputEditor.setTheme('ace/theme/github');
    this.aceInputEditor.session.setMode('ace/mode/json');
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
      this.convertJsonToTypeScript();
    }, 300);
  }

  private convertJsonToTypeScript() {
    try {
      const inputJson = this.aceInputEditor.getValue().trim();
      if (!inputJson) {
        this.aceOutputEditor.setValue('');
        return;
      }

      const parsedJson = JSON.parse(inputJson);
      const typescript = this.generateTypeScript(parsedJson, this.interfaceName);
      
      this.aceOutputEditor.setValue(typescript, -1);
      this.aceOutputEditor.clearSelection();
    }
    catch (error: any) {
      this.aceOutputEditor.setValue('Invalid JSON: ' + error.message, -1);
      this.aceOutputEditor.clearSelection();
      return;
    }
  }

  private generateTypeScript(obj: any, name: string): string {
    const interfaces: string[] = [];
    
    const generateInterface = (value: any, interfaceName: string): string => {
      if (Array.isArray(value)) {
        if (value.length === 0) {
          return 'any[]';
        }
        const firstItem = value[0];
        if (typeof firstItem === 'object' && firstItem !== null) {
          const itemInterfaceName = interfaceName.replace(/s$/, '') + 'Item';
          generateInterface(firstItem, itemInterfaceName);
          return `${itemInterfaceName}[]`;
        }
        return `${typeof firstItem}[]`;
      }
      
      if (typeof value !== 'object' || value === null) {
        return typeof value;
      }
      
      const properties: string[] = [];
      for (const key in value) {
        const propValue = value[key];
        let propType: string;
        
        if (propValue === null) {
          propType = 'any';
        } else if (Array.isArray(propValue)) {
          if (propValue.length === 0) {
            propType = 'any[]';
          } else {
            const firstItem = propValue[0];
            if (typeof firstItem === 'object' && firstItem !== null) {
              const childInterfaceName = this.capitalize(key) + 'Item';
              generateInterface(firstItem, childInterfaceName);
              propType = `${childInterfaceName}[]`;
            } else {
              propType = `${typeof firstItem}[]`;
            }
          }
        } else if (typeof propValue === 'object') {
          const childInterfaceName = this.capitalize(key);
          generateInterface(propValue, childInterfaceName);
          propType = childInterfaceName;
        } else {
          propType = typeof propValue;
        }
        
        properties.push(`  ${key}: ${propType};`);
      }
      
      const interfaceStr = `export interface ${interfaceName} {\n${properties.join('\n')}\n}`;
      interfaces.push(interfaceStr);
      
      return interfaceName;
    };
    
    generateInterface(obj, name);
    
    return interfaces.reverse().join('\n\n');
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
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
    this.convertJsonToTypeScript();
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
        this.convertJsonToTypeScript();
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
    this.convertJsonToTypeScript();
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
      this.copySuccessMessage = 'TypeScript copied to clipboard!';
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

  downloadTypeScript(): void {
    const outputContent = this.aceOutputEditor.getValue();
    if (!outputContent || outputContent.trim() === '' || outputContent.startsWith('Invalid JSON')) {
      this.copyErrorMessage = 'Nothing to download';
      this.copyErrorVisible = true;
      setTimeout(() => {
        this.copyErrorVisible = false;
      }, 3000);
      return;
    }
    
    const blob = new Blob([outputContent], { type: 'text/typescript' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'interfaces.ts';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    this.copySuccessMessage = 'TypeScript downloaded successfully!';
    this.copySuccessVisible = true;
    setTimeout(() => {
      this.copySuccessVisible = false;
    }, 3000);
  }

  private checkMobileView() {
    this.isMobile = window.innerWidth <= 768;
  }
}


