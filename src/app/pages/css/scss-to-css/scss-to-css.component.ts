import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';

declare var ace: any;

@Component({
  selector: 'app-scss-to-css',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './scss-to-css.component.html',
  styleUrl: './scss-to-css.component.css'
})
export class ScssToCssComponent implements AfterViewInit {
  @ViewChild('inputEditor') private inputEditor!: ElementRef<HTMLElement>;
  @ViewChild('outputEditor') private outputEditor!: ElementRef<HTMLElement>;

  private aceInputEditor: any;
  private aceOutputEditor: any;

  errorMessage = '';
  copySuccessMessage = '';

  constructor(private titleService: Title, private metaService: Meta) {
    this.titleService.setTitle('SCSS to CSS Converter - Convert SCSS/SASS to CSS Online');
    this.metaService.updateTag({
      name: 'description',
      content: 'Convert SCSS/SASS to CSS online. Free SCSS compiler with syntax highlighting.'
    });
  }

  ngAfterViewInit() {
    this.initializeEditor();
  }

  private initializeEditor() {
    this.aceInputEditor = ace.edit(this.inputEditor.nativeElement);
    this.aceInputEditor.setTheme('ace/theme/github');
    this.aceInputEditor.session.setMode('ace/mode/scss');
    this.aceInputEditor.setOptions({
      useWrapMode: true,
      fontSize: '14px',
      showPrintMargin: false,
    });
    this.aceInputEditor.getSession().setUseWrapMode(true);

    this.aceInputEditor.session.on('change', () => {
      this.convertScss();
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

  loadSampleScss() {
    const sampleScss = `$primary-color: #007bff;
$border-radius: 4px;

.container {
  width: 100%;
  max-width: 1200px;
  
  .btn {
    padding: 10px 20px;
    background: $primary-color;
    border-radius: $border-radius;
    
    &:hover {
      background: darken($primary-color, 10%);
    }
  }
}`;
    
    this.aceInputEditor.setValue(sampleScss, -1);
    this.aceInputEditor.clearSelection();
  }

  convertScss() {
    try {
      this.errorMessage = '';
      this.copySuccessMessage = '';

      const scssContent = this.aceInputEditor.getValue().trim();
      
      if (!scssContent) {
        this.aceOutputEditor.setValue('');
        return;
      }

      // Basic SCSS to CSS conversion (simplified)
      const css = this.compileScss(scssContent);
      
      this.aceOutputEditor.setValue(css, -1);
      this.aceOutputEditor.clearSelection();
    } catch (error: any) {
      this.errorMessage = 'Error converting SCSS: ' + error.message;
      this.aceOutputEditor.setValue('');
    }
  }

  private compileScss(scss: string): string {
    // This is a simplified SCSS compiler
    // For production, you'd want to use a real SCSS compiler library
    
    let css = scss;
    
    // Remove single-line comments
    css = css.replace(/\/\/.*/g, '');
    
    // Handle variables (simple replacement)
    const variables: { [key: string]: string } = {};
    const varRegex = /\$([a-zA-Z0-9_-]+):\s*([^;]+);/g;
    let match;
    
    while ((match = varRegex.exec(css)) !== null) {
      variables['$' + match[1]] = match[2].trim();
    }
    
    // Replace variable usages
    for (const [varName, varValue] of Object.entries(variables)) {
      const regex = new RegExp('\\' + varName + '(?![a-zA-Z0-9_-])', 'g');
      css = css.replace(regex, varValue);
    }
    
    // Remove variable declarations
    css = css.replace(/\$[a-zA-Z0-9_-]+:\s*[^;]+;\n?/g, '');
    
    // Handle nesting (simple approach)
    css = this.unnestScss(css);
    
    // Handle & parent selector
    css = css.replace(/&/g, '');
    
    return css.trim();
  }

  private unnestScss(scss: string): string {
    // This is a very basic unnesting algorithm
    // Real SCSS compilation is much more complex
    
    const lines = scss.split('\n');
    const result: string[] = [];
    const stack: string[] = [];
    let currentSelector = '';
    
    for (let line of lines) {
      line = line.trim();
      
      if (!line || line.startsWith('//') || line.startsWith('/*')) continue;
      
      if (line.includes('{')) {
        const selector = line.replace('{', '').trim();
        if (selector) {
          if (selector.startsWith('&')) {
            currentSelector = stack[stack.length - 1] + selector.substring(1);
          } else if (stack.length > 0) {
            currentSelector = stack[stack.length - 1] + ' ' + selector;
          } else {
            currentSelector = selector;
          }
          stack.push(currentSelector);
          result.push(currentSelector + ' {');
        }
      } else if (line.includes('}')) {
        result.push('}');
        stack.pop();
      } else if (line) {
        result.push('  ' + line);
      }
    }
    
    return result.join('\n');
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
    a.download = 'compiled.css';
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

