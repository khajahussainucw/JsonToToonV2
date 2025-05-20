import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject, HostListener } from '@angular/core';
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
  @ViewChild('splitter') private splitter!: ElementRef<HTMLElement>;
  
  private aceEditor: any;
  private isDragging = false;
  private leftPane: HTMLElement | null = null;
  private rightPane: HTMLElement | null = null;
  private initialX = 0;
  private initialLeftWidth = 0;
  private containerWidth = 0;
  
  tableData: any[] = [];
  columns: string[] = [];
  errorMessage: string = '';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.initializeEditor('');
        this.initSplitter();
        this.loadSampleData();
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
  }

  loadSampleData() {
    const sampleData = [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "age": 30,
        "address": {
          "street": "123 Main St",
          "city": "Boston",
          "state": "MA",
          "zip": "02108"
        },
        "roles": ["admin", "user"],
        "active": true
      },
      {
        "id": 2,
        "name": "Jane Smith",
        "email": "jane@example.com",
        "age": 25,
        "address": {
          "street": "456 Park Ave",
          "city": "New York",
          "state": "NY",
          "zip": "10022"
        },
        "roles": ["user"],
        "active": true
      },
      {
        "id": 3,
        "name": "Bob Johnson",
        "email": "bob@example.com",
        "age": 35,
        "address": {
          "street": "789 Elm St",
          "city": "Chicago",
          "state": "IL",
          "zip": "60601"
        },
        "roles": ["user", "editor"],
        "active": false
      }
    ];
    
    this.aceEditor.setValue(JSON.stringify(sampleData, null, 2));
    this.convertToTable();
  }

  private initSplitter() {
    this.leftPane = document.querySelector('.json-input-container');
    this.rightPane = document.querySelector('.table-output-container');
    
    if (!this.leftPane || !this.rightPane || !this.splitter) {
      return;
    }
    
    // Initialize with 50/50 split
    this.leftPane.style.flex = '1';
    this.rightPane.style.flex = '1';
    
    this.splitter.nativeElement.addEventListener('mousedown', this.startDrag.bind(this));
  }
  
  private startDrag(e: MouseEvent) {
    if (!this.leftPane || !this.rightPane) return;
    
    this.isDragging = true;
    this.initialX = e.clientX;
    
    const leftRect = this.leftPane.getBoundingClientRect();
    const containerRect = this.leftPane.parentElement?.getBoundingClientRect();
    
    this.initialLeftWidth = leftRect.width;
    this.containerWidth = containerRect?.width || 0;
    
    document.documentElement.classList.add('resize-cursor');
    this.splitter.nativeElement.classList.add('dragging');
    
    // Prevent text selection during drag
    document.addEventListener('selectstart', this.preventSelection);
  }
  
  @HostListener('document:mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    if (!this.isDragging || !this.leftPane || !this.rightPane) return;
    
    const deltaX = e.clientX - this.initialX;
    const newLeftWidth = Math.max(100, Math.min(this.containerWidth - 100, this.initialLeftWidth + deltaX));
    
    const leftRatio = newLeftWidth / this.containerWidth;
    const rightRatio = 1 - leftRatio;
    
    this.leftPane.style.flex = `${leftRatio}`;
    this.rightPane.style.flex = `${rightRatio}`;
    
    // Update editor size
    if (this.aceEditor) {
      this.aceEditor.resize();
    }
  }
  
  @HostListener('document:mouseup')
  onMouseUp() {
    if (this.isDragging) {
      this.isDragging = false;
      document.documentElement.classList.remove('resize-cursor');
      this.splitter.nativeElement.classList.remove('dragging');
      document.removeEventListener('selectstart', this.preventSelection);
      
      // Update editor size
      if (this.aceEditor) {
        this.aceEditor.resize();
      }
    }
  }
  
  private preventSelection(e: Event) {
    e.preventDefault();
    return false;
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