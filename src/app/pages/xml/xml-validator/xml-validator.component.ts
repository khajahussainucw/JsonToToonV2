import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';

declare var ace: any;

interface ValidationResult {
  valid: boolean;
  message: string;
  errors?: string[];
}

@Component({
  selector: 'app-xml-validator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './xml-validator.component.html',
  styleUrl: './xml-validator.component.css'
})
export class XmlValidatorComponent implements AfterViewInit {
  @ViewChild('inputEditor') private inputEditor!: ElementRef<HTMLElement>;
  @ViewChild('outputEditor') private outputEditor!: ElementRef<HTMLElement>;

  private aceInputEditor: any;
  private aceOutputEditor: any;

  validationResult: ValidationResult | null = null;

  constructor(private titleService: Title, private metaService: Meta) {
    this.titleService.setTitle('XML Validator - Validate XML Syntax Online');
    this.metaService.updateTag({
      name: 'description',
      content: 'Validate XML syntax and check for errors. Free online XML validator with detailed error messages.'
    });
  }

  ngAfterViewInit() {
    this.initializeEditor();
  }

  private initializeEditor() {
    this.aceInputEditor = ace.edit(this.inputEditor.nativeElement);
    this.aceInputEditor.setTheme('ace/theme/github');
    this.aceInputEditor.session.setMode('ace/mode/xml');
    this.aceInputEditor.setOptions({
      fontSize: '14px',
      showPrintMargin: false,
      highlightActiveLine: true,
      wrap: true
    });

    // Auto-validate on input change
    this.aceInputEditor.session.on('change', () => {
      this.validateXml();
    });

    this.aceOutputEditor = ace.edit(this.outputEditor.nativeElement);
    this.aceOutputEditor.setTheme('ace/theme/github');
    this.aceOutputEditor.session.setMode('ace/mode/text');
    this.aceOutputEditor.setOptions({
      fontSize: '14px',
      showPrintMargin: false,
      highlightActiveLine: true,
      wrap: true,
      readOnly: true
    });

    this.loadSampleXml();
  }

  loadSampleXml() {
    const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <person id="1">
    <name>John Doe</name>
    <age>30</age>
    <email>john@example.com</email>
  </person>
  <person id="2">
    <name>Jane Smith</name>
    <age>25</age>
    <email>jane@example.com</email>
  </person>
</root>`;
    
    this.aceInputEditor.setValue(sampleXml, -1);
    this.aceInputEditor.clearSelection();
    this.validateXml();
  }

  validateXml() {
    const xmlContent = this.aceInputEditor.getValue().trim();
    
    if (!xmlContent) {
      this.validationResult = null;
      this.aceOutputEditor.setValue('');
      return;
    }

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
      
      // Check for parser errors
      const parserErrors = xmlDoc.getElementsByTagName('parsererror');
      
      if (parserErrors.length > 0) {
        const errorText = parserErrors[0].textContent || 'Unknown XML parsing error';
        this.validationResult = {
          valid: false,
          message: 'Invalid XML',
          errors: [errorText]
        };
        this.displayResult();
        return;
      }

      // Additional validation checks
      const errors: string[] = [];
      
      // Check for well-formedness
      if (!xmlDoc.documentElement) {
        errors.push('XML must have a root element');
      }

      if (errors.length > 0) {
        this.validationResult = {
          valid: false,
          message: 'XML validation failed',
          errors: errors
        };
      } else {
        this.validationResult = {
          valid: true,
          message: 'Valid XML! ✓'
        };
      }
      
      this.displayResult();
    } catch (error: any) {
      this.validationResult = {
        valid: false,
        message: 'Error validating XML',
        errors: [error.message]
      };
      this.displayResult();
    }
  }

  private displayResult() {
    if (!this.validationResult) {
      this.aceOutputEditor.setValue('');
      return;
    }

    let output = '';
    
    if (this.validationResult.valid) {
      output += '✓ XML is VALID\n\n';
      output += this.validationResult.message + '\n\n';
      output += 'Your XML is well-formed and follows proper syntax rules.';
    } else {
      output += '✗ XML is INVALID\n\n';
      output += this.validationResult.message + '\n\n';
      
      if (this.validationResult.errors && this.validationResult.errors.length > 0) {
        output += 'Errors:\n';
        this.validationResult.errors.forEach((error, index) => {
          output += `${index + 1}. ${error}\n`;
        });
      }
    }

    this.aceOutputEditor.setValue(output, -1);
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

  clearInput() {
    this.aceInputEditor.setValue('');
    this.aceOutputEditor.setValue('');
    this.validationResult = null;
  }
}

