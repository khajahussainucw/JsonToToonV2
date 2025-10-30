import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';

declare var ace: any;

@Component({
  selector: 'app-css-validator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './css-validator.component.html',
  styleUrl: './css-validator.component.css'
})
export class CssValidatorComponent implements AfterViewInit {
  @ViewChild('inputEditor') private inputEditor!: ElementRef<HTMLElement>;
  @ViewChild('outputEditor') private outputEditor!: ElementRef<HTMLElement>;

  private aceInputEditor: any;
  private aceOutputEditor: any;

  errorMessage = '';
  copySuccessMessage = '';
  validationResult = '';
  isValid = false;

  constructor(private titleService: Title, private metaService: Meta) {
    this.titleService.setTitle('CSS Validator - Validate CSS Code Online');
    this.metaService.updateTag({
      name: 'description',
      content: 'Validate CSS code online. Check for syntax errors and validation issues in your CSS.'
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
      this.validateCss();
    });

    this.aceOutputEditor = ace.edit(this.outputEditor.nativeElement);
    this.aceOutputEditor.setTheme('ace/theme/github');
    this.aceOutputEditor.session.setMode('ace/mode/text');
    this.aceOutputEditor.setOptions({
      useWrapMode: true,
      fontSize: '14px',
      showPrintMargin: false,
    });
    this.aceOutputEditor.getSession().setUseWrapMode(true);
  }

  loadSampleCss() {
    const sampleCss = `.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.btn {
  padding: 10px 20px;
  background: #007bff;
  color: #fff;
  border: none;
  border-radius: 4px;
}`;
    
    this.aceInputEditor.setValue(sampleCss, -1);
    this.aceInputEditor.clearSelection();
  }

  validateCss() {
    try {
      this.errorMessage = '';
      this.copySuccessMessage = '';

      const cssContent = this.aceInputEditor.getValue().trim();
      
      if (!cssContent) {
        this.aceOutputEditor.setValue('');
        this.validationResult = '';
        return;
      }

      const issues = this.performCssValidation(cssContent);
      
      if (issues.length === 0) {
        this.isValid = true;
        this.validationResult = 'Valid';
        this.aceOutputEditor.setValue('✓ CSS is valid!\n\nNo syntax errors found.', -1);
      } else {
        this.isValid = false;
        this.validationResult = 'Invalid';
        const errorReport = '✗ CSS Validation Issues:\n\n' + issues.join('\n\n');
        this.aceOutputEditor.setValue(errorReport, -1);
      }
      
      this.aceOutputEditor.clearSelection();
    } catch (error: any) {
      this.isValid = false;
      this.validationResult = 'Error';
      this.errorMessage = 'Error validating CSS: ' + error.message;
      this.aceOutputEditor.setValue('Error: ' + error.message);
    }
  }

  private performCssValidation(css: string): string[] {
    const issues: string[] = [];
    const lines = css.split('\n');
    
    let braceCount = 0;
    let inComment = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNum = i + 1;
      
      // Check for comment blocks
      if (line.includes('/*')) inComment = true;
      if (line.includes('*/')) inComment = false;
      
      if (inComment) continue;
      
      // Check brace balance
      for (const char of line) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
        if (braceCount < 0) {
          issues.push(`Line ${lineNum}: Unexpected closing brace '}'`);
        }
      }
      
      // Check for common syntax errors
      if (line && !line.startsWith('/*') && !line.startsWith('*') && !line.endsWith('*/')) {
        // Check for missing semicolons in property declarations
        if (line.includes(':') && !line.includes('{') && !line.endsWith(';') && !line.endsWith('{') && !line.endsWith('}')) {
          if (!line.match(/@\w+/)) { // Ignore @ rules
            issues.push(`Line ${lineNum}: Missing semicolon at end of declaration`);
          }
        }
        
        // Check for invalid property format
        if (line.includes(':') && !line.includes('{')) {
          const parts = line.split(':');
          if (parts[0].trim().includes(' ')) {
            const prop = parts[0].trim();
            if (!prop.match(/^[\w-]+$/) && !prop.startsWith('@')) {
              issues.push(`Line ${lineNum}: Invalid property name "${prop}"`);
            }
          }
        }
      }
    }
    
    // Check final brace balance
    if (braceCount > 0) {
      issues.push(`Missing ${braceCount} closing brace(s) '}'`);
    } else if (braceCount < 0) {
      issues.push(`Extra ${Math.abs(braceCount)} closing brace(s) '}'`);
    }
    
    return issues;
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
    this.validationResult = '';
  }
}

