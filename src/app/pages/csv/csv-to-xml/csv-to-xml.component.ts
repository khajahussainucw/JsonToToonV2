import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';

declare var ace: any;

@Component({
  selector: 'app-csv-to-xml',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './csv-to-xml.component.html',
  styleUrl: './csv-to-xml.component.css'
})
export class CsvToXmlComponent implements AfterViewInit {
  @ViewChild('inputEditor') private inputEditor!: ElementRef<HTMLElement>;
  @ViewChild('outputEditor') private outputEditor!: ElementRef<HTMLElement>;

  private aceInputEditor: any;
  private aceOutputEditor: any;

  errorMessage = '';
  successMessage = '';
  delimiter = ',';
  hasHeader = true;
  showConfig = false;
  rootElement = 'data';
  rowElement = 'row';
  indent = 2;
  includeXmlDeclaration = true;
  useAttributes = false;

  constructor(private titleService: Title, private metaService: Meta) {
    this.titleService.setTitle('CSV to XML Converter - Convert CSV to XML Format');
    this.metaService.updateTag({
      name: 'description',
      content: 'Convert CSV files to XML format. Customize root element, row element, indentation, and choose between elements or attributes.'
    });
  }

  ngAfterViewInit() {
    this.initializeEditor();
  }

  private initializeEditor() {
    this.aceInputEditor = ace.edit(this.inputEditor.nativeElement);
    this.aceInputEditor.setTheme('ace/theme/github');
    this.aceInputEditor.session.setMode('ace/mode/text');
    this.aceInputEditor.setOptions({
      fontSize: '14px',
      showPrintMargin: false,
      highlightActiveLine: true,
      wrap: true
    });

    // Auto-convert on input change
    this.aceInputEditor.session.on('change', () => {
      this.convertCsvToXml();
    });

    this.aceOutputEditor = ace.edit(this.outputEditor.nativeElement);
    this.aceOutputEditor.setTheme('ace/theme/github');
    this.aceOutputEditor.session.setMode('ace/mode/xml');
    this.aceOutputEditor.setOptions({
      fontSize: '14px',
      showPrintMargin: false,
      highlightActiveLine: true,
      wrap: true,
      readOnly: true
    });

    this.loadSampleCsv();
  }

  loadSampleCsv() {
    const sampleCsv = `Name,Age,Email,Department,Salary
John Doe,28,john@example.com,Engineering,75000
Jane Smith,34,jane@example.com,Marketing,65000
Bob Johnson,45,bob@example.com,Sales,80000
Alice Williams,29,alice@example.com,Engineering,72000`;
    
    this.aceInputEditor.setValue(sampleCsv, -1);
    this.aceInputEditor.clearSelection();
    this.convertCsvToXml();
  }

  convertCsvToXml() {
    try {
      this.errorMessage = '';
      this.successMessage = '';

      const csvContent = this.aceInputEditor.getValue().trim();
      if (!csvContent) {
        this.aceOutputEditor.setValue('');
        return;
      }

      const lines = csvContent.split('\n').filter((line: string) => line.trim());
      if (lines.length === 0) {
        this.aceOutputEditor.setValue('');
        return;
      }

      let xml = '';
      
      // Add XML declaration
      if (this.includeXmlDeclaration) {
        xml += '<?xml version="1.0" encoding="UTF-8"?>\n';
      }

      // Parse headers
      const headers = this.parseCsvLine(lines[0]);
      const normalizedHeaders = headers.map(h => this.normalizeXmlName(h.trim()));

      // Start root element
      xml += `<${this.normalizeXmlName(this.rootElement)}>\n`;

      // Process data rows
      const dataStartIndex = this.hasHeader ? 1 : 0;
      let rowCount = 0;

      for (let i = dataStartIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = this.parseCsvLine(line);
        
        if (this.useAttributes) {
          // Create row with attributes
          xml += this.indentString(1) + `<${this.normalizeXmlName(this.rowElement)}`;
          
          for (let j = 0; j < normalizedHeaders.length; j++) {
            const header = this.hasHeader ? normalizedHeaders[j] : `column${j + 1}`;
            const value = values[j] || '';
            const escapedValue = this.escapeXmlAttribute(value);
            xml += ` ${header}="${escapedValue}"`;
          }
          
          xml += ' />\n';
        } else {
          // Create row with child elements
          xml += this.indentString(1) + `<${this.normalizeXmlName(this.rowElement)}>\n`;
          
          for (let j = 0; j < normalizedHeaders.length; j++) {
            const header = this.hasHeader ? normalizedHeaders[j] : `column${j + 1}`;
            const value = values[j] || '';
            const escapedValue = this.escapeXmlContent(value);
            xml += this.indentString(2) + `<${header}>${escapedValue}</${header}>\n`;
          }
          
          xml += this.indentString(1) + `</${this.normalizeXmlName(this.rowElement)}>\n`;
        }
        
        rowCount++;
      }

      // Close root element
      xml += `</${this.normalizeXmlName(this.rootElement)}>`;

      this.aceOutputEditor.setValue(xml, -1);
      this.aceOutputEditor.clearSelection();
      this.successMessage = `Converted ${rowCount} row(s) to XML`;
    } catch (error: any) {
      this.errorMessage = 'Error converting CSV to XML: ' + error.message;
      this.aceOutputEditor.setValue('');
    }
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === this.delimiter && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }

  private normalizeXmlName(name: string): string {
    // XML element/attribute names must start with letter or underscore
    // Can contain letters, digits, hyphens, underscores, and periods
    let normalized = name
      .replace(/[^a-zA-Z0-9_\-\.]/g, '_')
      .replace(/^[^a-zA-Z_]/, '_');
    
    // Ensure it's not empty
    if (!normalized) {
      normalized = 'item';
    }
    
    return normalized;
  }

  private escapeXmlContent(content: string): string {
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private escapeXmlAttribute(content: string): string {
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private indentString(level: number): string {
    return ' '.repeat(level * this.indent);
  }

  uploadFile(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.aceInputEditor.setValue(e.target.result, -1);
        this.aceInputEditor.clearSelection();
        this.convertCsvToXml();
      };
      reader.readAsText(file);
    }
    event.target.value = '';
  }

  downloadXml() {
    const content = this.aceOutputEditor.getValue();
    if (!content) {
      this.errorMessage = 'No output to download';
      return;
    }

    const blob = new Blob([content], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.xml';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  copyXml() {
    const content = this.aceOutputEditor.getValue();
    if (!content) {
      this.errorMessage = 'No output to copy';
      return;
    }

    navigator.clipboard.writeText(content).then(() => {
      this.successMessage = 'Copied to clipboard!';
      setTimeout(() => this.successMessage = '', 2000);
    });
  }

  clearInput() {
    this.aceInputEditor.setValue('');
    this.aceOutputEditor.setValue('');
    this.errorMessage = '';
    this.successMessage = '';
  }
}

