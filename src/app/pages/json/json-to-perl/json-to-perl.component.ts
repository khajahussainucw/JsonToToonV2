import { Component, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

declare const ace: any;

@Component({
  selector: 'app-json-to-perl',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './json-to-perl.component.html',
  styleUrl: './json-to-perl.component.css'
})
export class JsonToPerlComponent implements AfterViewInit {
  @ViewChild('inputEditor') private inputEditor!: ElementRef<HTMLElement>;
  @ViewChild('outputEditor') private outputEditor!: ElementRef<HTMLElement>;
  @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;

  private aceInputEditor: any;
  private aceOutputEditor: any;
  private debounceTimer: any;
  
  packageName: string = 'RootObject';
  
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
    this.title.setTitle('JSON to Perl Converter - Generate Perl Data Structures');
    this.meta.updateTag({
      name: 'description',
      content: 'Convert JSON to Perl data structures online. Generate Perl code from JSON data instantly.'
    });
    this.meta.updateTag({
      name: 'keywords',
      content: 'json to perl, json to perl hash, perl data structure generator'
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
    if (typeof window === 'undefined' || typeof ace === 'undefined') return;

    this.aceInputEditor = ace.edit(this.inputEditor.nativeElement);
    this.aceInputEditor.setTheme('ace/theme/github');
    this.aceInputEditor.session.setMode('ace/mode/json');
    this.aceInputEditor.setOptions({ useWrapMode: true, fontSize: '14px', showPrintMargin: false });
    this.aceInputEditor.getSession().setUseWrapMode(true);

    this.aceOutputEditor = ace.edit(this.outputEditor.nativeElement);
    this.aceOutputEditor.setTheme('ace/theme/github');
    this.aceOutputEditor.session.setMode('ace/mode/perl');
    this.aceOutputEditor.setOptions({ useWrapMode: true, fontSize: '14px', showPrintMargin: false, readOnly: true });
    this.aceOutputEditor.getSession().setUseWrapMode(true);

    this.aceInputEditor.session.on('change', () => this.debouncedConvert());
    setTimeout(() => {
      this.aceInputEditor.resize(true);
      this.aceOutputEditor.resize(true);
    }, 100);
  }

  private debouncedConvert() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.convertJsonToPerl(), 300);
  }

  onPackageNameChange() {
    this.convertJsonToPerl();
  }

  private convertJsonToPerl() {
    try {
      const inputJson = this.aceInputEditor.getValue().trim();
      if (!inputJson) {
        this.aceOutputEditor.setValue('');
        return;
      }
      const parsedJson = JSON.parse(inputJson);
      const perlCode = this.generatePerl(parsedJson, this.packageName);
      this.aceOutputEditor.setValue(perlCode, -1);
      this.aceOutputEditor.clearSelection();
    } catch (error: any) {
      this.aceOutputEditor.setValue('Invalid JSON: ' + error.message, -1);
      this.aceOutputEditor.clearSelection();
    }
  }

  private generatePerl(obj: any, packageName: string): string {
    const result: string[] = [];
    result.push(`package ${packageName};`);
    result.push('use strict;');
    result.push('use warnings;');
    result.push('');
    result.push('my $data = ' + this.toPerl(obj, 0) + ';');
    result.push('');
    result.push('1;');
    return result.join('\n');
  }

  private toPerl(value: any, indent: number): string {
    const spaces = '  '.repeat(indent);
    if (value === null) return 'undef';
    if (typeof value === 'string') return `"${value.replace(/"/g, '\\"')}"`;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value ? '1' : '0';
    if (Array.isArray(value)) {
      const items = value.map(item => spaces + '  ' + this.toPerl(item, indent + 1));
      return '[\n' + items.join(',\n') + '\n' + spaces + ']';
    }
    if (typeof value === 'object') {
      const pairs: string[] = [];
      for (const key in value) {
        pairs.push(`${spaces}  "${key}" => ${this.toPerl(value[key], indent + 1)}`);
      }
      return '{\n' + pairs.join(',\n') + '\n' + spaces + '}';
    }
    return 'undef';
  }

  loadSampleJson() {
    const sampleJson = { "id": 1, "name": "John", "age": 30, "active": true };
    this.aceInputEditor.setValue(JSON.stringify(sampleJson, null, 2), -1);
    this.aceInputEditor.clearSelection();
    this.convertJsonToPerl();
  }

  triggerFileUpload(): void {
    this.fileInput.nativeElement.value = '';
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        this.aceInputEditor.setValue(JSON.stringify(parsed, null, 2), -1);
        this.aceInputEditor.clearSelection();
        this.convertJsonToPerl();
      } catch {
        this.showErrorModal('Please upload a valid JSON document.');
      }
    };
    reader.readAsText(input.files[0]);
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
    this.convertJsonToPerl();
  }

  copyToClipboard(): void {
    const outputContent = this.aceOutputEditor.getValue();
    if (!outputContent || outputContent.trim() === '' || outputContent.startsWith('Invalid JSON')) {
      this.copyErrorMessage = 'Nothing to copy';
      this.copyErrorVisible = true;
      setTimeout(() => this.copyErrorVisible = false, 3000);
      return;
    }
    navigator.clipboard.writeText(outputContent).then(() => {
      this.copySuccessMessage = 'Perl code copied to clipboard!';
      this.copySuccessVisible = true;
      setTimeout(() => this.copySuccessVisible = false, 3000);
    }).catch(() => {
      this.copyErrorMessage = 'Failed to copy to clipboard';
      this.copyErrorVisible = true;
      setTimeout(() => this.copyErrorVisible = false, 3000);
    });
  }

  downloadPerl(): void {
    const outputContent = this.aceOutputEditor.getValue();
    if (!outputContent || outputContent.trim() === '' || outputContent.startsWith('Invalid JSON')) {
      this.copyErrorMessage = 'Nothing to download';
      this.copyErrorVisible = true;
      setTimeout(() => this.copyErrorVisible = false, 3000);
      return;
    }
    const blob = new Blob([outputContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.packageName}.pl`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    this.copySuccessMessage = 'Perl file downloaded successfully!';
    this.copySuccessVisible = true;
    setTimeout(() => this.copySuccessVisible = false, 3000);
  }
}

