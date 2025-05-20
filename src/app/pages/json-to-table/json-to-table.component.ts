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
  private debounceTimer: any;
  
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
    this.aceEditor.setTheme('ace/theme/github');
    this.aceEditor.session.setMode('ace/mode/json');
    this.aceEditor.setValue(content);
    this.aceEditor.setOptions({
      fontSize: '14px',
      showPrintMargin: false,
      showGutter: true,
      highlightActiveLine: true,
      enableBasicAutocompletion: true,
      enableLiveAutocompletion: true,
      useWrapMode: true
    });

    this.aceEditor.session.on('change', () => {
      this.debouncedConvertToTable();
    });
  }

  private debouncedConvertToTable() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.convertToTable();
    }, 300);
  }

  loadSampleData() {
    const sampleData = [
      {
        "team": "Team A",
        "members": [
          { "name": "Alice", "role": "Leader" },
          { "name": "Bob", "role": "Member" }
        ],
        "details": {
          "location": "New York",
          "project": {
            "name": "Project X",
            "status": "Active"
          }
        },
        "tags": ["frontend", "backend"]
      },
      {
        "team": "Team B",
        "members": [
          { "name": "Carol", "role": "Leader" },
          { "name": "Dave", "role": "Member" }
        ],
        "details": {
          "location": "London",
          "project": {
            "name": "Project Y",
            "status": "Planning"
          }
        },
        "tags": ["mobile", "design"]
      }
    ];
    
    this.aceEditor.setValue(JSON.stringify(sampleData, null, 2));
    this.convertToTable();
  }

  private flattenObject(obj: any, prefix = ''): any {
    return Object.keys(obj).reduce((acc: any, key: string) => {
      const propName = prefix ? `${prefix}.${key}` : key;
      
      if (obj[key] === null || obj[key] === undefined) {
        acc[propName] = '';
      } else if (Array.isArray(obj[key])) {
        // Handle arrays by joining elements
        acc[propName] = obj[key].map((item: any) => 
          typeof item === 'object' ? JSON.stringify(item) : item
        ).join(', ');
      } else if (typeof obj[key] === 'object') {
        // Recursively flatten nested objects
        Object.assign(acc, this.flattenObject(obj[key], propName));
      } else {
        acc[propName] = obj[key];
      }
      
      return acc;
    }, {});
  }

  convertToTable() {
    try {
      const jsonContent = this.aceEditor.getValue().trim();
      if (!jsonContent) {
        this.tableData = [];
        this.columns = [];
        return;
      }

      const data = JSON.parse(jsonContent);
      
      if (!Array.isArray(data)) {
        throw new Error('JSON must be an array of objects');
      }

      if (data.length === 0) {
        this.tableData = [];
        this.columns = [];
        return;
      }

      // Flatten each object in the array
      const flattenedData = data.map(item => this.flattenObject(item));
      
      // Get all unique columns from all objects
      const allColumns = new Set<string>();
      flattenedData.forEach(item => {
        Object.keys(item).forEach(key => allColumns.add(key));
      });

      this.columns = Array.from(allColumns);
      this.tableData = flattenedData;
      this.errorMessage = '';
    } catch (error) {
      this.errorMessage = 'Invalid JSON format';
      console.error('Error parsing JSON:', error);
      this.tableData = [];
      this.columns = [];
    }
  }

  private initSplitter() {
    this.leftPane = document.querySelector('.json-input-container');
    this.rightPane = document.querySelector('.table-output-container');
    
    if (!this.leftPane || !this.rightPane || !this.splitter) {
      return;
    }
    
    // Initialize with 30/70 split
    this.leftPane.style.flex = '0.3';
    this.rightPane.style.flex = '0.7';
    
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
    
    document.addEventListener('selectstart', this.preventSelection);
  }
  
  @HostListener('document:mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    if (!this.isDragging || !this.leftPane || !this.rightPane) return;
    
    const deltaX = e.clientX - this.initialX;
    const newLeftWidth = Math.max(200, Math.min(this.containerWidth * 0.4, this.initialLeftWidth + deltaX));
    
    const leftRatio = newLeftWidth / this.containerWidth;
    const rightRatio = 1 - leftRatio;
    
    this.leftPane.style.flex = `${leftRatio}`;
    this.rightPane.style.flex = `${rightRatio}`;
    
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
      
      if (this.aceEditor) {
        this.aceEditor.resize();
      }
    }
  }
  
  private preventSelection(e: Event) {
    e.preventDefault();
    return false;
  }
} 