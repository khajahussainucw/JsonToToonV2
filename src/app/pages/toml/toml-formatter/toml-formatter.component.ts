import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';
import * as TOML from 'smol-toml';

declare var ace: any;

@Component({
  selector: 'app-toml-formatter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './toml-formatter.component.html',
  styleUrl: './toml-formatter.component.css'
})
export class TomlFormatterComponent implements AfterViewInit {
  @ViewChild('inputEditor') private inputEditor!: ElementRef<HTMLElement>;
  @ViewChild('outputEditor') private outputEditor!: ElementRef<HTMLElement>;

  private aceInputEditor: any;
  private aceOutputEditor: any;

  errorMessage = '';
  copySuccessMessage = '';

  constructor(private titleService: Title, private metaService: Meta) {
    this.titleService.setTitle('TOML Formatter - Format and Beautify TOML Online');
    this.metaService.updateTag({
      name: 'description',
      content: 'Format and beautify TOML configuration files online. Free TOML formatter with syntax highlighting.'
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
      this.formatToml();
    });

    this.aceOutputEditor = ace.edit(this.outputEditor.nativeElement);
    this.aceOutputEditor.setTheme('ace/theme/github');
    this.aceOutputEditor.session.setMode('ace/mode/toml');
    this.aceOutputEditor.setOptions({
      useWrapMode: true,
      fontSize: '14px',
      showPrintMargin: false,
    });
    this.aceOutputEditor.getSession().setUseWrapMode(true);
  }

  loadSampleToml() {
    const sampleToml = `title="TOML Example"
[owner]
name="Tom Preston-Werner"
dob=1979-05-27T07:32:00-08:00
[database]
server="192.168.1.1"
ports=[8001,8001,8002]
connection_max=5000
enabled=true
[servers]
[servers.alpha]
ip="10.0.0.1"
dc="eqdc10"
[servers.beta]
ip="10.0.0.2"
dc="eqdc10"`;
    
    this.aceInputEditor.setValue(sampleToml, -1);
    this.aceInputEditor.clearSelection();
  }

  formatToml() {
    try {
      this.errorMessage = '';
      this.copySuccessMessage = '';

      const tomlContent = this.aceInputEditor.getValue().trim();
      
      if (!tomlContent) {
        this.aceOutputEditor.setValue('');
        return;
      }

      // Parse and stringify to format
      const parsed = TOML.parse(tomlContent);
      const formatted = TOML.stringify(parsed);
      
      this.aceOutputEditor.setValue(formatted, -1);
      this.aceOutputEditor.clearSelection();
    } catch (error: any) {
      this.errorMessage = 'Error formatting TOML: ' + error.message;
      this.aceOutputEditor.setValue('');
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

  downloadToml() {
    const content = this.aceOutputEditor.getValue();
    if (!content) {
      this.errorMessage = 'No output to download';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted.toml';
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

