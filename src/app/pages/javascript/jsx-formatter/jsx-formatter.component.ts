import { Component, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';

declare var ace: any;

@Component({
  selector: 'app-jsx-formatter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './jsx-formatter.component.html',
  styleUrl: './jsx-formatter.component.css'
})
export class JsxFormatterComponent implements AfterViewInit {
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
    this.titleService.setTitle('JSX Formatter - Format React JSX Code Online');
    this.metaService.updateTag({
      name: 'description',
      content: 'Format and beautify JSX/React code online with proper indentation.'
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
      this.formatJsx();
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

  loadSampleJsx() {
    const sampleJsx = `function App(){return <div className="container"><h1>Hello World</h1><button onClick={handleClick}>Click Me</button><ul>{items.map(item=><li key={item.id}>{item.name}</li>)}</ul></div>;}`;
    
    this.aceInputEditor.setValue(sampleJsx, -1);
    this.aceInputEditor.clearSelection();
  }

  formatJsx() {
    try {
      this.errorMessage = '';
      this.copySuccessMessage = '';

      const jsxContent = this.aceInputEditor.getValue().trim();
      
      if (!jsxContent) {
        this.aceOutputEditor.setValue('');
        return;
      }

      const formatted = this.formatJsxCode(jsxContent);
      
      this.aceOutputEditor.setValue(formatted, -1);
      this.aceOutputEditor.clearSelection();
    } catch (error: any) {
      this.errorMessage = 'Error formatting JSX: ' + error.message;
      this.aceOutputEditor.setValue('');
    }
  }

  private formatJsxCode(code: string): string {
    let formatted = '';
    let indent = 0;
    const indentStr = '  ';
    let inJsx = false;
    let inString = false;
    let stringChar = '';
    let inExpression = false;
    let expressionDepth = 0;

    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      const nextChar = code[i + 1] || '';
      const prevChar = code[i - 1] || '';

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

      // Handle JSX expressions
      if (inJsx && char === '{') {
        inExpression = true;
        expressionDepth++;
        formatted += char;
        continue;
      }

      if (inExpression && char === '{') {
        expressionDepth++;
        formatted += char;
        continue;
      }

      if (inExpression && char === '}') {
        expressionDepth--;
        if (expressionDepth === 0) {
          inExpression = false;
        }
        formatted += char;
        continue;
      }

      if (inExpression) {
        formatted += char;
        continue;
      }

      // Detect JSX opening tags
      if (char === '<' && nextChar !== '/' && /[a-zA-Z]/.test(nextChar)) {
        inJsx = true;
        if (formatted.trim() && !formatted.endsWith('\n')) {
          formatted += '\n' + indentStr.repeat(indent);
        }
        formatted += char;
        continue;
      }

      // Handle JSX closing tags
      if (char === '<' && nextChar === '/') {
        inJsx = false;
        indent = Math.max(0, indent - 1);
        if (!formatted.endsWith('\n')) {
          formatted += '\n' + indentStr.repeat(indent);
        }
        formatted += char;
        continue;
      }

      // Handle self-closing tags
      if (char === '/' && nextChar === '>') {
        formatted += char + nextChar;
        i++;
        inJsx = false;
        continue;
      }

      // Handle tag closing
      if (char === '>' && inJsx) {
        formatted += char;
        indent++;
        inJsx = false;
        continue;
      }

      // Regular code formatting
      if (!inJsx) {
        if (char === '{') {
          formatted += char + '\n' + indentStr.repeat(indent + 1);
          indent++;
        } else if (char === '}') {
          indent = Math.max(0, indent - 1);
          formatted = formatted.trimEnd();
          if (!formatted.endsWith('\n')) {
            formatted += '\n';
          }
          formatted += indentStr.repeat(indent) + char;
        } else if (char === ';') {
          formatted += char;
          if (nextChar && nextChar !== '\n' && nextChar !== '}') {
            formatted += '\n' + indentStr.repeat(indent);
          }
        } else if (char === '\n' || char === '\r') {
          // Skip
        } else if (char === ' ' || char === '\t') {
          if (formatted[formatted.length - 1] !== ' ' && formatted[formatted.length - 1] !== '\n') {
            formatted += ' ';
          }
        } else {
          formatted += char;
        }
      } else {
        formatted += char;
      }
    }

    return formatted.trim();
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

  downloadJsx() {
    const content = this.aceOutputEditor.getValue();
    if (!content) {
      this.errorMessage = 'No output to download';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    const blob = new Blob([content], { type: 'text/jsx' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted.jsx';
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

