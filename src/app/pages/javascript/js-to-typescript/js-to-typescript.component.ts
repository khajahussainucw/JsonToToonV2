import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';

declare var ace: any;

@Component({
  selector: 'app-js-to-typescript',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './js-to-typescript.component.html',
  styleUrl: './js-to-typescript.component.css'
})
export class JsToTypescriptComponent implements AfterViewInit {
  @ViewChild('inputEditor') private inputEditor!: ElementRef<HTMLElement>;
  @ViewChild('outputEditor') private outputEditor!: ElementRef<HTMLElement>;

  private aceInputEditor: any;
  private aceOutputEditor: any;

  errorMessage = '';
  copySuccessMessage = '';

  constructor(private titleService: Title, private metaService: Meta) {
    this.titleService.setTitle('JavaScript to TypeScript Converter - Convert JS to TS Online');
    this.metaService.updateTag({
      name: 'description',
      content: 'Convert JavaScript to TypeScript online. Add type annotations and interfaces automatically.'
    });
  }

  ngAfterViewInit() {
    this.initializeEditor();
  }

  private initializeEditor() {
    this.aceInputEditor = ace.edit(this.inputEditor.nativeElement);
    this.aceInputEditor.setTheme('ace/theme/github');
    this.aceInputEditor.session.setMode('ace/mode/javascript');
    this.aceInputEditor.setOptions({
      fontSize: '14px',
      showPrintMargin: false,
      highlightActiveLine: true,
      wrap: true
    });

    this.aceInputEditor.session.on('change', () => {
      this.convertToTypescript();
    });

    this.aceOutputEditor = ace.edit(this.outputEditor.nativeElement);
    this.aceOutputEditor.setTheme('ace/theme/github');
    this.aceOutputEditor.session.setMode('ace/mode/typescript');
    this.aceOutputEditor.setOptions({
      fontSize: '14px',
      showPrintMargin: false,
      highlightActiveLine: true,
      wrap: true,
      readOnly: true
    });
  }

  loadSampleJs() {
    const sampleJs = `function calculateTotal(items) {
  let total = 0;
  for (let item of items) {
    total += item.price * item.quantity;
  }
  return total;
}

const products = [
  { name: "Laptop", price: 999, quantity: 2 },
  { name: "Mouse", price: 25, quantity: 5 }
];

console.log(calculateTotal(products));`;
    
    this.aceInputEditor.setValue(sampleJs, -1);
    this.aceInputEditor.clearSelection();
  }

  convertToTypescript() {
    try {
      this.errorMessage = '';
      this.copySuccessMessage = '';

      const jsContent = this.aceInputEditor.getValue().trim();
      
      if (!jsContent) {
        this.aceOutputEditor.setValue('');
        return;
      }

      const typescript = this.convertJsToTs(jsContent);
      
      this.aceOutputEditor.setValue(typescript, -1);
      this.aceOutputEditor.clearSelection();
    } catch (error: any) {
      this.errorMessage = 'Error converting to TypeScript: ' + error.message;
      this.aceOutputEditor.setValue('');
    }
  }

  private convertJsToTs(code: string): string {
    let ts = code;

    // Add type annotations to function parameters
    ts = ts.replace(/function\s+(\w+)\s*\(([^)]*)\)/g, (match, funcName, params) => {
      if (!params.trim()) return match;
      const typedParams = params.split(',').map((p: string) => p.trim() + ': any').join(', ');
      return `function ${funcName}(${typedParams})`;
    });

    // Add return type annotations to functions
    ts = ts.replace(/function\s+(\w+)\s*\(([^)]*)\)\s*{/g, 'function $1($2): any {');

    // Convert const/let with arrow functions
    ts = ts.replace(/const\s+(\w+)\s*=\s*\(([^)]*)\)\s*=>/g, (match, varName, params) => {
      if (!params.trim()) return `const ${varName} = (): any =>`;
      const typedParams = params.split(',').map((p: string) => p.trim() + ': any').join(', ');
      return `const ${varName} = (${typedParams}): any =>`;
    });

    // Add array type annotations
    ts = ts.replace(/const\s+(\w+)\s*=\s*\[/g, 'const $1: any[] = [');
    ts = ts.replace(/let\s+(\w+)\s*=\s*\[/g, 'let $1: any[] = [');

    // Add object type annotations
    ts = ts.replace(/const\s+(\w+)\s*=\s*{/g, 'const $1: any = {');
    ts = ts.replace(/let\s+(\w+)\s*=\s*{/g, 'let $1: any = {');

    // Add basic variable type annotations
    ts = ts.replace(/let\s+(\w+)\s*=\s*(\d+)/g, 'let $1: number = $2');
    ts = ts.replace(/let\s+(\w+)\s*=\s*"([^"]*)"/g, 'let $1: string = "$2"');
    ts = ts.replace(/let\s+(\w+)\s*=\s*'([^']*)'/g, "let $1: string = '$2'");
    ts = ts.replace(/let\s+(\w+)\s*=\s*(true|false)/g, 'let $1: boolean = $2');

    return ts;
  }

  uploadFile(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.aceInputEditor.setValue(e.target.result, -1);
        this.aceInputEditor.clearSelection();
      };
      reader.readAsText(file);
    }
    event.target.value = '';
  }

  downloadTs() {
    const content = this.aceOutputEditor.getValue();
    if (!content) {
      this.errorMessage = 'No output to download';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    const blob = new Blob([content], { type: 'text/typescript' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted.ts';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  copyToClipboard() {
    const content = this.aceOutputEditor.getValue();
    if (!content) {
      this.errorMessage = 'No output to copy';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    navigator.clipboard.writeText(content).then(() => {
      this.copySuccessMessage = 'Copied to clipboard!';
      setTimeout(() => this.copySuccessMessage = '', 2000);
    });
  }

  clearInput() {
    this.aceInputEditor.setValue('');
    this.aceOutputEditor.setValue('');
    this.errorMessage = '';
    this.copySuccessMessage = '';
  }
}

