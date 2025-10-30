import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';

declare var ace: any;

@Component({
  selector: 'app-js-deobfuscator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './js-deobfuscator.component.html',
  styleUrl: './js-deobfuscator.component.css'
})
export class JsDeobfuscatorComponent implements AfterViewInit {
  @ViewChild('inputEditor') private inputEditor!: ElementRef<HTMLElement>;
  @ViewChild('outputEditor') private outputEditor!: ElementRef<HTMLElement>;

  private aceInputEditor: any;
  private aceOutputEditor: any;

  errorMessage = '';
  copySuccessMessage = '';

  constructor(private titleService: Title, private metaService: Meta) {
    this.titleService.setTitle('JavaScript Deobfuscator - Beautify Obfuscated JS Code');
    this.metaService.updateTag({
      name: 'description',
      content: 'Deobfuscate and beautify obfuscated JavaScript code online.'
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
      this.deobfuscateJavaScript();
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

    this.loadSampleJs();
  }

  loadSampleJs() {
    const sampleJs = `var _0x1234=['log','Hello\\x20World'];(function(_0x5678,_0x9abc){var _0xdef0=function(_0x1111){while(--_0x1111){_0x5678['push'](_0x5678['shift']());}};_0xdef0(++_0x9abc);}(_0x1234,0x123));console[_0x1234[0x0]](_0x1234[0x1]);`;
    
    this.aceInputEditor.setValue(sampleJs, -1);
    this.aceInputEditor.clearSelection();
  }

  deobfuscateJavaScript() {
    try {
      this.errorMessage = '';
      this.copySuccessMessage = '';

      const jsContent = this.aceInputEditor.getValue().trim();
      
      if (!jsContent) {
        this.aceOutputEditor.setValue('');
        return;
      }

      const deobfuscated = this.deobfuscateCode(jsContent);
      
      this.aceOutputEditor.setValue(deobfuscated, -1);
      this.aceOutputEditor.clearSelection();
    } catch (error: any) {
      this.errorMessage = 'Error deobfuscating JavaScript: ' + error.message;
      this.aceOutputEditor.setValue('');
    }
  }

  private deobfuscateCode(code: string): string {
    let deobfuscated = code;
    
    // Decode hex strings
    deobfuscated = deobfuscated.replace(/\\x([0-9a-fA-F]{2})/g, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });
    
    // Decode unicode strings
    deobfuscated = deobfuscated.replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });
    
    // Format the code
    deobfuscated = this.formatJs(deobfuscated);
    
    return deobfuscated;
  }

  private formatJs(code: string): string {
    let formatted = '';
    let indent = 0;
    const indentStr = '  ';
    let inString = false;
    let stringChar = '';

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
        if (nextChar && nextChar !== '\n' && nextChar !== '}' && nextChar !== ')') {
          formatted += '\n' + indentStr.repeat(indent);
        }
      } else if (char === ',') {
        formatted += char + ' ';
      } else if (char === '\n' || char === '\r') {
        // Skip
      } else if (char === ' ' || char === '\t') {
        if (formatted[formatted.length - 1] !== ' ' && formatted[formatted.length - 1] !== '\n') {
          formatted += ' ';
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
    a.download = 'deobfuscated.js';
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

