import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import * as TOML from 'smol-toml';

declare const ace: any;

@Component({
  selector: 'app-toml-to-csv',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './toml-to-csv.component.html',
  styleUrl: './toml-to-csv.component.css'
})
export class TomlToCsvComponent implements AfterViewInit {
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
    this.title.setTitle('TOML to CSV Converter - Convert TOML to CSV Online');
    this.meta.updateTag({
      name: 'description',
      content: 'Convert TOML to CSV online with our fast TOML to CSV converter. Transform TOML data into CSV format for Excel and data analysis.'
    });
    this.meta.updateTag({
      name: 'keywords',
      content: 'toml to csv, toml converter, convert toml to csv, toml to csv online'
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
    if (typeof window === 'undefined' || typeof ace === 'undefined') {
      console.error('Ace editor is not loaded');
      return;
    }

    this.aceInputEditor = ace.edit(this.inputEditor.nativeElement);
    this.aceInputEditor.setTheme('ace/theme/github');
    this.aceInputEditor.session.setMode('ace/mode/toml');
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
      this.convertTomlToCsv();
    }, 300);
  }

  private convertTomlToCsv() {
    try {
      const inputToml = this.aceInputEditor.getValue().trim();
      if (!inputToml) {
        this.aceOutputEditor.setValue('');
        return;
      }

      const parsedToml = TOML.parse(inputToml);
      
      // Try to find an array in the TOML object
      let dataArray: any[] = [];
      if (Array.isArray(parsedToml)) {
        dataArray = parsedToml;
      } else if (typeof parsedToml === 'object' && parsedToml !== null) {
        // Find first array in the object
        for (const key in parsedToml) {
          if (Array.isArray(parsedToml[key])) {
            dataArray = parsedToml[key];
            break;
          }
        }
      }

      if (dataArray.length === 0) {
        this.aceOutputEditor.setValue('Error: TOML must contain an array of objects to convert to CSV', -1);
        this.aceOutputEditor.clearSelection();
        return;
      }

      const allKeys = new Set<string>();
      dataArray.forEach((item: any) => {
        if (typeof item === 'object' && item !== null) {
          Object.keys(item).forEach(key => allKeys.add(key));
        }
      });

      const headers = Array.from(allKeys);
      let csv = headers.map(h => this.escapeCsvValue(h)).join(',') + '\n';
      
      dataArray.forEach((item: any) => {
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
      this.aceOutputEditor.setValue('Invalid TOML: ' + error.message, -1);
      this.aceOutputEditor.clearSelection();
    }
  }

  private escapeCsvValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return '"' + value.replace(/"/g, '""') + '"';
    }
    return value;
  }

  loadSampleToml() {
    const sampleToml = `[[users]]
name = "John Doe"
email = "john@example.com"
age = 30
city = "New York"
active = true

[[users]]
name = "Jane Smith"
email = "jane@example.com"
age = 28
city = "Los Angeles"
active = true

[[users]]
name = "Bob Johnson"
email = "bob@example.com"
age = 35
city = "Chicago"
active = false`;

    this.aceInputEditor.setValue(sampleToml, -1);
    this.aceInputEditor.clearSelection();
    this.convertTomlToCsv();
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
        TOML.parse(content);
        this.aceInputEditor.setValue(content, -1);
        this.aceInputEditor.clearSelection();
        this.convertTomlToCsv();
      } catch (error: any) {
        this.showErrorModal('Please upload a valid TOML document.');
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
    this.convertTomlToCsv();
  }

  copyToClipboard(): void {
    const outputContent = this.aceOutputEditor.getValue();
    if (!outputContent || outputContent.trim() === '' || outputContent.startsWith('Invalid TOML') || outputContent.startsWith('Error:')) {
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
    if (!outputContent || outputContent.trim() === '' || outputContent.startsWith('Invalid TOML') || outputContent.startsWith('Error:')) {
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
}

