import { Component, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';

declare var ace: any;

@Component({
  selector: 'app-markdown-table-generator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './markdown-table-generator.component.html',
  styleUrl: './markdown-table-generator.component.css'
})
export class MarkdownTableGeneratorComponent implements AfterViewInit {
  @ViewChild('outputEditor') private outputEditor!: ElementRef<HTMLElement>;

  private aceOutputEditor: any;

  rows = 3;
  cols = 3;
  alignment = 'left';
  includeHeader = true;
  errorMessage = '';
  copySuccessMessage = '';

  tableData: string[][] = [];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private titleService: Title, 
    private metaService: Meta
  ) {
    this.titleService.setTitle('Markdown Table Generator - Create Tables Online');
    this.metaService.updateTag({
      name: 'description',
      content: 'Generate Markdown tables online. Free Markdown table generator with preview.'
    });
    
    this.initializeTable();
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.initializeEditor();
        this.generateTable();
      }, 100);
    }
  }

  private initializeEditor() {
    if (typeof window === 'undefined' || typeof ace === 'undefined') {
      console.error('Ace editor is not loaded');
      return;
    }
    this.aceOutputEditor = ace.edit(this.outputEditor.nativeElement);
    this.aceOutputEditor.setTheme('ace/theme/github');
    this.aceOutputEditor.session.setMode('ace/mode/markdown');
    this.aceOutputEditor.setOptions({
      useWrapMode: true,
      fontSize: '14px',
      showPrintMargin: false,
    });
    this.aceOutputEditor.getSession().setUseWrapMode(true);
  }

  private initializeTable() {
    this.tableData = [];
    for (let i = 0; i < this.rows; i++) {
      const row: string[] = [];
      for (let j = 0; j < this.cols; j++) {
        if (i === 0 && this.includeHeader) {
          row.push(`Header ${j + 1}`);
        } else {
          row.push(`Cell ${i + 1}-${j + 1}`);
        }
      }
      this.tableData.push(row);
    }
  }

  onRowsChange() {
    const newRows = Number(this.rows);
    if (newRows < 1 || newRows > 50) return;

    while (this.tableData.length < newRows) {
      const row: string[] = [];
      for (let j = 0; j < this.cols; j++) {
        row.push(`Cell ${this.tableData.length + 1}-${j + 1}`);
      }
      this.tableData.push(row);
    }
    while (this.tableData.length > newRows) {
      this.tableData.pop();
    }
    this.generateTable();
  }

  onColsChange() {
    const newCols = Number(this.cols);
    if (newCols < 1 || newCols > 20) return;

    for (let i = 0; i < this.tableData.length; i++) {
      while (this.tableData[i].length < newCols) {
        this.tableData[i].push(`Cell ${i + 1}-${this.tableData[i].length + 1}`);
      }
      while (this.tableData[i].length > newCols) {
        this.tableData[i].pop();
      }
    }
    this.generateTable();
  }

  onCellChange(rowIndex: number, colIndex: number, value: string) {
    this.tableData[rowIndex][colIndex] = value;
    this.generateTable();
  }

  onSettingsChange() {
    this.generateTable();
  }

  generateTable() {
    if (!this.aceOutputEditor) return;

    const alignChar = this.alignment === 'left' ? ':--' : 
                     this.alignment === 'center' ? ':-:' : 
                     '--:';

    let markdown = '';
    
    // Add first row (headers or data)
    markdown += '| ' + this.tableData[0].join(' | ') + ' |\n';
    
    // Add separator row
    const separators = Array(this.cols).fill(alignChar);
    markdown += '| ' + separators.join(' | ') + ' |\n';
    
    // Add remaining rows
    for (let i = 1; i < this.tableData.length; i++) {
      markdown += '| ' + this.tableData[i].join(' | ') + ' |\n';
    }

    this.aceOutputEditor.setValue(markdown.trim(), -1);
    this.aceOutputEditor.clearSelection();
  }

  loadSampleTable() {
    this.rows = 4;
    this.cols = 3;
    this.includeHeader = true;
    this.alignment = 'left';
    
    this.tableData = [
      ['Feature', 'Status', 'Priority'],
      ['Authentication', 'Complete', 'High'],
      ['Dashboard', 'In Progress', 'High'],
      ['Reports', 'Planned', 'Medium']
    ];
    
    this.generateTable();
  }

  copyToClipboard() {
    const content = this.aceOutputEditor.getValue();
    if (!content) {
      this.errorMessage = 'No table to copy';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    navigator.clipboard.writeText(content).then(() => {
      this.copySuccessMessage = 'Copied to clipboard!';
      setTimeout(() => this.copySuccessMessage = '', 2000);
    });
  }

  downloadMarkdown() {
    const content = this.aceOutputEditor.getValue();
    if (!content) {
      this.errorMessage = 'No table to download';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'table.md';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  clearTable() {
    this.rows = 3;
    this.cols = 3;
    this.alignment = 'left';
    this.includeHeader = true;
    this.initializeTable();
    this.generateTable();
  }
}

