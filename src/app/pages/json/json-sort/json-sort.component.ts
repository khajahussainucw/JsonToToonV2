import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';

declare const ace: any;

@Component({
  selector: 'app-json-sort',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './json-sort.component.html',
  styleUrl: './json-sort.component.css'
})
export class JsonSortComponent implements AfterViewInit {
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
    this.title.setTitle('JSON Sort - Sort JSON Object Keys Alphabetically');
    this.meta.updateTag({
      name: 'description',
      content: 'Sort JSON object keys alphabetically. Organize your JSON data with sorted keys.'
    });
    this.meta.updateTag({
      name: 'keywords',
      content: 'json sort, sort json, json key sort, sort json keys, json alphabetize'
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
      this.debouncedSort();
    });

    setTimeout(() => {
      this.aceInputEditor.resize(true);
      this.aceOutputEditor.resize(true);
    }, 100);
  }

  private debouncedSort() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.sort();
    }, 300);
  }

  private sort() {
    try {
      const input = this.aceInputEditor.getValue().trim();
      if (!input) {
        this.aceOutputEditor.setValue('');
        return;
      }

      const jsonObj = JSON.parse(input);
      const sorted = this.sortObjectKeys(jsonObj);
      const sortedJson = JSON.stringify(sorted, null, 2);
      this.aceOutputEditor.setValue(sortedJson, -1);
      this.aceOutputEditor.clearSelection();
    }
    catch (error: any) {
      this.aceOutputEditor.setValue('Error: ' + error.message, -1);
      this.aceOutputEditor.clearSelection();
    }
  }

  private sortObjectKeys(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObjectKeys(item));
    } else if (obj !== null && typeof obj === 'object') {
      const sorted: any = {};
      const keys = Object.keys(obj).sort();
      for (const key of keys) {
        sorted[key] = this.sortObjectKeys(obj[key]);
      }
      return sorted;
    }
    return obj;
  }

  loadSample() {
    const sample = {
      "zebra": "animal",
      "apple": "fruit",
      "banana": "fruit",
      "name": "John",
      "age": 30,
      "address": {
        "city": "New York",
        "street": "123 Main St",
        "zip": 10001
      }
    };
    this.aceInputEditor.setValue(JSON.stringify(sample, null, 2), -1);
    this.aceInputEditor.clearSelection();
    this.sort();
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
        this.sort();
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
    this.sort();
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
      this.copySuccessMessage = 'Sorted JSON copied to clipboard!';
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
    link.download = 'sorted.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    this.copySuccessMessage = 'Sorted JSON downloaded successfully!';
    this.copySuccessVisible = true;
    setTimeout(() => {
      this.copySuccessVisible = false;
    }, 3000);
  }
}

