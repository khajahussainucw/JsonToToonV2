import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';

declare var ace: any;

@Component({
  selector: 'app-js-console',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './js-console.component.html',
  styleUrl: './js-console.component.css'
})
export class JsConsoleComponent implements AfterViewInit {
  @ViewChild('codeEditor') private codeEditor!: ElementRef<HTMLElement>;

  private aceEditor: any;
  consoleOutput: string[] = [];

  constructor(private titleService: Title, private metaService: Meta) {
    this.titleService.setTitle('JavaScript Console - Online JS Playground');
    this.metaService.updateTag({
      name: 'description',
      content: 'Run JavaScript code online in an interactive console playground.'
    });
  }

  ngAfterViewInit() {
    this.initializeEditor();
  }

  private initializeEditor() {
    this.aceEditor = ace.edit(this.codeEditor.nativeElement);
    this.aceEditor.setTheme('ace/theme/github');
    this.aceEditor.session.setMode('ace/mode/javascript');
    this.aceEditor.setOptions({
      fontSize: '14px',
      showPrintMargin: false,
      highlightActiveLine: true,
      wrap: true
    });
  }

  loadSampleCode() {
    const sampleCode = `function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet("World"));

const numbers = [1, 2, 3, 4, 5];
const sum = numbers.reduce((a, b) => a + b, 0);
console.log("Sum:", sum);

const person = {
  name: "John",
  age: 30,
  city: "New York"
};
console.log("Person:", person);`;
    
    this.aceEditor.setValue(sampleCode, -1);
    this.aceEditor.clearSelection();
  }

  runCode() {
    this.consoleOutput = [];
    const code = this.aceEditor.getValue();

    if (!code.trim()) {
      this.consoleOutput.push('⚠️ No code to execute');
      return;
    }

    // Override console methods
    const originalConsole = { ...console };
    const self = this;

    (window as any).console = {
      log: (...args: any[]) => {
        self.consoleOutput.push('> ' + args.map(arg => self.formatOutput(arg)).join(' '));
      },
      error: (...args: any[]) => {
        self.consoleOutput.push('❌ ' + args.map(arg => self.formatOutput(arg)).join(' '));
      },
      warn: (...args: any[]) => {
        self.consoleOutput.push('⚠️ ' + args.map(arg => self.formatOutput(arg)).join(' '));
      },
      info: (...args: any[]) => {
        self.consoleOutput.push('ℹ️ ' + args.map(arg => self.formatOutput(arg)).join(' '));
      }
    };

    try {
      // Execute the code
      const result = eval(code);
      
      if (result !== undefined && !code.includes('console.')) {
        this.consoleOutput.push('↪️ ' + this.formatOutput(result));
      }

      if (this.consoleOutput.length === 0) {
        this.consoleOutput.push('✓ Code executed successfully (no output)');
      }
    } catch (error: any) {
      this.consoleOutput.push('❌ Error: ' + error.message);
      if (error.stack) {
        this.consoleOutput.push(error.stack);
      }
    } finally {
      // Restore console
      (window as any).console = originalConsole;
    }
  }

  private formatOutput(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return value;
    if (typeof value === 'function') return value.toString();
    
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  clearConsole() {
    this.consoleOutput = [];
  }

  clearCode() {
    this.aceEditor.setValue('');
    this.consoleOutput = [];
  }
}

