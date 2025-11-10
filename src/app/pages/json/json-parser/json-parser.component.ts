import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { ShareModalComponent } from '../../../components/share-modal/share-modal.component';
import { HttpClientModule } from '@angular/common/http';
import { JsonStorageService } from '../../../services/json-storage.service';

declare const ace: any;

@Component({
  selector: 'app-json-parser',
  standalone: true,
  imports: [CommonModule, RouterModule, ShareModalComponent, HttpClientModule],
  templateUrl: './json-parser.component.html',
  styleUrl: './json-parser.component.css'
})
export class JsonParserComponent implements AfterViewInit {
  @ViewChild('editor') private editor!: ElementRef<HTMLElement>;
  @ViewChild('splitter') private splitter!: ElementRef<HTMLElement>;
  @ViewChild('tableContainer', { static: false }) private tableContainer!: ElementRef<HTMLElement>;
  
  private aceEditor: any;
  private editorBackupContent: string = '';
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
  public isLoading: boolean = false;
  private isLoadingSharedJson = false;
  public isParentTransposed: boolean = false;
  public isChildTransposed: boolean = false;
  public isEditMode: boolean = false;

  // Filtering support
  public filters: Record<string, string> = {};
  public filteredData: any[] = [];
  private removedColumns: Set<string> = new Set();
  public editingRow: number | null = null;
  public editingCol: string | null = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private meta: Meta,
    private title: Title,
    private route: ActivatedRoute,
    private jsonStorageService: JsonStorageService
  ) {
    this.setupMetaTags();
    if (isPlatformBrowser(this.platformId)) {
      this.handleUrlParameters();
    }
  }

  private setupMetaTags() {
    // Set page title
    this.title.setTitle('JSON Parser - Parse, View and Read JSON Online');

    // Set meta description
    this.meta.updateTag({
      name: 'description',
      content: 'Online JSON parser to parse, view, read and validate JSON data. Supports complex JSON structures with a clean interface for real-time parsing and visualization.'
    });

    // Set meta keywords
    this.meta.updateTag({
      name: 'keywords',
      content: 'json parser,json viewer,json reader,json parser online,parse json,json viewer online,json reader online,view json,read json,json validator,json visualizer,json object viewer,json data parser,parse json online,json file viewer,json file reader,json string parser,json pretty viewer,json format viewer'
    });

    // Add additional meta tags for better SEO
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });
    this.meta.updateTag({ name: 'author', content: 'JSON Parser' });
    this.meta.updateTag({ property: 'og:title', content: 'JSON Parser - Parse, View and Read JSON Online' });
    this.meta.updateTag({ property: 'og:description', content: 'Online JSON parser to parse, view, read and validate JSON data. Supports complex JSON structures with a clean interface for real-time parsing and visualization.' });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
  }

  private handleUrlParameters(): void {
    this.route.queryParams.subscribe(params => {
      const guid = params['guid'];
      if (guid && !this.isLoadingSharedJson) {
        this.isLoadingSharedJson = true;
        this.isLoading = true;
        this.jsonStorageService.getJsonByGuid(guid).subscribe({
          next: (jsonData: any) => {
            // Wait for editor to be initialized
            const checkEditor = setInterval(() => {
              if (this.aceEditor) {
                this.aceEditor.setValue(jsonData, -1);
                this.convertToTable();
                clearInterval(checkEditor);
              }
            }, 100);
          },
          error: (error: any) => {
            console.error('Error loading shared JSON:', error);
            this.errorMessage = 'Failed to load shared JSON. The link might be expired or invalid.';
          },
          complete: () => {
            this.isLoadingSharedJson = false;
              this.isLoading = false;
            }
        });
      }
    });
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
        
        if (!this.isLoadingSharedJson) {
          this.isLoading = false;
        }
      }, 100);
    }
  }

  private initializeEditor(content: string) {
    if (typeof window === 'undefined' || typeof ace === 'undefined') {
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

    // Ensure long lines wrap within the editor
    this.aceEditor.session.setUseWrapMode(true);
    this.aceEditor.session.setOption('wrap', 'free');

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
      // Clear removed columns when re-parsing JSON (new dataset)
      this.removedColumns.clear();
      this.convertToTable();
    }, 300);
  }

  loadSampleData() {
    const sampleData = {
      "store": "TechHub Electronics",
      "description": "Premium electronics retailer",
      "products": [
        {
          "id": 1,
          "name": "UltraBook Pro 15",
          "price": 1299.99,
          "category": "Computers"
        },
        {
          "id": 2,
          "name": "Wireless Earbuds Max",
          "price": 199.99,
          "category": "Audio"
        }
      ],
      "rating": 4.7,
      "locations": ["New York", "Los Angeles", "Chicago"]
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
    link.download = 'JsonConvertedToExcel.xls';
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
        this.filteredData = [];
        this.columns = [];
        this.errorMessage = '';
        this.hasValidJson = false;
        return;
      }

      // Attempt to parse JSON; if it's a wrapped string, parse twice
      let parsed: any;
      try {
        const firstParse = JSON.parse(jsonContent);
        // If the content was a JSON-encoded string, parse it again
        parsed = typeof firstParse === 'string'
          ? JSON.parse(firstParse)
          : firstParse;
      } catch (err: any) {
        this.hasValidJson = false;
        this.errorMessage = err.message || 'Invalid JSON format';
        this.tableData = [];
        this.filteredData = [];
        this.columns = [];
        return;
      }

      this.hasValidJson = true;
      this.isSingleObject = !Array.isArray(parsed);
      const data = Array.isArray(parsed) ? parsed : [parsed];

      // Validate that we have objects
      if (data.length === 0 || data.some((item: unknown) => typeof item !== 'object' || item === null)) {
        this.hasValidJson = false;
        this.errorMessage = 'JSON must contain objects';
        this.tableData = [];
        this.filteredData = [];
        this.columns = [];
        return;
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

      this.columns = Array.from(allColumns).filter(col => !this.removedColumns.has(col));
      this.tableData = processedData;
      // Reset filters based on new columns
      Object.keys(this.filters).forEach(key => {
        if (!this.columns.includes(key)) {
          delete this.filters[key];
        }
      });
      this.applyFilters();
      this.errorMessage = '';
    } catch (error: any) {
      this.hasValidJson = false;
      this.errorMessage = error.message || 'Failed to process JSON';
      this.tableData = [];
      this.filteredData = [];
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
          // Store the current editor content
          this.editorBackupContent = this.aceEditor?.getValue() || '';

          // Hide background content to avoid duplicate search results
          document.body.classList.add('table-modal-active');
          
          const tableModal = new Modal(modalElement, {
            keyboard: true,
            backdrop: true
          });
          
          // Add event listener for modal close - use more specific cleanup
          const handleModalClose = () => {
            // Restore the editor content when modal is closed
            if (this.aceEditor && this.editorBackupContent) {
              this.aceEditor.setValue(this.editorBackupContent);
              this.convertToTable(); // Refresh the table view
            }
            
            // Force remove any remaining backdrop
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
              backdrop.remove();
            }
            
            // Ensure body classes are cleaned up
            document.body.classList.remove('modal-open');
            document.body.classList.remove('table-modal-active');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
            
            // Remove the event listener
            modalElement.removeEventListener('hidden.bs.modal', handleModalClose);
          };
          
          modalElement.addEventListener('hidden.bs.modal', handleModalClose);
          
          tableModal.show();
          
          
        }
      }).catch(err => console.error('Failed to load bootstrap modal:', err));
    }
  }

  /**
   * Manually close the table modal and ensure proper cleanup
   */
  closeTableModal(): void {
    if (isPlatformBrowser(this.platformId)) {
      import('bootstrap').then(({ Modal }) => {
        const modalElement = document.getElementById('tableModal');
        if (modalElement) {
          const tableModal = Modal.getInstance(modalElement);
          if (tableModal) {
            tableModal.hide();
          }
          
          // Restore the editor content
          document.body.classList.remove('table-modal-active');
          if (this.aceEditor && this.editorBackupContent) {
            this.aceEditor.setValue(this.editorBackupContent);
            this.convertToTable();
          }
          
          // Force cleanup
          setTimeout(() => {
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
              backdrop.remove();
            }
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
          }, 100);
        }
      }).catch(err => console.error('Failed to close modal:', err));
    }
  }

  getEditorContent(): string {
    return this.aceEditor?.getValue() || '';
  }

  openShareModal(): void {
    const json = this.getEditorContent();
    let isValid = true;
    try {
      if (!json.trim()) {
        isValid = false;
      } else {
        JSON.parse(json);
      }
    } catch (e) {
      isValid = false;
    }
    if (!isValid) {
      this.showInvalidJsonModal();
      return;
    }
    // Open the share modal programmatically
    if (isPlatformBrowser(this.platformId)) {
      import('bootstrap').then(({ Modal }) => {
        const modalElement = document.getElementById('shareModal');
        if (modalElement) {
          const shareModal = new Modal(modalElement, { keyboard: true });
          shareModal.show();
        }
      });
    }
  }

  showInvalidJsonModal(): void {
    if (isPlatformBrowser(this.platformId)) {
      import('bootstrap').then(({ Modal }) => {
        let modalElement = document.getElementById('invalidJsonModal');
        if (!modalElement) {
          // Create the modal if it doesn't exist
          modalElement = document.createElement('div');
          modalElement.id = 'invalidJsonModal';
          modalElement.className = 'modal fade';
          modalElement.tabIndex = -1;
          modalElement.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
              <div class="modal-content">
                <div class="modal-header bg-black text-white">
                  <h5 class="modal-title"><i class='fas fa-exclamation-triangle me-2'></i>Invalid JSON</h5>
                  <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                  <p>Please enter a valid JSON in the editor before sharing.</p>
                </div>
                <div class="modal-footer bg-light">
                  <button type="button" class="btn btn-sm btn-dark" data-bs-dismiss="modal">
                    <i class="fas fa-times me-2"></i> Close
                  </button>
                </div>
              </div>
            </div>
          `;
          document.body.appendChild(modalElement);
        }
        const invalidModal = new Modal(modalElement, { keyboard: true });
        invalidModal.show();
      });
    }
  }

  // Update filter for a specific column
  removeColumn(column: string): void {
    this.removedColumns.add(column);
    this.columns = this.columns.filter(c => c !== column);
    delete this.filters[column];
    this.applyFilters();

    // Also remove from underlying JSON/editor
    this.removeColumnFromEditor(column);
  }

  public getEditValue(value: any): string {
    if (this.isArray(value) || this.isObject(value)) {
      return JSON.stringify(value);
    }
    return value;
  }

  startEdit(rowIndex: number, column: string): void {
    if (!this.isEditMode) return;
    this.editingRow = rowIndex;
    this.editingCol = column;
  }

  saveEdit(rowIndex: number, column: string, newValue: string): void {
    // Update tableData and filteredData (which references same objects)
    if (rowIndex >= 0 && rowIndex < this.tableData.length) {
      // Try to parse as JSON first, then fall back to string
      let parsedValue: any;
      try {
        parsedValue = JSON.parse(newValue);
      } catch {
        parsedValue = newValue;
      }
      this.tableData[rowIndex][column] = parsedValue;
    }
    // Update Ace JSON
    try {
      const jsonContent = this.getEditorContent();
      const parsed: any = JSON.parse(jsonContent);
      let parsedValue: any;
      try {
        parsedValue = JSON.parse(newValue);
      } catch {
        parsedValue = newValue;
      }
      
      if (Array.isArray(parsed)) {
        if (rowIndex < parsed.length && parsed[rowIndex]) {
          parsed[rowIndex][column] = parsedValue;
        }
      } else {
        // Single object
        parsed[column] = parsedValue;
      }
      const updatedJson = JSON.stringify(parsed, null, 2);
      this.aceEditor.setValue(updatedJson, -1);
      this.editorBackupContent = updatedJson;
    } catch (e) {
      console.warn('Failed to update JSON on edit', e);
    }
    this.editingRow = null;
    this.editingCol = null;
    this.applyFilters();
  }

  private removeColumnFromEditor(column: string): void {
    try {
      const jsonContent = this.getEditorContent();
      if (!jsonContent.trim()) { return; }
      const parsed: any = JSON.parse(jsonContent);

      const processObj = (obj: any) => {
        if (obj && typeof obj === 'object') {
          if (Array.isArray(obj)) {
            obj.forEach(item => processObj(item));
          } else {
            delete obj[column];
            // Also iterate nested objects
            Object.values(obj).forEach(val => processObj(val));
          }
        }
      };

      processObj(parsed);
      // Update editor with formatted JSON
      const updatedJson = JSON.stringify(parsed, null, 2);
      this.aceEditor.setValue(updatedJson, -1);
      // Ensure any later modal close restores this updated content
      this.editorBackupContent = updatedJson;
      this.convertToTable();
    } catch (e) {
      console.warn('Failed to remove column from JSON:', e);
    }
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    // Exit any cell currently editing when mode toggles off
    if (!this.isEditMode) {
      this.editingRow = null;
      this.editingCol = null;
    }
  }

  updateFilter(column: string, value: string): void {
    this.filters[column] = value;
    this.applyFilters();
  }

  // Apply active filters to the table data
  private applyFilters(): void {
    const activeFilters = Object.entries(this.filters).filter(([_, v]) => v && v.trim() !== '');
    if (activeFilters.length === 0) {
      this.filteredData = [...this.tableData];
      return;
    }
    const normalizedFilters = activeFilters.map(([k, v]) => [k, v.toLowerCase()] as [string, string]);
    this.filteredData = this.tableData.filter(row => {
      return normalizedFilters.every(([key, val]) => {
        const cell = row[key];
        if (cell === null || cell === undefined) {
          return false;
        }
        let cellStr: string;
        if (typeof cell === 'object') {
          try {
            cellStr = JSON.stringify(cell);
          } catch {
            cellStr = String(cell);
          }
        } else {
          cellStr = String(cell);
        }
        return cellStr.toLowerCase().includes(val);
      });
    });
  }

  toggleParentTranspose(): void {
    this.isParentTransposed = !this.isParentTransposed;
  }

  toggleChildTranspose(): void {
    this.isChildTransposed = !this.isChildTransposed;
  }
}