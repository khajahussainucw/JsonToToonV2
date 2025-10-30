import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';

declare var ace: any;

@Component({
  selector: 'app-css-to-scss',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './css-to-scss.component.html',
  styleUrl: './css-to-scss.component.css'
})
export class CssToScssComponent implements AfterViewInit {
  @ViewChild('inputEditor') private inputEditor!: ElementRef<HTMLElement>;
  @ViewChild('outputEditor') private outputEditor!: ElementRef<HTMLElement>;

  private aceInputEditor: any;
  private aceOutputEditor: any;

  errorMessage = '';
  copySuccessMessage = '';

  constructor(private titleService: Title, private metaService: Meta) {
    this.titleService.setTitle('CSS to SCSS Converter - Convert CSS to SCSS Online');
    this.metaService.updateTag({
      name: 'description',
      content: 'Convert CSS to SCSS online. Add nesting and SCSS features to your CSS code.'
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
      this.convertCss();
    });

    this.aceOutputEditor = ace.edit(this.outputEditor.nativeElement);
    this.aceOutputEditor.setTheme('ace/theme/github');
    this.aceOutputEditor.session.setMode('ace/mode/scss');
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

.container .btn {
  padding: 10px 20px;
  background: #007bff;
  color: #fff;
  border: none;
  border-radius: 4px;
}

.container .btn:hover {
  background: #0056b3;
}`;
    
    this.aceInputEditor.setValue(sampleCss, -1);
    this.aceInputEditor.clearSelection();
  }

  convertCss() {
    try {
      this.errorMessage = '';
      this.copySuccessMessage = '';

      const cssContent = this.aceInputEditor.getValue().trim();
      
      if (!cssContent) {
        this.aceOutputEditor.setValue('');
        return;
      }

      const scss = this.cssToScss(cssContent);
      
      this.aceOutputEditor.setValue(scss, -1);
      this.aceOutputEditor.clearSelection();
    } catch (error: any) {
      this.errorMessage = 'Error converting CSS: ' + error.message;
      this.aceOutputEditor.setValue('');
    }
  }

  private cssToScss(css: string): string {
    // Parse CSS rules
    const rules = this.parseCssRules(css);
    
    // Build nested SCSS structure
    const nested = this.buildNestedStructure(rules);
    
    return nested;
  }

  private parseCssRules(css: string): Array<{selector: string, properties: string}> {
    const rules: Array<{selector: string, properties: string}> = [];
    const ruleRegex = /([^{]+)\{([^}]+)\}/g;
    let match;
    
    while ((match = ruleRegex.exec(css)) !== null) {
      rules.push({
        selector: match[1].trim(),
        properties: match[2].trim()
      });
    }
    
    return rules;
  }

  private buildNestedStructure(rules: Array<{selector: string, properties: string}>): string {
    const tree: any = {};
    
    // Group rules by parent selector
    for (const rule of rules) {
      const parts = rule.selector.split(/\s+/);
      
      if (parts.length === 1) {
        // Top-level rule
        if (!tree[parts[0]]) {
          tree[parts[0]] = { properties: rule.properties, children: {} };
        } else {
          tree[parts[0]].properties = rule.properties;
        }
      } else {
        // Nested rule
        const parent = parts[0];
        const child = parts.slice(1).join(' ');
        
        if (!tree[parent]) {
          tree[parent] = { properties: '', children: {} };
        }
        
        if (child.startsWith(':')) {
          // Pseudo selector - use &
          tree[parent].children['&' + child] = { properties: rule.properties, children: {} };
        } else {
          tree[parent].children[child] = { properties: rule.properties, children: {} };
        }
      }
    }
    
    return this.renderScss(tree, 0);
  }

  private renderScss(tree: any, level: number): string {
    const indent = '  '.repeat(level);
    let result = '';
    
    for (const [selector, data] of Object.entries(tree)) {
      const node = data as any;
      result += `${indent}${selector} {\n`;
      
      if (node.properties) {
        const props = node.properties.split(';').map((p: string) => p.trim()).filter((p: string) => p);
        for (const prop of props) {
          result += `${indent}  ${prop};\n`;
        }
      }
      
      if (Object.keys(node.children).length > 0) {
        result += '\n' + this.renderScss(node.children, level + 1);
      }
      
      result += `${indent}}\n\n`;
    }
    
    return result;
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

  downloadScss() {
    const content = this.aceOutputEditor.getValue();
    if (!content) {
      this.errorMessage = 'No output to download';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    const blob = new Blob([content], { type: 'text/x-scss' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted.scss';
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

