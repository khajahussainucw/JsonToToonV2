import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';

declare const ace: any;

interface ValidationResult {
  valid: boolean;
  message: string;
  error?: any;
  lineNumber?: number;
}

@Component({
  selector: 'app-json-validator',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './json-validator.component.html',
  styleUrl: './json-validator.component.css'
})
export class JsonValidatorComponent implements AfterViewInit {
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
  
  // Validation state
  validationResult: ValidationResult = { valid: false, message: '' };
  showValidationResult = false;
  
  // Modal dialog state
  errorModalVisible = false;
  errorMessage = '';
  
  // Copy success message state
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
    this.title.setTitle('JSON Validator - Validate JSON Syntax Online');
    this.meta.updateTag({
      name: 'description',
      content: 'Validate JSON syntax online with our fast JSON validator tool. Check for syntax errors, formatting issues, and data type problems in your JSON files.'
    });
    this.meta.updateTag({
      name: 'keywords',
      content: 'json validator, json validation, validate json, json syntax checker, json lint, json online validator'
    });
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.initializeEditor();
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

  private initializeEditor() {
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

    // Initialize output editor for validation result
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

    // Add change listener to input editor
    this.aceInputEditor.session.on('change', () => {
      this.debouncedValidate();
    });

    // Force resize after initialization
    setTimeout(() => {
      this.aceInputEditor.resize(true);
      this.aceOutputEditor.resize(true);
    }, 100);
  }

  private debouncedValidate() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.validateJson();
    }, 500);
  }

  private validateJson() {
    const inputJson = this.aceInputEditor.getValue().trim();
    
    if (!inputJson) {
      this.validationResult = { valid: false, message: 'Please enter JSON to validate' };
      this.showValidationResult = false;
      this.aceOutputEditor.setValue('');
      return;
    }

    try {
      // Parse JSON to validate it
      const parsed = JSON.parse(inputJson);
      
      // Build success message
      let outputMessage = '✓ VALID JSON\n\n';
      
      // Check if it's empty
      if (parsed === null || parsed === undefined) {
        outputMessage += 'Document Type: Null\n';
      } else {
        // Count items for additional info
        if (typeof parsed === 'object') {
          if (Array.isArray(parsed)) {
            outputMessage += `Document Type: Array\n`;
            outputMessage += `Item Count: ${parsed.length}\n`;
          } else {
            const keys = Object.keys(parsed);
            outputMessage += `Document Type: Object\n`;
            outputMessage += `Key Count: ${keys.length}\n`;
            outputMessage += `\nKeys:\n${keys.map(k => `  - ${k}`).join('\n')}`;
          }
        } else {
          outputMessage += `Document Type: ${typeof parsed}\n`;
          outputMessage += `Value: ${parsed}`;
        }
      }
      
      this.validationResult = { 
        valid: true, 
        message: 'Valid JSON'
      };
      this.showValidationResult = true;
      this.aceOutputEditor.setValue(outputMessage, -1);
      this.aceOutputEditor.clearSelection();
    } catch (error: any) {
      // Extract line number and position from error message
      let lineNumber: number | undefined;
      const positionMatch = error.message.match(/position (\d+)/i);
      if (positionMatch) {
        const position = parseInt(positionMatch[1], 10);
        const textBeforeError = inputJson.substring(0, position);
        lineNumber = (textBeforeError.match(/\n/g) || []).length + 1;
      }
      
      let errorMessage = '✗ INVALID JSON\n\n';
      errorMessage += `Error: ${error.message || 'Invalid JSON syntax'}\n`;
      if (lineNumber) {
        errorMessage += `Approximate Line: ${lineNumber}\n`;
      }
      errorMessage += '\nCommon Issues:\n';
      errorMessage += '  - Missing or extra commas\n';
      errorMessage += '  - Unquoted property names\n';
      errorMessage += '  - Single quotes instead of double quotes\n';
      errorMessage += '  - Trailing commas\n';
      errorMessage += '  - Unmatched brackets or braces';
      
      this.validationResult = { 
        valid: false, 
        message: error.message || 'Invalid JSON syntax',
        error: error,
        lineNumber: lineNumber
      };
      this.showValidationResult = true;
      this.aceOutputEditor.setValue(errorMessage, -1);
      this.aceOutputEditor.clearSelection();
    }
  }

  loadSampleJson() {
    const sampleJson = `{
  "server": {
    "host": "localhost",
    "port": 8080,
    "ssl": true
  },
  "database": {
    "connection": {
      "host": "db.example.com",
      "port": 5432,
      "username": "admin",
      "password": "secret123"
    },
    "pool": {
      "min": 5,
      "max": 20
    }
  },
  "users": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "role": "admin",
      "active": true
    },
    {
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "user",
      "active": true
    }
  ]
}`;

    this.aceInputEditor.setValue(sampleJson, -1);
    this.aceInputEditor.clearSelection();
    this.validateJson();
  }

  loadInvalidSample() {
    const invalidJson = `{
  "server": {
    "host": "localhost",
    "port": 8080,
    "ssl": true,
  },
  "users": [
    {
      "name": "John Doe",
      email: "john@example.com"
    },
    {
      "name": 'Jane Smith',
      "email": "jane@example.com",
    }
  ]
}`;

    this.aceInputEditor.setValue(invalidJson, -1);
    this.aceInputEditor.clearSelection();
    this.validateJson();
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
      this.validateJson();
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
    this.aceOutputEditor.setValue('');
    this.showValidationResult = false;
  }

  copyToClipboard(): void {
    const inputContent = this.aceInputEditor.getValue();
    if (!inputContent || inputContent.trim() === '') {
      this.copyErrorMessage = 'Nothing to copy';
      this.copyErrorVisible = true;
      setTimeout(() => {
        this.copyErrorVisible = false;
      }, 3000);
      return;
    }
    
    navigator.clipboard.writeText(inputContent).then(() => {
      this.copySuccessMessage = 'JSON copied to clipboard!';
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


