import { Component, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Title, Meta, DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';

declare var ace: any;

@Component({
  selector: 'app-markdown-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './markdown-editor.component.html',
  styleUrl: './markdown-editor.component.css'
})
export class MarkdownEditorComponent implements AfterViewInit {
  @ViewChild('inputEditor') private inputEditor!: ElementRef<HTMLElement>;

  private aceInputEditor: any;

  errorMessage = '';
  copySuccessMessage = '';
  htmlOutput: SafeHtml = '';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private titleService: Title,
    private metaService: Meta,
    private sanitizer: DomSanitizer
  ) {
    this.titleService.setTitle('Markdown Editor - Live Preview Online');
    this.metaService.updateTag({
      name: 'description',
      content: 'Edit Markdown with live HTML preview. Free online Markdown editor with syntax highlighting.'
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
    this.aceInputEditor.session.setMode('ace/mode/markdown');
    this.aceInputEditor.setOptions({
      useWrapMode: true,
      fontSize: '14px',
      showPrintMargin: false,
    });
    this.aceInputEditor.getSession().setUseWrapMode(true);

    this.aceInputEditor.session.on('change', () => {
      this.convertMarkdown();
    });
  }

  loadSampleMarkdown() {
    const sampleMarkdown = `# Welcome to Markdown Editor

## Features

This is a **live preview** Markdown editor with *syntax highlighting*.

### Lists

- Item 1
- Item 2
  - Nested item
  - Another nested item
- Item 3

### Code Block

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

### Links and Images

[Visit our website](#)

### Blockquote

> This is a blockquote
> It can span multiple lines

### Table

| Feature | Status |
|---------|--------|
| Preview | ✓ |
| Export  | ✓ |
`;
    
    this.aceInputEditor.setValue(sampleMarkdown, -1);
    this.aceInputEditor.clearSelection();
  }

  convertMarkdown() {
    try {
      this.errorMessage = '';

      const markdownContent = this.aceInputEditor.getValue();
      
      if (!markdownContent.trim()) {
        this.htmlOutput = '';
        return;
      }

      const html = marked(markdownContent);
      this.htmlOutput = this.sanitizer.bypassSecurityTrustHtml(html as string);
    } catch (error: any) {
      this.errorMessage = 'Error converting Markdown: ' + error.message;
      this.htmlOutput = '';
    }
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
    const content = this.aceInputEditor.getValue();
    if (!content) {
      this.errorMessage = 'No content to download';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  downloadHTML() {
    if (!this.htmlOutput) {
      this.errorMessage = 'No HTML to download';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    const content = marked(this.aceInputEditor.getValue()) as string;
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Markdown Document</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; }
        code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
        pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
        blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 20px; color: #666; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background: #f4f4f4; }
    </style>
</head>
<body>
${content}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.html';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  copyHTML() {
    if (!this.htmlOutput) {
      this.errorMessage = 'No HTML to copy';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    const content = marked(this.aceInputEditor.getValue()) as string;
    navigator.clipboard.writeText(content).then(() => {
      this.copySuccessMessage = 'HTML copied to clipboard!';
      setTimeout(() => this.copySuccessMessage = '', 2000);
    });
  }

  clearInput() {
    this.aceInputEditor.setValue('');
    this.htmlOutput = '';
    this.errorMessage = '';
    this.copySuccessMessage = '';
  }
}

