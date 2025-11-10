import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

declare const ace: any;

@Component({
  selector: 'app-json-to-java',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './json-to-java.component.html',
  styleUrl: './json-to-java.component.css'
})
export class JsonToJavaComponent implements AfterViewInit {
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
  useLombok: boolean = false;
  useNullableTypes: boolean = true;
  packageName: string = 'com.example';
  
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
    this.title.setTitle('JSON to Java Converter - Generate Java POJO Classes');
    this.meta.updateTag({
      name: 'description',
      content: 'Convert JSON to Java classes online. Generate Java POJO classes from JSON data instantly for Java development.'
    });
    this.meta.updateTag({
      name: 'keywords',
      content: 'json to java, json to pojo, java class generator, json to java class, pojo generator, java code generator'
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
      this.convertJsonToJava();
    }, 300);
  }

  onClassNameChange() {
    this.convertJsonToJava();
  }

  onUseLombokChange() {
    this.convertJsonToJava();
  }

  onUseNullableTypesChange() {
    this.convertJsonToJava();
  }

  onPackageNameChange() {
    this.convertJsonToJava();
  }

  private convertJsonToJava() {
    try {
      const inputJson = this.aceInputEditor.getValue().trim();
      if (!inputJson) {
        this.aceOutputEditor.setValue('');
        return;
      }

      const parsedJson = JSON.parse(inputJson);
      const java = this.generateJava(parsedJson, this.className);
      
      this.aceOutputEditor.setValue(java, -1);
      this.aceOutputEditor.clearSelection();
    }
    catch (error: any) {
      this.aceOutputEditor.setValue('Invalid JSON: ' + error.message, -1);
      this.aceOutputEditor.clearSelection();
      return;
    }
  }

  private generateJava(obj: any, className: string): string {
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
          imports.add('java.util.List');
          return 'List<Object>';
        }
        const firstItem = value[0];
        if (typeof firstItem === 'object' && firstItem !== null) {
          const itemClassName = this.singularize(className) + 'Item';
          generateClass(firstItem, itemClassName, indent);
          imports.add('java.util.List');
          return `List<${itemClassName}>`;
        }
        const itemType = this.getJavaType(firstItem);
        imports.add('java.util.List');
        return `List<${itemType}>`;
      }
      
      if (typeof value !== 'object' || value === null) {
        return this.getJavaType(value);
      }
      
      const fields: string[] = [];
      const getters: string[] = [];
      const setters: string[] = [];
      
      for (const key in value) {
        const propValue = value[key];
        let propType: string;
        
        if (propValue === null) {
          propType = this.useNullableTypes ? 'Object' : 'Object';
        } else if (Array.isArray(propValue)) {
          if (propValue.length === 0) {
            propType = 'List<Object>';
            imports.add('java.util.List');
          } else {
            const firstItem = propValue[0];
            if (typeof firstItem === 'object' && firstItem !== null) {
              const childClassName = this.pascalCase(key) + 'Item';
              generateClass(firstItem, childClassName, indent);
              propType = `List<${childClassName}>`;
              imports.add('java.util.List');
            } else {
              const itemType = this.getJavaType(firstItem);
              propType = `List<${itemType}>`;
              imports.add('java.util.List');
            }
          }
        } else if (typeof propValue === 'object') {
          const childClassName = this.pascalCase(key);
          generateClass(propValue, childClassName, indent);
          propType = childClassName;
        } else {
          propType = this.getJavaType(propValue);
        }
        
        const fieldName = this.camelCase(key);
        const getterName = 'get' + this.pascalCase(key);
        const setterName = 'set' + this.pascalCase(key);
        
        if (this.useLombok) {
          fields.push(`${indent}    private ${propType} ${fieldName};`);
        } else {
          fields.push(`${indent}    private ${propType} ${fieldName};`);
          getters.push(`${indent}    public ${propType} ${getterName}() {\n${indent}        return ${fieldName};\n${indent}    }`);
          setters.push(`${indent}    public void ${setterName}(${propType} ${fieldName}) {\n${indent}        this.${fieldName} = ${fieldName};\n${indent}    }`);
        }
      }
      
      let classStr = '';
      if (this.packageName) {
        classStr += `package ${this.packageName};\n\n`;
      }
      
      if (imports.size > 0) {
        Array.from(imports).sort().forEach(imp => {
          classStr += `import ${imp};\n`;
        });
        classStr += '\n';
      }
      
      if (this.useLombok) {
        classStr += `import lombok.Data;\n\n@Data\n`;
      }
      
      classStr += `${indent}public class ${className} {\n`;
      classStr += fields.join('\n');
      
      if (!this.useLombok) {
        if (getters.length > 0) {
          classStr += '\n' + getters.join('\n');
        }
        if (setters.length > 0) {
          classStr += '\n' + setters.join('\n');
        }
      }
      
      classStr += `\n${indent}}`;
      classes.push(classStr);
      
      return className;
    };
    
    generateClass(obj, className);
    
    return classes.reverse().join('\n\n');
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
        return Number.isInteger(value) ? 'Integer' : 'Double';
      case 'boolean':
        return 'Boolean';
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
    this.convertJsonToJava();
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
        this.convertJsonToJava();
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
    this.convertJsonToJava();
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

