import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

declare const ace: any;

@Component({
  selector: 'app-json-to-python',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './json-to-python.component.html',
  styleUrl: './json-to-python.component.css'
})
export class JsonToPythonComponent implements AfterViewInit {
  @ViewChild('inputEditor') private inputEditor!: ElementRef<HTMLElement>;
  @ViewChild('outputEditor') private outputEditor!: ElementRef<HTMLElement>;
  @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;

  private aceInputEditor: any;
  private aceOutputEditor: any;
  private isMobile = false;
  private debounceTimer: any;
  
  className: string = 'RootObject';
  useDataclass: boolean = true;
  useTyping: boolean = true;
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
    this.title.setTitle('JSON to Python Converter - Generate Python Classes');
    this.meta.updateTag({
      name: 'description',
      content: 'Convert JSON to Python classes online. Generate Python dataclasses from JSON data instantly for Python development.'
    });
    this.meta.updateTag({
      name: 'keywords',
      content: 'json to python, json to python class, python dataclass generator, json to python object, python code generator'
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

    // Initialize output editor for Python
    this.aceOutputEditor = ace.edit(this.outputEditor.nativeElement);
    this.aceOutputEditor.setTheme('ace/theme/github');
    this.aceOutputEditor.session.setMode('ace/mode/python');
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
      this.convertJsonToPython();
    }, 300);
  }

  onClassNameChange() {
    this.convertJsonToPython();
  }

  onUseDataclassChange() {
    this.convertJsonToPython();
  }

  onUseTypingChange() {
    this.convertJsonToPython();
  }

  onUseNullableTypesChange() {
    this.convertJsonToPython();
  }

  private convertJsonToPython() {
    try {
      const inputJson = this.aceInputEditor.getValue().trim();
      if (!inputJson) {
        this.aceOutputEditor.setValue('');
        return;
      }

      const parsedJson = JSON.parse(inputJson);
      const python = this.generatePython(parsedJson, this.className);
      
      this.aceOutputEditor.setValue(python, -1);
      this.aceOutputEditor.clearSelection();
    }
    catch (error: any) {
      this.aceOutputEditor.setValue('Invalid JSON: ' + error.message, -1);
      this.aceOutputEditor.clearSelection();
      return;
    }
  }

  private generatePython(obj: any, className: string): string {
    const classes: string[] = [];
    const usedClassNames = new Set<string>();
    const imports = new Set<string>();
    
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
          if (this.useTyping) {
            imports.add('from typing import List');
            return 'List[object]';
          }
          return 'list';
        }
        const firstItem = value[0];
        if (typeof firstItem === 'object' && firstItem !== null) {
          const itemClassName = this.singularize(className) + 'Item';
          generateClass(firstItem, itemClassName, indent);
          if (this.useTyping) {
            imports.add('from typing import List');
            return `List[${itemClassName}]`;
          }
          return `list[${itemClassName}]`;
        }
        const itemType = this.getPythonType(firstItem);
        if (this.useTyping) {
          imports.add('from typing import List');
          return `List[${itemType}]`;
        }
        return `list[${itemType}]`;
      }
      
      if (typeof value !== 'object' || value === null) {
        return this.getPythonType(value);
      }
      
      const fields: string[] = [];
      
      for (const key in value) {
        const propValue = value[key];
        let propType: string;
        
        if (propValue === null) {
          if (this.useTyping) {
            imports.add('from typing import Optional');
            propType = 'Optional[object]';
          } else {
            propType = 'object | None';
          }
        } else if (Array.isArray(propValue)) {
          if (propValue.length === 0) {
            if (this.useTyping) {
              imports.add('from typing import List');
              propType = 'List[object]';
            } else {
              propType = 'list';
            }
          } else {
            const firstItem = propValue[0];
            if (typeof firstItem === 'object' && firstItem !== null) {
              const childClassName = this.pascalCase(key) + 'Item';
              generateClass(firstItem, childClassName, indent);
              if (this.useTyping) {
                imports.add('from typing import List');
                propType = `List[${childClassName}]`;
              } else {
                propType = `list[${childClassName}]`;
              }
            } else {
              const itemType = this.getPythonType(firstItem);
              if (this.useTyping) {
                imports.add('from typing import List');
                propType = `List[${itemType}]`;
              } else {
                propType = `list[${itemType}]`;
              }
            }
          }
        } else if (typeof propValue === 'object') {
          const childClassName = this.pascalCase(key);
          generateClass(propValue, childClassName, indent);
          propType = childClassName;
        } else {
          propType = this.getPythonType(propValue);
        }
        
        const fieldName = this.snakeCase(key);
        fields.push(`${indent}    ${fieldName}: ${propType}`);
      }
      
      let classStr = '';
      if (imports.size > 0) {
        Array.from(imports).sort().forEach(imp => {
          classStr += `${imp}\n`;
        });
        classStr += '\n';
      }
      
      if (this.useDataclass) {
        classStr += 'from dataclasses import dataclass\n\n';
        classStr += `${indent}@dataclass\n`;
      }
      
      classStr += `${indent}class ${className}:\n`;
      if (fields.length === 0) {
        classStr += `${indent}    pass\n`;
      } else {
        classStr += fields.join('\n');
      }
      
      classes.push(classStr);
      
      return className;
    };
    
    generateClass(obj, className);
    
    return classes.reverse().join('\n\n');
  }

  private getPythonType(value: any): string {
    if (value === null) {
      if (this.useTyping) {
        return 'Optional[object]';
      }
      return 'object | None';
    }
    
    const type = typeof value;
    switch (type) {
      case 'string':
        return 'str';
      case 'number':
        return Number.isInteger(value) ? 'int' : 'float';
      case 'boolean':
        return 'bool';
      case 'object':
        return 'dict';
      default:
        return 'object';
    }
  }

  private pascalCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
  }

  private snakeCase(str: string): string {
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
    this.convertJsonToPython();
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
        this.convertJsonToPython();
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
    this.convertJsonToPython();
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
      this.copySuccessMessage = 'Python code copied to clipboard!';
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

  downloadPython(): void {
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
    link.download = `${this.className.toLowerCase()}.py`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    this.copySuccessMessage = 'Python file downloaded successfully!';
    this.copySuccessVisible = true;
    setTimeout(() => {
      this.copySuccessVisible = false;
    }, 3000);
  }

  private checkMobileView() {
    this.isMobile = window.innerWidth <= 768;
  }
}

