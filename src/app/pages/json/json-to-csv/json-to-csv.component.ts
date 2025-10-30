import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';

declare const ace: any;

@Component({
  selector: 'app-json-to-csv',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './json-to-csv.component.html',
  styleUrl: './json-to-csv.component.css'
})
export class JsonToCsvComponent implements AfterViewInit {
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
    this.title.setTitle('JSON to CSV Converter - Convert JSON to CSV Online');
    this.meta.updateTag({
      name: 'description',
      content: 'Convert JSON to CSV online with our fast JSON to CSV converter. Transform JSON arrays into CSV format for Excel, Google Sheets, and data analysis.'
    });
    this.meta.updateTag({
      name: 'keywords',
      content: 'json to csv, json converter, convert json to csv, json to csv online, json array to csv'
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
    if (typeof ace === 'undefined') {
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

    // Initialize output editor for CSV
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

    // Add change listener to input editor
    this.aceInputEditor.session.on('change', () => {
      this.debouncedConvertJson();
    });

    // Force resize after initialization
    setTimeout(() => {
      this.aceInputEditor.resize(true);
      this.aceOutputEditor.resize(true);
    }, 100);
  }

  private debouncedConvertJson() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.convertJsonToCsv();
    }, 300);
  }

  private convertJsonToCsv() {
    try {
      const inputJson = this.aceInputEditor.getValue().trim();
      if (!inputJson) {
        this.aceOutputEditor.setValue('');
        return;
      }

      const parsedJson = JSON.parse(inputJson);
      
      // Check if it's an array
      if (!Array.isArray(parsedJson)) {
        this.aceOutputEditor.setValue('Error: JSON must be an array of objects to convert to CSV', -1);
        this.aceOutputEditor.clearSelection();
        return;
      }

      if (parsedJson.length === 0) {
        this.aceOutputEditor.setValue('Error: JSON array is empty', -1);
        this.aceOutputEditor.clearSelection();
        return;
      }

      // Get all unique keys from all objects
      const allKeys = new Set<string>();
      parsedJson.forEach((item: any) => {
        if (typeof item === 'object' && item !== null) {
          Object.keys(item).forEach(key => allKeys.add(key));
        }
      });

      const headers = Array.from(allKeys);
      
      // Create CSV
      let csv = headers.map(h => this.escapeCsvValue(h)).join(',') + '\n';
      
      parsedJson.forEach((item: any) => {
        const row = headers.map(header => {
          const value = item[header];
          if (value === undefined || value === null) {
            return '';
          }
          if (typeof value === 'object') {
            return this.escapeCsvValue(JSON.stringify(value));
          }
          return this.escapeCsvValue(String(value));
        });
        csv += row.join(',') + '\n';
      });

      this.aceOutputEditor.setValue(csv, -1);
      this.aceOutputEditor.clearSelection();
    }
    catch (error: any) {
      this.aceOutputEditor.setValue('Invalid JSON: ' + error.message, -1);
      this.aceOutputEditor.clearSelection();
      return;
    }
  }

  private escapeCsvValue(value: string): string {
    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return '"' + value.replace(/"/g, '""') + '"';
    }
    return value;
  }

  loadSampleJson() {
    const sampleJson = [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "age": 30,
        "city": "New York",
        "active": true
      },
      {
        "id": 2,
        "name": "Jane Smith",
        "email": "jane@example.com",
        "age": 28,
        "city": "Los Angeles",
        "active": true
      },
      {
        "id": 3,
        "name": "Bob Johnson",
        "email": "bob@example.com",
        "age": 35,
        "city": "Chicago",
        "active": false
      },
      {
        "id": 4,
        "name": "Alice Williams",
        "email": "alice@example.com",
        "age": 32,
        "city": "Houston",
        "active": true
      }
    ];

    this.aceInputEditor.setValue(JSON.stringify(sampleJson, null, 2), -1);
    this.aceInputEditor.clearSelection();
    this.convertJsonToCsv();
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
        this.convertJsonToCsv();
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
    this.convertJsonToCsv();
  }

  copyToClipboard(): void {
    const outputContent = this.aceOutputEditor.getValue();
    if (!outputContent || outputContent.trim() === '' || outputContent.startsWith('Invalid JSON') || outputContent.startsWith('Error:')) {
      this.copyErrorMessage = 'Nothing to copy';
      this.copyErrorVisible = true;
      setTimeout(() => {
        this.copyErrorVisible = false;
      }, 3000);
      return;
    }
    
    navigator.clipboard.writeText(outputContent).then(() => {
      this.copySuccessMessage = 'CSV copied to clipboard!';
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

  downloadCsv(): void {
    const outputContent = this.aceOutputEditor.getValue();
    if (!outputContent || outputContent.trim() === '' || outputContent.startsWith('Invalid JSON') || outputContent.startsWith('Error:')) {
      this.copyErrorMessage = 'Nothing to download';
      this.copyErrorVisible = true;
      setTimeout(() => {
        this.copyErrorVisible = false;
      }, 3000);
      return;
    }
    
    const blob = new Blob([outputContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'converted.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    this.copySuccessMessage = 'CSV downloaded successfully!';
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


