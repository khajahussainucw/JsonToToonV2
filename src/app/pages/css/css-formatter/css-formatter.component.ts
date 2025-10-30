import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';

declare var ace: any;

@Component({
  selector: 'app-css-formatter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './css-formatter.component.html',
  styleUrl: './css-formatter.component.css'
})
export class CssFormatterComponent implements AfterViewInit {
  @ViewChild('inputEditor') private inputEditor!: ElementRef<HTMLElement>;
  @ViewChild('outputEditor') private outputEditor!: ElementRef<HTMLElement>;

  private aceInputEditor: any;
  private aceOutputEditor: any;

  errorMessage = '';
  copySuccessMessage = '';

  constructor(private titleService: Title, private metaService: Meta) {
    this.titleService.setTitle('CSS Formatter - Format and Beautify CSS Code Online');
    this.metaService.updateTag({
      name: 'description',
      content: 'Format and beautify CSS code online. Free CSS formatter with syntax highlighting and validation.'
    });
  }

  ngAfterViewInit() {
    this.initializeEditor();
  }

  private initializeEditor() {
    this.aceInputEditor = ace.edit(this.inputEditor.nativeElement);
    this.aceInputEditor.setTheme('ace/theme/github');
    this.aceInputEditor.session.setMode('ace/mode/css');
    this.aceInputEditor.setOptions({
      useWrapMode: true,
      fontSize: '14px',
      showPrintMargin: false,
    });
    this.aceInputEditor.getSession().setUseWrapMode(true);

    this.aceInputEditor.session.on('change', () => {
      this.formatCss();
    });

    this.aceOutputEditor = ace.edit(this.outputEditor.nativeElement);
    this.aceOutputEditor.setTheme('ace/theme/github');
    this.aceOutputEditor.session.setMode('ace/mode/css');
    this.aceOutputEditor.setOptions({
      useWrapMode: true,
      fontSize: '14px',
      showPrintMargin: false,
    });
    this.aceOutputEditor.getSession().setUseWrapMode(true);
  }

  loadSampleCss() {
    const sampleCss = `.container{width:100%;max-width:1200px;margin:0 auto;}.btn{padding:10px 20px;background:#007bff;color:#fff;border:none;border-radius:4px;cursor:pointer;}.btn:hover{background:#0056b3;}`;
    
    this.aceInputEditor.setValue(sampleCss, -1);
    this.aceInputEditor.clearSelection();
  }

  formatCss() {
    try {
      this.errorMessage = '';
      this.copySuccessMessage = '';

      const cssContent = this.aceInputEditor.getValue().trim();
      
      if (!cssContent) {
        this.aceOutputEditor.setValue('');
        return;
      }

      const formatted = this.formatCssCode(cssContent);
      
      this.aceOutputEditor.setValue(formatted, -1);
      this.aceOutputEditor.clearSelection();
    } catch (error: any) {
      this.errorMessage = 'Error formatting CSS: ' + error.message;
      this.aceOutputEditor.setValue('');
    }
  }

  private formatCssCode(css: string): string {
    let formatted = '';
    let indent = 0;
    const indentStr = '  ';
    let inComment = false;
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < css.length; i++) {
      const char = css[i];
      const nextChar = css[i + 1] || '';
      const prevChar = css[i - 1] || '';

      // Handle comments
      if (!inString && !inComment && char === '/' && nextChar === '*') {
        inComment = true;
        formatted += char;
        continue;
      }
      if (inComment && char === '*' && nextChar === '/') {
        formatted += char + nextChar;
        i++;
        inComment = false;
        continue;
      }

      if (inComment) {
        formatted += char;
        continue;
      }

      // Handle strings
      if ((char === '"' || char === "'") && prevChar !== '\\') {
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

      // Format CSS structure
      if (char === '{') {
        formatted += ' {\n' + indentStr.repeat(indent + 1);
        indent++;
      } else if (char === '}') {
        indent = Math.max(0, indent - 1);
        formatted = formatted.trimEnd();
        formatted += '\n' + indentStr.repeat(indent) + '}\n\n' + indentStr.repeat(indent);
      } else if (char === ';') {
        formatted += ';\n' + indentStr.repeat(indent);
      } else if (char === ',') {
        formatted += ', ';
      } else if (char === '\n' || char === '\r') {
        // Skip extra newlines
        if (formatted[formatted.length - 1] !== '\n') {
          formatted += ' ';
        }
      } else if (char === ' ' || char === '\t') {
        // Collapse multiple spaces
        if (formatted[formatted.length - 1] !== ' ' && formatted[formatted.length - 1] !== '\n') {
          formatted += ' ';
        }
      } else {
        formatted += char;
      }
    }

    return formatted.trim();
  }

  minifyCss() {
    const cssContent = this.aceInputEditor.getValue().trim();
    if (!cssContent) return;
    
    // Basic minification
    const minified = cssContent
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\s*([{};:,])\s*/g, '$1') // Remove spaces around special chars
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

  downloadCss() {
    const content = this.aceOutputEditor.getValue();
    if (!content) {
      this.errorMessage = 'No output to download';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    const blob = new Blob([content], { type: 'text/css' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted.css';
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

