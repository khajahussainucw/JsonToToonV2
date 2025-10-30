import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import * as yaml from 'js-yaml';

declare const ace: any;

@Component({
  selector: 'app-yaml-to-csv',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './yaml-to-csv.component.html',
  styleUrl: './yaml-to-csv.component.css'
})
export class YamlToCsvComponent implements AfterViewInit {
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
    this.title.setTitle('YAML to CSV Converter - Convert YAML to CSV Online');
    this.meta.updateTag({
      name: 'description',
      content: 'Convert YAML to CSV online with our fast YAML to CSV converter. Transform YAML arrays into CSV format for Excel and data analysis.'
    });
    this.meta.updateTag({
      name: 'keywords',
      content: 'yaml to csv, yaml converter, convert yaml to csv, yaml to csv online'
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
    this.aceInputEditor.session.setMode('ace/mode/yaml');
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
      this.convertYamlToCsv();
    }, 300);
  }

  private convertYamlToCsv() {
    try {
      const inputYaml = this.aceInputEditor.getValue().trim();
      if (!inputYaml) {
        this.aceOutputEditor.setValue('');
        return;
      }

      const parsedYaml = yaml.load(inputYaml);
      
      if (!Array.isArray(parsedYaml)) {
        this.aceOutputEditor.setValue('Error: YAML must be an array of objects to convert to CSV', -1);
        this.aceOutputEditor.clearSelection();
        return;
      }

      if (parsedYaml.length === 0) {
        this.aceOutputEditor.setValue('Error: YAML array is empty', -1);
        this.aceOutputEditor.clearSelection();
        return;
      }

      const allKeys = new Set<string>();
      parsedYaml.forEach((item: any) => {
        if (typeof item === 'object' && item !== null) {
          Object.keys(item).forEach(key => allKeys.add(key));
        }
      });

      const headers = Array.from(allKeys);
      let csv = headers.map(h => this.escapeCsvValue(h)).join(',') + '\n';
      
      parsedYaml.forEach((item: any) => {
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
      this.aceOutputEditor.setValue('Invalid YAML: ' + error.message, -1);
      this.aceOutputEditor.clearSelection();
    }
  }

  private escapeCsvValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return '"' + value.replace(/"/g, '""') + '"';
    }
    return value;
  }

  loadSampleYaml() {
    const sampleYaml = `- name: John Doe
  email: john@example.com
  age: 30
  city: New York
  active: true
- name: Jane Smith
  email: jane@example.com
  age: 28
  city: Los Angeles
  active: true
- name: Bob Johnson
  email: bob@example.com
  age: 35
  city: Chicago
  active: false`;

    this.aceInputEditor.setValue(sampleYaml, -1);
    this.aceInputEditor.clearSelection();
    this.convertYamlToCsv();
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
        yaml.load(content);
        this.aceInputEditor.setValue(content, -1);
        this.aceInputEditor.clearSelection();
        this.convertYamlToCsv();
      } catch (error: any) {
        this.showErrorModal('Please upload a valid YAML document.');
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
    this.convertYamlToCsv();
  }

  copyToClipboard(): void {
    const outputContent = this.aceOutputEditor.getValue();
    if (!outputContent || outputContent.trim() === '' || outputContent.startsWith('Invalid YAML') || outputContent.startsWith('Error:')) {
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
    if (!outputContent || outputContent.trim() === '' || outputContent.startsWith('Invalid YAML') || outputContent.startsWith('Error:')) {
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

