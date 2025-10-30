import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';
import * as TOML from 'smol-toml';

declare var ace: any;

@Component({
  selector: 'app-toml-validator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './toml-validator.component.html',
  styleUrl: './toml-validator.component.css'
})
export class TomlValidatorComponent implements AfterViewInit {
  @ViewChild('inputEditor') private inputEditor!: ElementRef<HTMLElement>;
  @ViewChild('outputEditor') private outputEditor!: ElementRef<HTMLElement>;

  private aceInputEditor: any;
  private aceOutputEditor: any;

  errorMessage = '';
  copySuccessMessage = '';
  validationResult = '';
  isValid = false;

  constructor(private titleService: Title, private metaService: Meta) {
    this.titleService.setTitle('TOML Validator - Validate TOML Syntax Online');
    this.metaService.updateTag({
      name: 'description',
      content: 'Validate TOML configuration files online. Free TOML syntax validator.'
    });
  }

  ngAfterViewInit() {
    this.initializeEditor();
  }

  private initializeEditor() {
    this.aceInputEditor = ace.edit(this.inputEditor.nativeElement);
    this.aceInputEditor.setTheme('ace/theme/github');
    this.aceInputEditor.session.setMode('ace/mode/toml');
    this.aceInputEditor.setOptions({
      useWrapMode: true,
      fontSize: '14px',
      showPrintMargin: false,
    });
    this.aceInputEditor.getSession().setUseWrapMode(true);

    this.aceInputEditor.session.on('change', () => {
      this.validateToml();
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

  loadSampleToml() {
    const sampleToml = `title = "TOML Example"

[owner]
name = "Tom Preston-Werner"
dob = 1979-05-27T07:32:00-08:00

[database]
server = "192.168.1.1"
ports = [ 8001, 8001, 8002 ]
connection_max = 5000
enabled = true`;
    
    this.aceInputEditor.setValue(sampleToml, -1);
    this.aceInputEditor.clearSelection();
  }

  validateToml() {
    try {
      this.errorMessage = '';
      this.copySuccessMessage = '';

      const tomlContent = this.aceInputEditor.getValue().trim();
      
      if (!tomlContent) {
        this.aceOutputEditor.setValue('');
        this.validationResult = '';
        return;
      }

      // Try to parse TOML
      const parsed = TOML.parse(tomlContent);
      
      // If successful, it's valid
      this.isValid = true;
      this.validationResult = 'Valid';
      
      const message = '✓ TOML is valid!\n\nNo syntax errors found.';
      this.aceOutputEditor.setValue(message, -1);
      this.aceOutputEditor.clearSelection();
    } catch (error: any) {
      this.isValid = false;
      this.validationResult = 'Invalid';
      const errorReport = '✗ TOML Validation Error:\n\n' + error.message;
      this.aceOutputEditor.setValue(errorReport, -1);
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

