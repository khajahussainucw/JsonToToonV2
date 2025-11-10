import { Component, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

declare const ace: any;

@Component({
  selector: 'app-json-to-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './json-to-shell.component.html',
  styleUrl: './json-to-shell.component.css'
})
export class JsonToShellComponent implements AfterViewInit {
  @ViewChild('inputEditor') private inputEditor!: ElementRef<HTMLElement>;
  @ViewChild('outputEditor') private outputEditor!: ElementRef<HTMLElement>;
  @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;

  private aceInputEditor: any;
  private aceOutputEditor: any;
  private debounceTimer: any;
  
  variableName: string = 'DATA';
  
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
    this.title.setTitle('JSON to Shell/Bash Converter - Generate Shell Variable Declarations');
    this.meta.updateTag({
      name: 'description',
      content: 'Convert JSON to Shell/Bash variable declarations online. Generate shell script code from JSON data instantly.'
    });
    this.meta.updateTag({
      name: 'keywords',
      content: 'json to bash, json to shell, shell variable generator, bash script generator'
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
    this.aceOutputEditor.session.setMode('ace/mode/sh');
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
    this.debounceTimer = setTimeout(() => this.convertJsonToShell(), 300);
  }

  onVariableNameChange() {
    this.convertJsonToShell();
  }

  private convertJsonToShell() {
    try {
      const inputJson = this.aceInputEditor.getValue().trim();
      if (!inputJson) {
        this.aceOutputEditor.setValue('');
        return;
      }
      const parsedJson = JSON.parse(inputJson);
      const shellCode = this.generateShell(parsedJson, this.variableName);
      this.aceOutputEditor.setValue(shellCode, -1);
      this.aceOutputEditor.clearSelection();
    } catch (error: any) {
      this.aceOutputEditor.setValue('Invalid JSON: ' + error.message, -1);
      this.aceOutputEditor.clearSelection();
    }
  }

  private generateShell(obj: any, varName: string): string {
    const result: string[] = ['#!/bin/bash'];
    result.push('');
    result.push(`# JSON converted to shell variables`);
    result.push('');
    this.generateShellVars(obj, varName, result, 0);
    return result.join('\n');
  }

  private generateShellVars(value: any, prefix: string, result: string[], indent: number): void {
    const spaces = '  '.repeat(indent);
    if (value === null) {
      result.push(`${spaces}${prefix}=""`);
      return;
    }
    if (typeof value === 'string') {
      const escaped = value.replace(/"/g, '\\"').replace(/\$/g, '\\$').replace(/`/g, '\\`');
      result.push(`${spaces}${prefix}="${escaped}"`);
      return;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      result.push(`${spaces}${prefix}="${value}"`);
      return;
    }
    if (Array.isArray(value)) {
      result.push(`${spaces}${prefix}_COUNT=${value.length}`);
      value.forEach((item, index) => {
        this.generateShellVars(item, `${prefix}_${index}`, result, indent);
      });
      return;
    }
    if (typeof value === 'object') {
      for (const key in value) {
        const shellKey = key.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
        this.generateShellVars(value[key], `${prefix}_${shellKey}`, result, indent);
      }
    }
  }

  loadSampleJson() {
    const sampleJson = { "id": 1, "name": "John", "age": 30, "active": true };
    this.aceInputEditor.setValue(JSON.stringify(sampleJson, null, 2), -1);
    this.aceInputEditor.clearSelection();
    this.convertJsonToShell();
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
        this.convertJsonToShell();
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
    this.convertJsonToShell();
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
      this.copySuccessMessage = 'Shell code copied to clipboard!';
      this.copySuccessVisible = true;
      setTimeout(() => this.copySuccessVisible = false, 3000);
    }).catch(() => {
      this.copyErrorMessage = 'Failed to copy to clipboard';
      this.copyErrorVisible = true;
      setTimeout(() => this.copyErrorVisible = false, 3000);
    });
  }

  downloadShell(): void {
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
    link.download = `data.sh`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    this.copySuccessMessage = 'Shell file downloaded successfully!';
    this.copySuccessVisible = true;
    setTimeout(() => this.copySuccessVisible = false, 3000);
  }
}

