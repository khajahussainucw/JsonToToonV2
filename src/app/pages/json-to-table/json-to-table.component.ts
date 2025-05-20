import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';

declare const ace: any;

@Component({
  selector: 'app-json-to-table',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './json-to-table.component.html',
  styleUrl: './json-to-table.component.css'
})
export class JsonToTableComponent implements AfterViewInit {
  @ViewChild('editor') private editor!: ElementRef<HTMLElement>;
  private aceEditor: any;
  tableData: any[] = [];
  columns: string[] = [];
  errorMessage: string = '';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Initialize with sample JSON
      const sampleJson = JSON.stringify([
        { "id": 1, "name": "John", "age": 30 },
        { "id": 2, "name": "Jane", "age": 25 }
      ], null, 2);
      
      setTimeout(() => {
        this.initializeEditor(sampleJson);
      });
    }
  }

  private initializeEditor(content: string) {
    if (typeof ace === 'undefined') {
      console.error('Ace editor is not loaded');
      return;
    }

    this.aceEditor = ace.edit(this.editor.nativeElement);
    this.aceEditor.setTheme('ace/theme/monokai');
    this.aceEditor.session.setMode('ace/mode/json');
    this.aceEditor.setValue(content);
    this.aceEditor.setOptions({
      fontSize: '14px',
      showPrintMargin: false,
      showGutter: true,
      highlightActiveLine: true,
      enableBasicAutocompletion: true,
      enableLiveAutocompletion: true
    });
    
    this.convertToTable();
  }

  convertToTable() {
    try {
      const jsonContent = this.aceEditor.getValue();
      const data = JSON.parse(jsonContent);
      
      if (!Array.isArray(data)) {
        throw new Error('JSON must be an array of objects');
      }

      if (data.length === 0) {
        this.tableData = [];
        this.columns = [];
        return;
      }

      // Get columns from the first object
      this.columns = Object.keys(data[0]);
      this.tableData = data;
      this.errorMessage = '';
    } catch (error) {
      this.errorMessage = 'Invalid JSON format';
      console.error('Error parsing JSON:', error);
    }
  }
} 