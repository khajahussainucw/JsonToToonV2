import { Component, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';

declare var ace: any;

@Component({
  selector: 'app-js-validator',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './js-validator.component.html',
  styleUrl: './js-validator.component.css'
})
export class JsValidatorComponent implements AfterViewInit {
  @ViewChild('inputEditor') private inputEditor!: ElementRef<HTMLElement>;
  @ViewChild('outputEditor') private outputEditor!: ElementRef<HTMLElement>;

  private aceInputEditor: any;
  private aceOutputEditor: any;

  validationResult: { valid: boolean; message: string } | null = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private titleService: Title, 
    private metaService: Meta
  ) {
    this.titleService.setTitle('JavaScript Validator - Validate JS Syntax Online');
    this.metaService.updateTag({
      name: 'description',
      content: 'Validate JavaScript syntax online. Check JS code for errors and warnings.'
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
      this.validateJavaScript();
    });

    this.aceOutputEditor = ace.edit(this.outputEditor.nativeElement);
    this.aceOutputEditor.setTheme('ace/theme/github');
    this.aceOutputEditor.session.setMode('ace/mode/text');
    this.aceOutputEditor.setOptions({
      fontSize: '14px',
      showPrintMargin: false,
      highlightActiveLine: false,
      wrap: true,
      readOnly: true
    });
  }

  loadSampleJs() {
    const sampleJs = `function greet(name) {
  return "Hello, " + name + "!";
}

console.log(greet("World"));`;
    
    this.aceInputEditor.setValue(sampleJs, -1);
    this.aceInputEditor.clearSelection();
  }

  validateJavaScript() {
    const jsContent = this.aceInputEditor.getValue().trim();
    
    if (!jsContent) {
      this.aceOutputEditor.setValue('');
      this.validationResult = null;
      return;
    }

    try {
      // Try to evaluate the syntax using Function constructor
      new Function(jsContent);
      
      this.validationResult = {
        valid: true,
        message: 'Valid JavaScript syntax'
      };
      
      const output = `✓ Valid JavaScript\n\nYour JavaScript code has valid syntax.\n\nLines: ${jsContent.split('\n').length}\nCharacters: ${jsContent.length}`;
      this.aceOutputEditor.setValue(output, -1);
      this.aceOutputEditor.clearSelection();
    } catch (error: any) {
      this.validationResult = {
        valid: false,
        message: 'Invalid JavaScript'
      };
      
      const output = `✗ Syntax Error\n\n${error.message}\n\nPlease fix the error and try again.`;
      this.aceOutputEditor.setValue(output, -1);
      this.aceOutputEditor.clearSelection();
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

  clearInput() {
    this.aceInputEditor.setValue('');
    this.aceOutputEditor.setValue('');
    this.validationResult = null;
  }
}

