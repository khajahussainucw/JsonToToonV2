import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';

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
  @ViewChild('tableContainer', { static: false }) private tableContainer!: ElementRef<HTMLElement>;
  
  private aceEditor: any;
  private isDragging = false;
  private leftPane: HTMLElement | null = null;
  private rightPane: HTMLElement | null = null;
  private initialX = 0;
  private initialY = 0;
  private initialLeftWidth = 0;
  private initialLeftHeight = 0;
  private containerWidth = 0;
  private containerHeight = 0;
  private isMobile = false;
  private debounceTimer: any;
  
  tableData: any[] = [];
  columns: string[] = [];
  errorMessage: string = '';
  public isSingleObject: boolean = false;
  public hasValidJson: boolean = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private meta: Meta,
    private title: Title
  ) {
    this.setupMetaTags();
  }

  private setupMetaTags() {
    // Set page title
    this.title.setTitle('JSON to Table Converter - Convert Complex JSON to HTML Table Online');

    // Set meta description
    this.meta.updateTag({
      name: 'description',
      content: 'Convert complex JSON to HTML table. Supports complex JSON, offering a responsive interface for real-time conversion and validation.'
    });

    // Set meta keywords
    this.meta.updateTag({
      name: 'keywords',
      content: 'json to table,json to table converter,json to html table,convert json,json to html,json converter,json string,convert json to table,jsontotable,convert json to table online,jason to table,json into table,from json to table,json to tabel,json totable,jsonto table,transform json to table,json2 table,complex json to table online,json2table,json parser,json parser online,json object viewer'
    });

    // Add additional meta tags for better SEO
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });
    this.meta.updateTag({ name: 'author', content: 'JSON to Table Converter' });
    this.meta.updateTag({ property: 'og:title', content: 'JSON to Table Converter - Convert Complex JSON to HTML Table Online' });
    this.meta.updateTag({ property: 'og:description', content: 'Convert complex JSON to HTML table. Supports complex JSON, offering a responsive interface for real-time conversion and validation.' });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.initializeEditor('');
        this.checkMobileView();
        this.initSplitter();
        
        // Add window resize handler
        window.addEventListener('resize', () => {
          this.checkMobileView();
          if (this.aceEditor) {
            this.aceEditor.resize();
          }
        });
      }, 100);
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
    this.aceEditor.setValue(content, -1);
    this.aceEditor.setOptions({
      fontSize: '14px',
      showPrintMargin: false,
      showGutter: true,
      highlightActiveLine: true,
      enableBasicAutocompletion: true,
      enableLiveAutocompletion: true,
      useWrapMode: true,
      showLineNumbers: true,
      printMargin: false,
      displayIndentGuides: true
    });

    // Force a resize after initialization
    setTimeout(() => {
      this.aceEditor.resize();
    }, 100);

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
      "project": "FitTrack Pro",
      "description": "A comprehensive fitness tracker for maintaining a healthy lifestyle",
      "features": [
        {
          "id": 1,
          "feature_name": "Step Counter",
          "description": "Tracks daily steps and calorie burn"
        },
        {
          "id": 2,
          "feature_name": "Workout Plans",
          "description": "Personalized workout plans based on fitness goals"
        },
        {
          "id": 3,
          "feature_name": "Health Metrics",
          "description": "Monitors heart rate, sleep, and hydration levels"
        }
      ],
      "created_at": "2024-12-20",
      "version": "2.5.0",
      "integrations": [
        "Google Fit",
        "Apple Health"
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

  public formatValue(value: any): any {
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

  /**
   * Generates an Excel file from the HTML table and triggers download.
   */
  downloadAsExcel(): void {
    let tableHtml = this.tableContainer.nativeElement.innerHTML;
    // inject table border only
    tableHtml = tableHtml.replace(/<table/gi, '<table border="1"');
    // left-align all header and data cells and vertical middle
    tableHtml = tableHtml.replace(/<(th|td)/gi, '<$1 align="left" valign="middle"');
    // embed CSS style for borders and collapse
    const style = '<style>table, th, td { border:1px solid #000; border-collapse:collapse; }</style>';
    const excelContent = 
      `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
       <head><meta charset="UTF-8">${style}</head>
       <body>${tableHtml}</body></html>`;
    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'table-data.xls';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  convertToTable() {
    try {
      const jsonContent = this.aceEditor.getValue().trim();
      if (!jsonContent) {
        this.tableData = [];
        this.columns = [];
        this.errorMessage = '';
        this.hasValidJson = false;
        return;
      }

      const parsed = JSON.parse(jsonContent);
      this.hasValidJson = true;
      this.isSingleObject = !Array.isArray(parsed);
      const data = Array.isArray(parsed) ? parsed : [parsed];

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
      this.hasValidJson = false;
      console.error('Error processing JSON:', error);
      this.tableData = [];
      this.columns = [];
    }
  }

  private checkMobileView() {
    this.isMobile = window.innerWidth <= 768;
  }

  private initSplitter() {
    this.leftPane = document.querySelector('.json-input-container');
    this.rightPane = document.querySelector('.table-output-container');
    
    if (!this.leftPane || !this.rightPane || !this.splitter) {
      return;
    }
    
    if (this.isMobile) {
      // Mobile heights (no dragging needed)
      this.leftPane.style.height = 'calc(40vh - 12px)';
      this.rightPane.style.height = 'calc(60vh - 12px)';
    } else {
      // Desktop initial widths with splitter
      this.leftPane.style.flex = '0.22';
      this.rightPane.style.flex = '0.78';
      this.splitter.nativeElement.addEventListener('mousedown', this.startDrag.bind(this));
    }
  }
  
  private startDrag(e: MouseEvent) {
    if (!this.leftPane || !this.rightPane || this.isMobile) return;
    
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
    if (!this.isDragging || !this.leftPane || !this.rightPane || this.isMobile) return;
    
    const deltaX = e.clientX - this.initialX;
    // Constrain splitter so left pane never collapses entirely
    const minLeftWidth = 100; // minimum width in pixels for left pane
    const maxLeftWidth = this.containerWidth - minLeftWidth; // prevent right pane from collapsing below min
    const newLeftWidth = Math.max(
      minLeftWidth,
      Math.min(maxLeftWidth, this.initialLeftWidth + deltaX)
    );
    
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

  /**
   * Programmatically opens the maximized table modal (browser only).
   */
  openTableModal(): void {
    // Only run in browser
    if (isPlatformBrowser(this.platformId)) {
      import('bootstrap').then(({ Modal }) => {
        const modalElement = document.getElementById('tableModal');
        if (modalElement) {
          const tableModal = new Modal(modalElement, {
            backdrop: 'static',
            keyboard: true
          });
          tableModal.show();
        }
      }).catch(err => console.error('Failed to load bootstrap modal:', err));
    }
  }
}
