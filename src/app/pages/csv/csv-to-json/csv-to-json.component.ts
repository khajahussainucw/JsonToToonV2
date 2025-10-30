import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';

declare const ace: any;

@Component({
  selector: 'app-csv-to-json',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './csv-to-json.component.html',
  styleUrl: './csv-to-json.component.css'
})
export class CsvToJsonComponent implements AfterViewInit {
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
    this.title.setTitle('CSV to JSON Converter - Convert CSV to JSON Online');
    this.meta.updateTag({
      name: 'description',
      content: 'Convert CSV to JSON online with our fast CSV to JSON converter. Transform CSV files from Excel and Google Sheets into JSON format instantly.'
    });
    this.meta.updateTag({
      name: 'keywords',
      content: 'csv to json, csv converter, convert csv to json, csv to json online, csv parser'
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

    // Initialize input editor for CSV
    this.aceInputEditor = ace.edit(this.inputEditor.nativeElement);
    this.aceInputEditor.setTheme('ace/theme/github');
    this.aceInputEditor.session.setMode('ace/mode/text');
    this.aceInputEditor.setOptions({
      useWrapMode: true,
      fontSize: '14px',
      showPrintMargin: false,
    });
    this.aceInputEditor.getSession().setUseWrapMode(true);

    // Initialize output editor for JSON
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
      this.debouncedConvertCsv();
    });

    // Force resize after initialization
    setTimeout(() => {
      this.aceInputEditor.resize(true);
      this.aceOutputEditor.resize(true);
    }, 100);
  }

  private debouncedConvertCsv() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.convertCsvToJson();
    }, 300);
  }

  private convertCsvToJson() {
    try {
      const inputCsv = this.aceInputEditor.getValue().trim();
      if (!inputCsv) {
        this.aceOutputEditor.setValue('');
        return;
      }

      const lines = inputCsv.split('\n');
      if (lines.length < 2) {
        this.aceOutputEditor.setValue('Error: CSV must have at least a header row and one data row', -1);
        this.aceOutputEditor.clearSelection();
        return;
      }

      // Parse header
      const headers = this.parseCsvLine(lines[0]);
      
      // Parse data rows
      const result: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = this.parseCsvLine(line);
        const obj: any = {};
        
        headers.forEach((header, index) => {
          let value: any = values[index] || '';
          
          // Try to parse as number
          if (value && !isNaN(value)) {
            value = parseFloat(value);
          }
          // Try to parse as boolean
          else if (value.toLowerCase() === 'true') {
            value = true;
          }
          else if (value.toLowerCase() === 'false') {
            value = false;
          }
          // Try to parse as null
          else if (value.toLowerCase() === 'null' || value === '') {
            value = null;
          }
          
          obj[header] = value;
        });
        
        result.push(obj);
      }

      const formattedJson = JSON.stringify(result, null, 2);
      this.aceOutputEditor.setValue(formattedJson, -1);
      this.aceOutputEditor.clearSelection();
    }
    catch (error: any) {
      this.aceOutputEditor.setValue('Error parsing CSV: ' + error.message, -1);
      this.aceOutputEditor.clearSelection();
      return;
    }
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
          // Escaped quote
          current += '"';
          i++;
        } else {
          // Toggle quotes
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add the last field
    result.push(current.trim());
    
    return result;
  }

  loadSampleCsv() {
    const sampleCsv = `id,name,email,age,city,active
1,John Doe,john@example.com,30,New York,true
2,Jane Smith,jane@example.com,28,Los Angeles,true
3,Bob Johnson,bob@example.com,35,Chicago,false
4,Alice Williams,alice@example.com,32,Houston,true`;

    this.aceInputEditor.setValue(sampleCsv, -1);
    this.aceInputEditor.clearSelection();
    this.convertCsvToJson();
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
      this.convertCsvToJson();
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
    this.convertCsvToJson();
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

  downloadJson(): void {
    const outputContent = this.aceOutputEditor.getValue();
    if (!outputContent || outputContent.trim() === '' || outputContent.startsWith('Error')) {
      this.copyErrorMessage = 'Nothing to download';
      this.copyErrorVisible = true;
      setTimeout(() => {
        this.copyErrorVisible = false;
      }, 3000);
      return;
    }
    
    try {
      JSON.parse(outputContent);
      
      const blob = new Blob([outputContent], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'converted.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      this.copySuccessMessage = 'JSON downloaded successfully!';
      this.copySuccessVisible = true;
      setTimeout(() => {
        this.copySuccessVisible = false;
      }, 3000);
    } catch (error: any) {
      this.copyErrorMessage = 'Cannot download invalid JSON';
      this.copyErrorVisible = true;
      setTimeout(() => {
        this.copyErrorVisible = false;
      }, 3000);
    }
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


