import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';

declare const ace: any;

@Component({
  selector: 'app-json-schema-generator',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './json-schema-generator.component.html',
  styleUrl: './json-schema-generator.component.css'
})
export class JsonSchemaGeneratorComponent implements AfterViewInit {
  @ViewChild('inputEditor') private inputEditor!: ElementRef<HTMLElement>;
  @ViewChild('outputEditor') private outputEditor!: ElementRef<HTMLElement>;
  @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;

  private aceInputEditor: any;
  private aceOutputEditor: any;
  private debounceTimer: any;
  
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
    this.title.setTitle('JSON Schema Generator - Generate JSON Schema from JSON');
    this.meta.updateTag({
      name: 'description',
      content: 'Generate JSON Schema from JSON data. Create schema definitions automatically.'
    });
    this.meta.updateTag({
      name: 'keywords',
      content: 'json schema generator, generate json schema, json schema, json schema tool'
    });
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.initializeEditors();
        window.addEventListener('resize', () => {
          if (this.aceInputEditor) this.aceInputEditor.resize();
          if (this.aceOutputEditor) this.aceOutputEditor.resize();
        });
      }, 100);
    }
  }

  private initializeEditors() {
    if (typeof ace === 'undefined') {
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
    this.aceOutputEditor.session.setMode('ace/mode/json');
    this.aceOutputEditor.setOptions({
      useWrapMode: true,
      fontSize: '14px',
      showPrintMargin: false,
      readOnly: true
    });
    this.aceOutputEditor.getSession().setUseWrapMode(true);

    this.aceInputEditor.session.on('change', () => {
      this.debouncedGenerate();
    });

    setTimeout(() => {
      this.aceInputEditor.resize(true);
      this.aceOutputEditor.resize(true);
    }, 100);
  }

  private debouncedGenerate() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.generateSchema();
    }, 300);
  }

  private generateSchema() {
    try {
      const input = this.aceInputEditor.getValue().trim();
      if (!input) {
        this.aceOutputEditor.setValue('');
        return;
      }

      const jsonObj = JSON.parse(input);
      const schema = this.inferSchema(jsonObj);
      const schemaJson = JSON.stringify(schema, null, 2);
      this.aceOutputEditor.setValue(schemaJson, -1);
      this.aceOutputEditor.clearSelection();
    }
    catch (error: any) {
      this.aceOutputEditor.setValue('Error: ' + error.message, -1);
      this.aceOutputEditor.clearSelection();
    }
  }

  private inferSchema(obj: any, title: string = 'Root'): any {
    const schema: any = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: title,
      type: this.getType(obj)
    };

    if (obj === null) {
      return { ...schema, type: ['null', 'string', 'number', 'boolean', 'object', 'array'] };
    }

    if (Array.isArray(obj)) {
      if (obj.length > 0) {
        const itemSchemas = obj.map((item, index) => this.inferSchema(item, `Item${index}`));
        const uniqueTypes = [...new Set(itemSchemas.map(s => s.type))];
        if (uniqueTypes.length === 1) {
          schema.items = this.inferSchema(obj[0], 'Item');
        } else {
          schema.items = { anyOf: itemSchemas };
        }
      } else {
        schema.items = {};
      }
    } else if (typeof obj === 'object') {
      schema.properties = {};
      schema.required = [];
      
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          schema.properties[key] = this.inferSchema(obj[key], key);
          schema.required.push(key);
        }
      }
    } else if (typeof obj === 'string') {
      schema.minLength = obj.length;
    } else if (typeof obj === 'number') {
      schema.minimum = obj;
      schema.maximum = obj;
    }

    return schema;
  }

  private getType(value: any): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }

  loadSample() {
    const sample = {
      "name": "John Doe",
      "age": 30,
      "email": "john@example.com",
      "active": true,
      "tags": ["developer", "angular"],
      "address": {
        "street": "123 Main St",
        "city": "New York",
        "zip": 10001
      }
    };
    this.aceInputEditor.setValue(JSON.stringify(sample, null, 2), -1);
    this.aceInputEditor.clearSelection();
    this.generateSchema();
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
        this.generateSchema();
      } catch (error: any) {
        this.showErrorModal('Please upload a valid JSON document.');
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
    this.generateSchema();
  }

  copyToClipboard(): void {
    const outputContent = this.aceOutputEditor.getValue();
    if (!outputContent || outputContent.trim() === '' || outputContent.startsWith('Error')) {
      this.copyErrorMessage = 'Nothing to copy';
      this.copyErrorVisible = true;
      setTimeout(() => {
        this.copyErrorVisible = false;
      }, 3000);
      return;
    }
    
    navigator.clipboard.writeText(outputContent).then(() => {
      this.copySuccessMessage = 'Schema copied to clipboard!';
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

  downloadSchema(): void {
    const outputContent = this.aceOutputEditor.getValue();
    if (!outputContent || outputContent.trim() === '' || outputContent.startsWith('Error')) {
      this.copyErrorMessage = 'Nothing to download';
      this.copyErrorVisible = true;
      setTimeout(() => {
        this.copyErrorVisible = false;
      }, 3000);
      return;
    }
    
    const blob = new Blob([outputContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'schema.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    this.copySuccessMessage = 'Schema downloaded successfully!';
    this.copySuccessVisible = true;
    setTimeout(() => {
      this.copySuccessVisible = false;
    }, 3000);
  }
}

