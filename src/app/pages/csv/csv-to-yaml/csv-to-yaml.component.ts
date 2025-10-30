import { Component, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import * as yaml from 'js-yaml';

declare const ace: any;

@Component({
  selector: 'app-csv-to-yaml',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './csv-to-yaml.component.html',
  styleUrl: './csv-to-yaml.component.css'
})
export class CsvToYamlComponent implements AfterViewInit {
  @ViewChild('inputEditor') private inputEditor!: ElementRef<HTMLElement>;
  @ViewChild('outputEditor') private outputEditor!: ElementRef<HTMLElement>;
  @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;

  private aceInputEditor: any;
  private aceOutputEditor: any;
  private isMobile = false;
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
    this.title.setTitle('CSV to YAML Converter - Convert CSV to YAML Online');
    this.meta.updateTag({
      name: 'description',
      content: 'Convert CSV to YAML online with our fast CSV to YAML converter. Transform CSV files into YAML format instantly for configuration files.'
    });
    this.meta.updateTag({
      name: 'keywords',
      content: 'csv to yaml, csv converter, convert csv to yaml, csv to yaml online'
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
    this.aceOutputEditor.session.setMode('ace/mode/yaml');
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
      this.convertCsvToYaml();
    }, 300);
  }

  private convertCsvToYaml() {
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

      // Convert to YAML
      const yamlOutput = yaml.dump(result, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false
      });
      
      this.aceOutputEditor.setValue(yamlOutput, -1);
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

  loadSampleCsv() {
    const sampleCsv = `id,name,email,age,city,active
1,John Doe,john@example.com,30,New York,true
2,Jane Smith,jane@example.com,28,Los Angeles,true
3,Bob Johnson,bob@example.com,35,Chicago,false
4,Alice Williams,alice@example.com,32,Houston,true`;

    this.aceInputEditor.setValue(sampleCsv, -1);
    this.aceInputEditor.clearSelection();
    this.convertCsvToYaml();
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
      this.convertCsvToYaml();
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
    this.convertCsvToYaml();
  }

  copyToClipboard(): void {
    const outputContent = this.aceOutputEditor.getValue();
    if (!outputContent || outputContent.trim() === '' || outputContent.startsWith('Error')) {
      this.copyErrorMessage = 'Nothing to copy';
      this.copyErrorVisible = true;
      setTimeout(() => this.copyErrorVisible = false, 3000);
      return;
    }
    
    navigator.clipboard.writeText(outputContent).then(() => {
      this.copySuccessMessage = 'YAML copied to clipboard!';
      this.copySuccessVisible = true;
      setTimeout(() => this.copySuccessVisible = false, 3000);
    }).catch(err => {
      this.copyErrorMessage = 'Failed to copy to clipboard';
      this.copyErrorVisible = true;
      setTimeout(() => this.copyErrorVisible = false, 3000);
    });
  }

  downloadYaml(): void {
    const outputContent = this.aceOutputEditor.getValue();
    if (!outputContent || outputContent.trim() === '' || outputContent.startsWith('Error')) {
      this.copyErrorMessage = 'Nothing to download';
      this.copyErrorVisible = true;
      setTimeout(() => this.copyErrorVisible = false, 3000);
      return;
    }
    
    const blob = new Blob([outputContent], { type: 'text/yaml' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'converted.yaml';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    this.copySuccessMessage = 'YAML downloaded successfully!';
    this.copySuccessVisible = true;
    setTimeout(() => this.copySuccessVisible = false, 3000);
  }

  private checkMobileView() {
    this.isMobile = window.innerWidth <= 768;
  }
}

