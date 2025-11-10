import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

declare const ace: any;

@Component({
  selector: 'app-json-to-cpp',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './json-to-cpp.component.html',
  styleUrl: './json-to-cpp.component.css'
})
export class JsonToCppComponent implements AfterViewInit {
  @ViewChild('inputEditor') private inputEditor!: ElementRef<HTMLElement>;
  @ViewChild('outputEditor') private outputEditor!: ElementRef<HTMLElement>;
  @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;

  private aceInputEditor: any;
  private aceOutputEditor: any;
  private isMobile = false;
  private debounceTimer: any;
  
  className: string = 'RootObject';
  useNamespace: boolean = true;
  namespaceName: string = 'json';
  
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
    this.title.setTitle('JSON to C++ Converter - Generate C++ Structs/Classes');
    this.meta.updateTag({
      name: 'description',
      content: 'Convert JSON to C++ structs and classes online. Generate C++ code from JSON data instantly for C++ development.'
    });
    this.meta.updateTag({
      name: 'keywords',
      content: 'json to c++, json to cpp, json to struct, c++ class generator, json to c++ code generator'
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
    this.aceOutputEditor.session.setMode('ace/mode/c_cpp');
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
      this.convertJsonToCpp();
    }, 300);
  }

  onClassNameChange() {
    this.convertJsonToCpp();
  }

  onNamespaceChange() {
    this.convertJsonToCpp();
  }

  private convertJsonToCpp() {
    try {
      const inputJson = this.aceInputEditor.getValue().trim();
      if (!inputJson) {
        this.aceOutputEditor.setValue('');
        return;
      }

      const parsedJson = JSON.parse(inputJson);
      const cpp = this.generateCpp(parsedJson, this.className);
      
      this.aceOutputEditor.setValue(cpp, -1);
      this.aceOutputEditor.clearSelection();
    }
    catch (error: any) {
      this.aceOutputEditor.setValue('Invalid JSON: ' + error.message, -1);
      this.aceOutputEditor.clearSelection();
      return;
    }
  }

  private generateCpp(obj: any, className: string): string {
    const includes = '#include <string>\n#include <vector>\n#include <optional>\n\n';
    const classes: string[] = [];
    const usedClassNames = new Set<string>();
    
    const generateStruct = (value: any, structName: string, indent: string = ''): string => {
      if (usedClassNames.has(structName)) {
        let counter = 1;
        let newStructName = structName + counter;
        while (usedClassNames.has(newStructName)) {
          counter++;
          newStructName = structName + counter;
        }
        structName = newStructName;
      }
      usedClassNames.add(structName);

      if (Array.isArray(value)) {
        if (value.length === 0) {
          return 'std::vector<std::string>';
        }
        const firstItem = value[0];
        if (typeof firstItem === 'object' && firstItem !== null) {
          const itemStructName = this.singularize(structName) + 'Item';
          generateStruct(firstItem, itemStructName, indent);
          return `std::vector<${itemStructName}>`;
        }
        const itemType = this.getCppType(firstItem);
        return `std::vector<${itemType}>`;
      }
      
      if (typeof value !== 'object' || value === null) {
        return this.getCppType(value);
      }
      
      const members: string[] = [];
      for (const key in value) {
        const memberValue = value[key];
        let memberType: string;
        
        if (memberValue === null) {
          memberType = 'std::optional<std::string>';
        } else if (Array.isArray(memberValue)) {
          if (memberValue.length === 0) {
            memberType = 'std::vector<std::string>';
          } else {
            const firstItem = memberValue[0];
            if (typeof firstItem === 'object' && firstItem !== null) {
              const childStructName = this.pascalCase(key) + 'Item';
              generateStruct(firstItem, childStructName, indent);
              memberType = `std::vector<${childStructName}>`;
            } else {
              const itemType = this.getCppType(firstItem);
              memberType = `std::vector<${itemType}>`;
            }
          }
        } else if (typeof memberValue === 'object') {
          const childStructName = this.pascalCase(key);
          generateStruct(memberValue, childStructName, indent);
          memberType = childStructName;
        } else {
          memberType = this.getCppType(memberValue);
        }
        
        const memberName = this.snakeCase(key);
        members.push(`${indent}    ${memberType} ${memberName};`);
      }
      
      const structStr = `${indent}struct ${structName}\n${indent}{\n${members.join('\n')}\n${indent}};`;
      classes.push(structStr);
      
      return structName;
    };
    
    generateStruct(obj, className);
    
    let result = includes;
    if (this.useNamespace && this.namespaceName) {
      result += `namespace ${this.namespaceName} {\n\n`;
    }
    result += classes.reverse().join('\n\n');
    if (this.useNamespace && this.namespaceName) {
      result += `\n\n} // namespace ${this.namespaceName}`;
    }
    
    return result;
  }

  private getCppType(value: any): string {
    if (value === null) {
      return 'std::optional<std::string>';
    }
    
    const type = typeof value;
    switch (type) {
      case 'string':
        return 'std::string';
      case 'number':
        return Number.isInteger(value) ? 'int' : 'double';
      case 'boolean':
        return 'bool';
      case 'object':
        return 'std::string';
      default:
        return 'std::string';
    }
  }

  private pascalCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
  }

  private snakeCase(str: string): string {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
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
          }
        ],
        "hobbies": ["reading", "gaming"]
      }
    };

    this.aceInputEditor.setValue(JSON.stringify(sampleJson, null, 2), -1);
    this.aceInputEditor.clearSelection();
    this.convertJsonToCpp();
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
        this.convertJsonToCpp();
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
    this.convertJsonToCpp();
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
      this.copySuccessMessage = 'C++ code copied to clipboard!';
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

  downloadCpp(): void {
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
    link.download = `${this.className}.cpp`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    this.copySuccessMessage = 'C++ file downloaded successfully!';
    this.copySuccessVisible = true;
    setTimeout(() => {
      this.copySuccessVisible = false;
    }, 3000);
  }

  private checkMobileView() {
    this.isMobile = window.innerWidth <= 768;
  }
}

