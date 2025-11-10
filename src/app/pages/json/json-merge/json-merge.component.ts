import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';

declare const ace: any;

@Component({
  selector: 'app-json-merge',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './json-merge.component.html',
  styleUrl: './json-merge.component.css'
})
export class JsonMergeComponent implements AfterViewInit {
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
  mergeMode: 'deep' | 'shallow' = 'deep';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private meta: Meta,
    private title: Title
  ) {
    this.setupMetaTags();
  }

  private setupMetaTags() {
    this.title.setTitle('JSON Merge - Merge Multiple JSON Objects');
    this.meta.updateTag({
      name: 'description',
      content: 'Merge multiple JSON objects into one. Support deep and shallow merge modes.'
    });
    this.meta.updateTag({
      name: 'keywords',
      content: 'json merge, merge json, combine json, json combine, merge json objects'
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
      this.debouncedMerge();
    });

    setTimeout(() => {
      this.aceInputEditor.resize(true);
      this.aceOutputEditor.resize(true);
    }, 100);
  }

  private debouncedMerge() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.merge();
    }, 300);
  }

  setMergeMode(mode: 'deep' | 'shallow') {
    this.mergeMode = mode;
    this.merge();
  }

  private merge() {
    try {
      const input = this.aceInputEditor.getValue().trim();
      if (!input) {
        this.aceOutputEditor.setValue('');
        return;
      }

      // Try to parse as array of JSON objects or single object
      let objects: any[];
      try {
        const parsed = JSON.parse(input);
        if (Array.isArray(parsed)) {
          objects = parsed;
        } else {
          objects = [parsed];
        }
      } catch (e) {
        // Try parsing multiple JSON objects separated by newlines
        const lines = input.split('\n').filter((line: string) => line.trim());
        objects = lines.map((line: string) => JSON.parse(line.trim()));
      }

      if (objects.length === 0) {
        this.aceOutputEditor.setValue('No valid JSON objects found.');
        return;
      }

      let result: any;
      if (this.mergeMode === 'deep') {
        result = this.deepMerge(...objects);
      } else {
        result = Object.assign({}, ...objects);
      }

      const mergedJson = JSON.stringify(result, null, 2);
      this.aceOutputEditor.setValue(mergedJson, -1);
      this.aceOutputEditor.clearSelection();
    }
    catch (error: any) {
      this.aceOutputEditor.setValue('Error: ' + error.message, -1);
      this.aceOutputEditor.clearSelection();
    }
  }

  private deepMerge(...objects: any[]): any {
    const result: any = {};
    
    for (const obj of objects) {
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key]) &&
                typeof result[key] === 'object' && result[key] !== null && !Array.isArray(result[key])) {
              result[key] = this.deepMerge(result[key], obj[key]);
            } else {
              result[key] = obj[key];
            }
          }
        }
      }
    }
    
    return result;
  }

  loadSample() {
    const sample = [
      {
        "name": "John",
        "age": 30,
        "address": {
          "city": "New York",
          "zip": "10001"
        }
      },
      {
        "age": 31,
        "email": "john@example.com",
        "address": {
          "street": "123 Main St",
          "city": "Boston"
        }
      }
    ];
    this.aceInputEditor.setValue(JSON.stringify(sample, null, 2), -1);
    this.aceInputEditor.clearSelection();
    this.merge();
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
        this.merge();
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
    this.merge();
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
      this.copySuccessMessage = 'Merged JSON copied to clipboard!';
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

  downloadResult(): void {
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
    link.download = 'merged.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    this.copySuccessMessage = 'Merged JSON downloaded successfully!';
    this.copySuccessVisible = true;
    setTimeout(() => {
      this.copySuccessVisible = false;
    }, 3000);
  }
}

