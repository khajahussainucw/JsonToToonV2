import { Component, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

declare const ace: any;

@Component({
  selector: 'app-json-to-objectivec',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './json-to-objectivec.component.html',
  styleUrl: './json-to-objectivec.component.css'
})
export class JsonToObjectivecComponent implements AfterViewInit {
  @ViewChild('inputEditor') private inputEditor!: ElementRef<HTMLElement>;
  @ViewChild('outputEditor') private outputEditor!: ElementRef<HTMLElement>;
  @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;

  private aceInputEditor: any;
  private aceOutputEditor: any;
  private debounceTimer: any;
  
  className: string = 'RootObject';
  
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
    this.title.setTitle('JSON to Objective-C Converter - Generate Objective-C Classes');
    this.meta.updateTag({
      name: 'description',
      content: 'Convert JSON to Objective-C classes online. Generate Objective-C code from JSON data instantly.'
    });
    this.meta.updateTag({
      name: 'keywords',
      content: 'json to objective-c, json to objc, objective-c class generator'
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
    this.aceOutputEditor.session.setMode('ace/mode/objectivec');
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
    this.debounceTimer = setTimeout(() => this.convertJsonToObjectiveC(), 300);
  }

  onClassNameChange() {
    this.convertJsonToObjectiveC();
  }

  private convertJsonToObjectiveC() {
    try {
      const inputJson = this.aceInputEditor.getValue().trim();
      if (!inputJson) {
        this.aceOutputEditor.setValue('');
        return;
      }
      const parsedJson = JSON.parse(inputJson);
      const objcCode = this.generateObjectiveC(parsedJson, this.className);
      this.aceOutputEditor.setValue(objcCode, -1);
      this.aceOutputEditor.clearSelection();
    } catch (error: any) {
      this.aceOutputEditor.setValue('Invalid JSON: ' + error.message, -1);
      this.aceOutputEditor.clearSelection();
    }
  }

  private generateObjectiveC(obj: any, className: string): string {
    const classes: string[] = [];
    const usedNames = new Set<string>();
    
    const generateClass = (value: any, name: string): string => {
      if (usedNames.has(name)) {
        let counter = 1;
        while (usedNames.has(name + counter)) counter++;
        name = name + counter;
      }
      usedNames.add(name);

      if (Array.isArray(value) || typeof value !== 'object' || value === null) {
        return 'NSObject*';
      }
      
      const properties: string[] = [];
      for (const key in value) {
        const val = value[key];
        let type = 'NSString*';
        
        if (Array.isArray(val)) {
          type = 'NSArray*';
        } else if (typeof val === 'object' && val !== null) {
          const childName = this.pascalCase(key);
          generateClass(val, childName);
          type = `${childName}*`;
        } else if (typeof val === 'number') {
          type = Number.isInteger(val) ? 'NSInteger' : 'CGFloat';
        } else if (typeof val === 'boolean') {
          type = 'BOOL';
        }
        
        const propName = this.camelCase(key);
        properties.push(`@property (nonatomic, strong) ${type} ${propName};`);
      }
      
      classes.push(`@interface ${name} : NSObject\n${properties.join('\n')}\n@end`);
      return name;
    };
    
    generateClass(obj, className);
    return classes.reverse().join('\n\n');
  }

  private pascalCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
  }

  private camelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1).replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
  }

  loadSampleJson() {
    const sampleJson = { "id": 1, "name": "John", "age": 30, "active": true };
    this.aceInputEditor.setValue(JSON.stringify(sampleJson, null, 2), -1);
    this.aceInputEditor.clearSelection();
    this.convertJsonToObjectiveC();
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
        this.convertJsonToObjectiveC();
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
    this.convertJsonToObjectiveC();
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
      this.copySuccessMessage = 'Objective-C code copied to clipboard!';
      this.copySuccessVisible = true;
      setTimeout(() => this.copySuccessVisible = false, 3000);
    }).catch(() => {
      this.copyErrorMessage = 'Failed to copy to clipboard';
      this.copyErrorVisible = true;
      setTimeout(() => this.copyErrorVisible = false, 3000);
    });
  }

  downloadObjectiveC(): void {
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
    link.download = `${this.className}.h`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    this.copySuccessMessage = 'Objective-C file downloaded successfully!';
    this.copySuccessVisible = true;
    setTimeout(() => this.copySuccessVisible = false, 3000);
  }
}

