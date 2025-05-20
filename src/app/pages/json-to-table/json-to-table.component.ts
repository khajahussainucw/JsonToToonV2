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
    const sampleData = {
      "simpleValues": {
        "string": "Hello World",
        "number": 42,
        "boolean": true,
        "null": null
      },
      "arrays": {
        "simple": [1, 2, 3, 4, 5],
        "mixed": [1, "two", { "three": 3 }, [4, 5]],
        "objects": [
          { "id": 1, "name": "Item 1" },
          { "id": 2, "name": "Item 2" }
        ]
      },
      "nestedObjects": {
        "level1": {
          "level2": {
            "level3": {
              "deep": "Very Deep Value"
            }
          }
        }
      },
      "complexArray": [
        {
          "id": 1,
          "details": {
            "info": {
              "tags": ["important", "urgent"]
            }
          }
        },
        {
          "id": 2,
          "details": {
            "info": {
              "tags": ["normal"]
            }
          }
        }
      ]
    };
    
    this.aceEditor.setValue(JSON.stringify(sampleData, null, 2));
    this.convertToTable();
  }

  isArray(value: any): boolean {
    return Array.isArray(value);
  }

  isObject(value: any): boolean {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  getObjectKeys(obj: any): string[] {
    if (!obj || typeof obj !== 'object') return [];
    return Object.keys(obj);
  }

  hasComplexItems(arr: any[]): boolean {
    if (!Array.isArray(arr) || arr.length === 0) return false;
    return arr.some(item => typeof item === 'object' && item !== null);
  }

  getCommonKeys(arr: any[]): string[] {
    if (!Array.isArray(arr) || arr.length === 0) return [];
    
    // Get all possible keys from all objects
    const keySet = new Set<string>();
    arr.forEach(item => {
      if (item && typeof item === 'object') {
        Object.keys(item).forEach(key => keySet.add(key));
      }
    });
    
    return Array.from(keySet);
  }

  private formatValue(value: any): any {
    if (value === null || value === undefined) {
      return '';
    }
    return value; // Return as is for recursive handling
  }

  private flattenObject(obj: any): any {
    // Handle null or undefined
    if (obj === null || obj === undefined) {
      return { value: '' };
    }

    // Handle primitive types
    if (typeof obj !== 'object') {
      return { value: String(obj) };
    }

    // Keep structure for recursive handling
    return Object.keys(obj).reduce((acc: any, key: string) => {
      acc[key] = this.formatValue(obj[key]);
      return acc;
    }, {});
  }

  convertToTable() {
    try {
      const jsonContent = this.aceEditor.getValue().trim();
      if (!jsonContent) {
        this.tableData = [];
        this.columns = [];
        this.errorMessage = '';
        return;
      }

      let data = JSON.parse(jsonContent);
      
      // Convert single object to array
      if (!Array.isArray(data)) {
        data = [data];
      }

      // Validate that we have objects
      if (data.length === 0 || data.some((item: unknown) => typeof item !== 'object' || item === null)) {
        throw new Error('JSON must contain objects');
      }

      // Process each object in the array
      const processedData = data.map((item: Record<string, any>) => {
        try {
          return this.flattenObject(item);
        } catch (err) {
          console.warn('Error processing object:', err);
          return item;
        }
      });

      // Get all unique top-level keys
      const allColumns = new Set<string>();
      processedData.forEach((item: Record<string, any>) => {
        if (item && typeof item === 'object') {
          Object.keys(item).forEach(key => allColumns.add(key));
        }
      });

      this.columns = Array.from(allColumns);
      this.tableData = processedData;
      this.errorMessage = '';
    } catch (error: any) {
      this.errorMessage = error.message || 'Invalid JSON format';
      console.error('Error processing JSON:', error);
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