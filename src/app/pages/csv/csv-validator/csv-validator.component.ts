import { Component, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';

declare const ace: any;

interface ValidationResult {
  valid: boolean;
  message: string;
  rowCount?: number;
  columnCount?: number;
  errors?: string[];
}

@Component({
  selector: 'app-csv-validator',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './csv-validator.component.html',
  styleUrl: './csv-validator.component.css'
})
export class CsvValidatorComponent implements AfterViewInit {
  @ViewChild('inputEditor') private inputEditor!: ElementRef<HTMLElement>;
  @ViewChild('outputEditor') private outputEditor!: ElementRef<HTMLElement>;
  @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;

  private aceInputEditor: any;
  private aceOutputEditor: any;
  private isMobile = false;
  private debounceTimer: any;
  
  validationResult: ValidationResult = { valid: false, message: '' };
  showValidationResult = false;
  
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
    this.title.setTitle('CSV Validator - Validate CSV Files Online');
    this.meta.updateTag({
      name: 'description',
      content: 'Validate CSV files online. Check for syntax errors, missing fields, inconsistent columns, and structure issues in your CSV data.'
    });
    this.meta.updateTag({
      name: 'keywords',
      content: 'csv validator, validate csv, csv checker, csv lint, csv validation online'
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
    if (typeof ace === 'undefined') {
      console.error('Ace editor is not loaded');
      return;
    }

    this.aceInputEditor = ace.edit(this.inputEditor.nativeElement);
    this.aceInputEditor.setTheme('ace/theme/github');
    this.aceInputEditor.session.setMode('ace/mode/text');
    this.aceInputEditor.setOptions({
      useWrapMode: true,
      fontSize: '14px',
      showPrintMargin: false,
    });
    this.aceInputEditor.getSession().setUseWrapMode(true);

    this.aceOutputEditor = ace.edit(this.outputEditor.nativeElement);
    this.aceOutputEditor.setTheme('ace/theme/github');
    this.aceOutputEditor.session.setMode('ace/mode/text');
    this.aceOutputEditor.setOptions({
      useWrapMode: true,
      fontSize: '14px',
      showPrintMargin: false,
      readOnly: true
    });
    this.aceOutputEditor.getSession().setUseWrapMode(true);

    this.aceInputEditor.session.on('change', () => {
      this.debouncedValidate();
    });

    setTimeout(() => {
      this.aceInputEditor.resize(true);
      this.aceOutputEditor.resize(true);
    }, 100);
  }

  private debouncedValidate() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.validateCsv();
    }, 500);
  }

  private validateCsv() {
    const inputCsv = this.aceInputEditor.getValue().trim();
    
    if (!inputCsv) {
      this.validationResult = { valid: false, message: 'Please enter CSV to validate' };
      this.showValidationResult = false;
      this.aceOutputEditor.setValue('');
      return;
    }

    try {
      const lines = inputCsv.split('\n').filter((line: string) => line.trim() !== '');
      
      if (lines.length < 2) {
        this.validationResult = {
          valid: false,
          message: 'CSV must have at least a header row and one data row',
          errors: ['Only ' + lines.length + ' line(s) found']
        };
        this.showValidationResult = true;
        this.displayValidationResult();
        return;
      }

      // Parse header
      const headerFields = this.parseCsvLine(lines[0]);
      const columnCount = headerFields.length;
      const errors: string[] = [];

      // Check for duplicate headers
      const headerSet = new Set(headerFields);
      if (headerSet.size !== headerFields.length) {
        errors.push('Duplicate column names found in header');
      }

      // Check for empty headers
      if (headerFields.some(h => h.trim() === '')) {
        errors.push('Empty column names in header');
      }

      // Validate each data row
      for (let i = 1; i < lines.length; i++) {
        const fields = this.parseCsvLine(lines[i]);
        
        if (fields.length !== columnCount) {
          errors.push(`Row ${i + 1}: Expected ${columnCount} columns, found ${fields.length}`);
        }
      }

      if (errors.length > 0) {
        this.validationResult = {
          valid: false,
          message: `Found ${errors.length} error(s)`,
          rowCount: lines.length,
          columnCount: columnCount,
          errors: errors
        };
      } else {
        this.validationResult = {
          valid: true,
          message: 'Valid CSV',
          rowCount: lines.length,
          columnCount: columnCount
        };
      }

      this.showValidationResult = true;
      this.displayValidationResult();
    } catch (error: any) {
      this.validationResult = {
        valid: false,
        message: 'Error parsing CSV',
        errors: [error.message]
      };
      this.showValidationResult = true;
      this.displayValidationResult();
    }
  }

  private displayValidationResult() {
    let output = '';
    
    if (this.validationResult.valid) {
      output = '✓ VALID CSV\n\n';
      output += `Total Rows: ${this.validationResult.rowCount}\n`;
      output += `Total Columns: ${this.validationResult.columnCount}\n`;
      output += '\nNo issues found!';
    } else {
      output = '✗ INVALID CSV\n\n';
      if (this.validationResult.rowCount) {
        output += `Total Rows: ${this.validationResult.rowCount}\n`;
      }
      if (this.validationResult.columnCount) {
        output += `Total Columns: ${this.validationResult.columnCount}\n`;
      }
      output += '\nErrors:\n';
      if (this.validationResult.errors) {
        this.validationResult.errors.forEach((error, index) => {
          output += `  ${index + 1}. ${error}\n`;
        });
      } else {
        output += `  ${this.validationResult.message}\n`;
      }
    }

    this.aceOutputEditor.setValue(output, -1);
    this.aceOutputEditor.clearSelection();
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  loadValidSample() {
    const sampleCsv = `id,name,email,age,city
1,John Doe,john@example.com,30,New York
2,Jane Smith,jane@example.com,28,Los Angeles
3,Bob Johnson,bob@example.com,35,Chicago`;

    this.aceInputEditor.setValue(sampleCsv, -1);
    this.aceInputEditor.clearSelection();
    this.validateCsv();
  }

  loadInvalidSample() {
    const invalidCsv = `id,name,email,age,city
1,John Doe,john@example.com,30
2,Jane Smith,jane@example.com,28,Los Angeles,Extra
3,,bob@example.com,35,Chicago`;

    this.aceInputEditor.setValue(invalidCsv, -1);
    this.aceInputEditor.clearSelection();
    this.validateCsv();
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
      this.validateCsv();
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
      setTimeout(() => this.copyErrorVisible = false, 3000);
      return;
    }
    
    navigator.clipboard.writeText(inputContent).then(() => {
      this.copySuccessMessage = 'CSV copied to clipboard!';
      this.copySuccessVisible = true;
      setTimeout(() => this.copySuccessVisible = false, 3000);
    }).catch(err => {
      this.copyErrorMessage = 'Failed to copy to clipboard';
      this.copyErrorVisible = true;
      setTimeout(() => this.copyErrorVisible = false, 3000);
    });
  }

  private checkMobileView() {
    this.isMobile = window.innerWidth <= 768;
  }
}

