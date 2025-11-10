import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';

declare const ace: any;

@Component({
  selector: 'app-json-diff',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './json-diff.component.html',
  styleUrl: './json-diff.component.css'
})
export class JsonDiffComponent implements AfterViewInit {
  @ViewChild('inputEditor1') private inputEditor1!: ElementRef<HTMLElement>;
  @ViewChild('inputEditor2') private inputEditor2!: ElementRef<HTMLElement>;
  @ViewChild('outputEditor') private outputEditor!: ElementRef<HTMLElement>;
  @ViewChild('fileInput1') private fileInput1!: ElementRef<HTMLInputElement>;
  @ViewChild('fileInput2') private fileInput2!: ElementRef<HTMLInputElement>;

  private aceInputEditor1: any;
  private aceInputEditor2: any;
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
    this.title.setTitle('JSON Diff / Compare - Compare Two JSON Objects');
    this.meta.updateTag({
      name: 'description',
      content: 'Compare two JSON objects and find differences. Highlight changes, additions, and deletions.'
    });
    this.meta.updateTag({
      name: 'keywords',
      content: 'json diff, json compare, compare json, json difference, json diff tool'
    });
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.initializeEditors();
        window.addEventListener('resize', () => {
          if (this.aceInputEditor1) this.aceInputEditor1.resize();
          if (this.aceInputEditor2) this.aceInputEditor2.resize();
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

    this.aceInputEditor1 = ace.edit(this.inputEditor1.nativeElement);
    this.aceInputEditor1.setTheme('ace/theme/github');
    this.aceInputEditor1.session.setMode('ace/mode/json');
    this.aceInputEditor1.setOptions({
      useWrapMode: true,
      fontSize: '14px',
      showPrintMargin: false,
    });
    this.aceInputEditor1.getSession().setUseWrapMode(true);

    this.aceInputEditor2 = ace.edit(this.inputEditor2.nativeElement);
    this.aceInputEditor2.setTheme('ace/theme/github');
    this.aceInputEditor2.session.setMode('ace/mode/json');
    this.aceInputEditor2.setOptions({
      useWrapMode: true,
      fontSize: '14px',
      showPrintMargin: false,
    });
    this.aceInputEditor2.getSession().setUseWrapMode(true);

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

    this.aceInputEditor1.session.on('change', () => {
      this.debouncedCompare();
    });

    this.aceInputEditor2.session.on('change', () => {
      this.debouncedCompare();
    });

    setTimeout(() => {
      this.aceInputEditor1.resize(true);
      this.aceInputEditor2.resize(true);
      this.aceOutputEditor.resize(true);
    }, 100);
  }

  private debouncedCompare() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.compare();
    }, 300);
  }

  private compare() {
    try {
      const json1Str = this.aceInputEditor1.getValue().trim();
      const json2Str = this.aceInputEditor2.getValue().trim();

      if (!json1Str && !json2Str) {
        this.aceOutputEditor.setValue('');
        return;
      }

      if (!json1Str || !json2Str) {
        this.aceOutputEditor.setValue('Please provide both JSON objects to compare.');
        return;
      }

      const obj1 = JSON.parse(json1Str);
      const obj2 = JSON.parse(json2Str);

      const diff = this.getDiff(obj1, obj2);
      const diffJson = JSON.stringify(diff, null, 2);
      this.aceOutputEditor.setValue(diffJson, -1);
      this.aceOutputEditor.clearSelection();
    }
    catch (error: any) {
      this.aceOutputEditor.setValue('Error: ' + error.message, -1);
      this.aceOutputEditor.clearSelection();
    }
  }

  private getDiff(obj1: any, obj2: any, path: string = ''): any {
    const diff: any = {};
    const allKeys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);

    for (const key of allKeys) {
      const currentPath = path ? `${path}.${key}` : key;
      const val1 = obj1?.[key];
      const val2 = obj2?.[key];

      if (!(key in obj1)) {
        diff[`+ ${key}`] = val2;
      } else if (!(key in obj2)) {
        diff[`- ${key}`] = val1;
      } else if (typeof val1 === 'object' && typeof val2 === 'object' && 
                 val1 !== null && val2 !== null && 
                 !Array.isArray(val1) && !Array.isArray(val2)) {
        const nestedDiff = this.getDiff(val1, val2, currentPath);
        if (Object.keys(nestedDiff).length > 0) {
          diff[key] = nestedDiff;
        }
      } else if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        diff[key] = {
          '-': val1,
          '+': val2
        };
      }
    }

    return diff;
  }

  loadSample() {
    const sample1 = {
      "name": "John",
      "age": 30,
      "city": "New York",
      "hobbies": ["reading", "coding"]
    };
    const sample2 = {
      "name": "John",
      "age": 31,
      "city": "Boston",
      "hobbies": ["reading", "coding", "gaming"],
      "email": "john@example.com"
    };
    this.aceInputEditor1.setValue(JSON.stringify(sample1, null, 2), -1);
    this.aceInputEditor2.setValue(JSON.stringify(sample2, null, 2), -1);
    this.aceInputEditor1.clearSelection();
    this.aceInputEditor2.clearSelection();
    this.compare();
  }

  triggerFileUpload(editor: number): void {
    if (editor === 1) {
      this.fileInput1.nativeElement.value = '';
      this.fileInput1.nativeElement.click();
    } else {
      this.fileInput2.nativeElement.value = '';
      this.fileInput2.nativeElement.click();
    }
  }

  onFileSelected(event: Event, editor: number): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      try {
        const parsed = JSON.parse(content);
        const formatted = JSON.stringify(parsed, null, 2);
        if (editor === 1) {
          this.aceInputEditor1.setValue(formatted, -1);
          this.aceInputEditor1.clearSelection();
        } else {
          this.aceInputEditor2.setValue(formatted, -1);
          this.aceInputEditor2.clearSelection();
        }
        this.compare();
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

  clearInput(editor: number): void {
    if (editor === 1) {
      this.aceInputEditor1.setValue('', -1);
      this.aceInputEditor1.clearSelection();
    } else {
      this.aceInputEditor2.setValue('', -1);
      this.aceInputEditor2.clearSelection();
    }
    this.compare();
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
      this.copySuccessMessage = 'Diff copied to clipboard!';
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

  downloadDiff(): void {
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
    link.download = 'json-diff.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    this.copySuccessMessage = 'Diff downloaded successfully!';
    this.copySuccessVisible = true;
    setTimeout(() => {
      this.copySuccessVisible = false;
    }, 3000);
  }
}

