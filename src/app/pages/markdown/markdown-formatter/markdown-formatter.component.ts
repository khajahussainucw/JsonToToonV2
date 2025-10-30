import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';

declare var ace: any;

@Component({
  selector: 'app-markdown-formatter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './markdown-formatter.component.html',
  styleUrl: './markdown-formatter.component.css'
})
export class MarkdownFormatterComponent implements AfterViewInit {
  @ViewChild('inputEditor') private inputEditor!: ElementRef<HTMLElement>;
  @ViewChild('outputEditor') private outputEditor!: ElementRef<HTMLElement>;

  private aceInputEditor: any;
  private aceOutputEditor: any;

  errorMessage = '';
  copySuccessMessage = '';

  constructor(private titleService: Title, private metaService: Meta) {
    this.titleService.setTitle('Markdown Formatter - Format and Beautify Markdown Online');
    this.metaService.updateTag({
      name: 'description',
      content: 'Format and beautify Markdown code online. Free Markdown formatter with syntax highlighting.'
    });
  }

  ngAfterViewInit() {
    this.initializeEditor();
  }

  private initializeEditor() {
    this.aceInputEditor = ace.edit(this.inputEditor.nativeElement);
    this.aceInputEditor.setTheme('ace/theme/github');
    this.aceInputEditor.session.setMode('ace/mode/markdown');
    this.aceInputEditor.setOptions({
      useWrapMode: true,
      fontSize: '14px',
      showPrintMargin: false,
    });
    this.aceInputEditor.getSession().setUseWrapMode(true);

    this.aceInputEditor.session.on('change', () => {
      this.formatMarkdown();
    });

    this.aceOutputEditor = ace.edit(this.outputEditor.nativeElement);
    this.aceOutputEditor.setTheme('ace/theme/github');
    this.aceOutputEditor.session.setMode('ace/mode/markdown');
    this.aceOutputEditor.setOptions({
      useWrapMode: true,
      fontSize: '14px',
      showPrintMargin: false,
    });
    this.aceOutputEditor.getSession().setUseWrapMode(true);
  }

  loadSampleMarkdown() {
    const sampleMarkdown = `#Heading 1
##Heading 2
This is a paragraph with **bold** and *italic* text.
###List
-Item 1
-Item 2
-Item 3
###Code
\`\`\`javascript
console.log('Hello');
\`\`\``;
    
    this.aceInputEditor.setValue(sampleMarkdown, -1);
    this.aceInputEditor.clearSelection();
  }

  formatMarkdown() {
    try {
      this.errorMessage = '';
      this.copySuccessMessage = '';

      const markdownContent = this.aceInputEditor.getValue().trim();
      
      if (!markdownContent) {
        this.aceOutputEditor.setValue('');
        return;
      }

      const formatted = this.formatMarkdownCode(markdownContent);
      
      this.aceOutputEditor.setValue(formatted, -1);
      this.aceOutputEditor.clearSelection();
    } catch (error: any) {
      this.errorMessage = 'Error formatting Markdown: ' + error.message;
      this.aceOutputEditor.setValue('');
    }
  }

  private formatMarkdownCode(markdown: string): string {
    const lines = markdown.split('\n');
    const formatted: string[] = [];
    let inCodeBlock = false;
    let prevLineEmpty = false;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Check for code blocks
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        if (!inCodeBlock && formatted.length > 0) {
          formatted.push(line);
          formatted.push('');
          prevLineEmpty = true;
          continue;
        }
      }

      // Don't format inside code blocks
      if (inCodeBlock) {
        formatted.push(line);
        continue;
      }

      // Trim line
      line = line.trim();

      // Skip multiple empty lines
      if (line === '') {
        if (!prevLineEmpty && formatted.length > 0) {
          formatted.push('');
          prevLineEmpty = true;
        }
        continue;
      }

      prevLineEmpty = false;

      // Format headings - add space after #
      if (line.match(/^#{1,6}[^ #]/)) {
        const match = line.match(/^(#{1,6})(.*)/);
        if (match) {
          line = match[1] + ' ' + match[2].trim();
        }
      }

      // Add blank line before headings (except at start)
      if (line.startsWith('#') && formatted.length > 0 && formatted[formatted.length - 1] !== '') {
        formatted.push('');
      }

      // Format list items - ensure space after dash
      if (line.match(/^[-*+][^ ]/)) {
        line = line.charAt(0) + ' ' + line.substring(1).trim();
      }

      formatted.push(line);

      // Add blank line after headings
      if (line.startsWith('#')) {
        formatted.push('');
        prevLineEmpty = true;
      }
    }

    return formatted.join('\n').trim();
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

  downloadMarkdown() {
    const content = this.aceOutputEditor.getValue();
    if (!content) {
      this.errorMessage = 'No output to download';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted.md';
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

