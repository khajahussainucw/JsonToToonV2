import { Component, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';

declare var ace: any;

@Component({
  selector: 'app-js-formatter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './js-formatter.component.html',
  styleUrl: './js-formatter.component.css'
})
export class JsFormatterComponent implements AfterViewInit {
  @ViewChild('inputEditor') private inputEditor!: ElementRef<HTMLElement>;
  @ViewChild('outputEditor') private outputEditor!: ElementRef<HTMLElement>;

  private aceInputEditor: any;
  private aceOutputEditor: any;

  errorMessage = '';
  copySuccessMessage = '';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private titleService: Title, 
    private metaService: Meta
  ) {
    this.titleService.setTitle('JavaScript Formatter - Format and Beautify JS Code Online');
    this.metaService.updateTag({
      name: 'description',
      content: 'Format and beautify JavaScript code online. Free JS formatter with syntax highlighting and validation.'
    });
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.initializeEditor();
      }, 100);
    }
  }

  private initializeEditor() {
    if (typeof window === 'undefined' || typeof ace === 'undefined') {
      console.error('Ace editor is not loaded');
      return;
    }
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
      this.formatJavaScript();
    });

    this.aceOutputEditor = ace.edit(this.outputEditor.nativeElement);
    this.aceOutputEditor.setTheme('ace/theme/github');
    this.aceOutputEditor.session.setMode('ace/mode/javascript');
    this.aceOutputEditor.setOptions({
      fontSize: '14px',
      showPrintMargin: false,
      highlightActiveLine: true,
      wrap: true,
      readOnly: true
    });
  }

  loadSampleJs() {
    const sampleJs = `function calculateTotal(items){let total=0;for(let i=0;i<items.length;i++){total+=items[i].price*items[i].quantity;}return total;}const products=[{name:"Laptop",price:999,quantity:2},{name:"Mouse",price:25,quantity:5}];console.log("Total:",calculateTotal(products));`;
    
    this.aceInputEditor.setValue(sampleJs, -1);
    this.aceInputEditor.clearSelection();
  }

  formatJavaScript() {
    try {
      this.errorMessage = '';
      this.copySuccessMessage = '';

      const jsContent = this.aceInputEditor.getValue().trim();
      
      if (!jsContent) {
        this.aceOutputEditor.setValue('');
        return;
      }

      // Basic JavaScript formatting
      const formatted = this.formatJs(jsContent);
      
      this.aceOutputEditor.setValue(formatted, -1);
      this.aceOutputEditor.clearSelection();
    } catch (error: any) {
      this.errorMessage = 'Error formatting JavaScript: ' + error.message;
      this.aceOutputEditor.setValue('');
    }
  }

  private formatJs(code: string): string {
    let formatted = '';
    let indent = 0;
    const indentStr = '  ';
    let inString = false;
    let stringChar = '';
    let inComment = false;
    let inMultilineComment = false;

    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      const nextChar = code[i + 1] || '';
      const prevChar = code[i - 1] || '';

      // Handle comments
      if (!inString && !inComment && !inMultilineComment && char === '/' && nextChar === '/') {
        inComment = true;
        formatted += char;
        continue;
      }
      if (inComment && char === '\n') {
        inComment = false;
        formatted += char;
        continue;
      }
      if (!inString && !inComment && !inMultilineComment && char === '/' && nextChar === '*') {
        inMultilineComment = true;
        formatted += char;
        continue;
      }
      if (inMultilineComment && char === '*' && nextChar === '/') {
        formatted += char + nextChar;
        i++;
        inMultilineComment = false;
        continue;
      }

      if (inComment || inMultilineComment) {
        formatted += char;
        continue;
      }

      // Handle strings
      if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
          stringChar = '';
        }
        formatted += char;
        continue;
      }

      if (inString) {
        formatted += char;
        continue;
      }

      // Format braces and brackets
      if (char === '{' || char === '[') {
        formatted += char + '\n' + indentStr.repeat(indent + 1);
        indent++;
      } else if (char === '}' || char === ']') {
        indent = Math.max(0, indent - 1);
        formatted = formatted.trimEnd();
        if (formatted[formatted.length - 1] !== '\n') {
          formatted += '\n';
        }
        formatted += indentStr.repeat(indent) + char;
      } else if (char === ';') {
        formatted += char;
        if (nextChar && nextChar !== '\n' && nextChar !== '}') {
          formatted += '\n' + indentStr.repeat(indent);
        }
      } else if (char === ',') {
        formatted += char + ' ';
      } else if (char === '\n' || char === '\r') {
        // Skip multiple newlines
        if (formatted[formatted.length - 1] !== '\n') {
          formatted += '\n' + indentStr.repeat(indent);
        }
      } else if (char === ' ' || char === '\t') {
        // Skip whitespace after newlines
        if (formatted[formatted.length - 1] !== ' ' && formatted[formatted.length - 1] !== '\n') {
          formatted += ' ';
        }
      } else {
        formatted += char;
      }
    }

    return formatted.trim();
  }

  minifyJs() {
    const jsContent = this.aceInputEditor.getValue().trim();
    if (!jsContent) return;
    
    // Basic minification
    const minified = jsContent
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
      .replace(/\/\/.*/g, '') // Remove single-line comments
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\s*([{};,:])\s*/g, '$1') // Remove spaces around special chars
      .trim();
    
    this.aceOutputEditor.setValue(minified, -1);
    this.aceOutputEditor.clearSelection();
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

  downloadJs() {
    const content = this.aceOutputEditor.getValue();
    if (!content) {
      this.errorMessage = 'No output to download';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    const blob = new Blob([content], { type: 'application/javascript' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted.js';
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

