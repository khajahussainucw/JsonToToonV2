import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

declare const ace: any;

@Component({
  selector: 'app-xml-parser',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './xml-parser.component.html',
  styleUrl: './xml-parser.component.css'
})
export class XmlParserComponent implements AfterViewInit {
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
  public hasValidXml: boolean = false;
  public isLoading: boolean = false;
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
    private route: ActivatedRoute
  ) {
    this.setupMetaTags();
    if (isPlatformBrowser(this.platformId)) {
      this.handleUrlParameters();
    }
  }

  private setupMetaTags() {
    // Set page title
    this.title.setTitle('XML Parser - Parse, View and Read XML Online');

    // Set meta description
    this.meta.updateTag({
      name: 'description',
      content: 'Online XML parser to parse, view, read and validate XML data. Supports complex XML structures with a clean interface for real-time parsing and visualization.'
    });

    // Set meta keywords
    this.meta.updateTag({
      name: 'keywords',
      content: 'xml parser,xml viewer,xml reader,xml parser online,parse xml,xml viewer online,xml reader online,view xml,read xml,xml validator,xml visualizer,xml object viewer,xml data parser,parse xml online,xml file viewer,xml file reader,xml string parser,xml pretty viewer,xml format viewer'
    });

    // Add additional meta tags for better SEO
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });
    this.meta.updateTag({ name: 'author', content: 'XML Parser' });
    this.meta.updateTag({ property: 'og:title', content: 'XML Parser - Parse, View and Read XML Online' });
    this.meta.updateTag({ property: 'og:description', content: 'Online XML parser to parse, view, read and validate XML data. Supports complex XML structures with a clean interface for real-time parsing and visualization.' });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
  }

  private handleUrlParameters(): void {
    // XML sharing functionality can be added later if needed
    // For now, we'll skip URL parameter handling to avoid impacting existing JSON functionality
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
        
        if (!this.isLoading) {
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
    this.aceEditor.session.setMode('ace/mode/xml');
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
      // Clear removed columns when re-parsing XML (new dataset)
      this.removedColumns.clear();
      this.convertToTable();
    }, 300);
  }

  loadSampleData() {
    const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<store>
  <name>TechHub Electronics</name>
  <description>Premium electronics retailer</description>
  <products>
    <product>
      <id>1</id>
      <name>UltraBook Pro 15</name>
      <price>1299.99</price>
      <category>Computers</category>
    </product>
    <product>
      <id>2</id>
      <name>Wireless Earbuds Max</name>
      <price>199.99</price>
      <category>Audio</category>
    </product>
  </products>
  <rating>4.7</rating>
  <locations>
    <location>New York</location>
    <location>Los Angeles</location>
    <location>Chicago</location>
  </locations>
</store>`;
    
    this.aceEditor.setValue(sampleXml, -1);
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
    link.download = 'XmlConvertedToExcel.xls';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private xmlToJson(xml: any): any {
    // Handle null or undefined
    if (!xml) {
      return null;
    }

    let obj: any = {};

    // Element node
    if (xml.nodeType === 1) {
      // Attributes
      if (xml.attributes && xml.attributes.length > 0) {
        obj['@attributes'] = {};
        for (let j = 0; j < xml.attributes.length; j++) {
          const attribute = xml.attributes.item(j);
          if (attribute) {
            obj['@attributes'][attribute.nodeName] = attribute.nodeValue || '';
          }
        }
      }
    } 
    // Text node
    else if (xml.nodeType === 3) {
      const text = xml.nodeValue?.trim();
      return text || null;
    }
    // CDATA node
    else if (xml.nodeType === 4) {
      return xml.nodeValue || '';
    }
    // Comment node - skip comments
    else if (xml.nodeType === 8) {
      return null;
    }
    // Processing instruction - skip
    else if (xml.nodeType === 7) {
      return null;
    }

    // Process children
    if (xml.hasChildNodes && xml.hasChildNodes()) {
      let textContent = '';
      let hasElementChildren = false;
      const childNodes = xml.childNodes;

      for (let i = 0; i < childNodes.length; i++) {
        const item = childNodes.item(i);
        if (!item) continue;

        const nodeType = item.nodeType;
        const nodeName = item.nodeName;

        // Text node
        if (nodeType === 3) {
          textContent += item.nodeValue || '';
        }
        // CDATA node
        else if (nodeType === 4) {
          textContent += item.nodeValue || '';
        }
        // Element node
        else if (nodeType === 1) {
          hasElementChildren = true;
          
          const childJson = this.xmlToJson(item);
          // Skip null values (comments, processing instructions)
          if (childJson === null) {
            continue;
          }
          
          if (typeof obj[nodeName] === 'undefined') {
            obj[nodeName] = childJson;
          } else {
            // Convert to array if multiple children with same name
            if (!Array.isArray(obj[nodeName])) {
              const old = obj[nodeName];
              obj[nodeName] = [old];
            }
            obj[nodeName].push(childJson);
          }
        }
        // Skip comments (nodeType === 8) and processing instructions (nodeType === 7)
      }

      // Handle text content
      const trimmedText = textContent.trim();
      if (!hasElementChildren && trimmedText) {
        // If no attributes and only text, return text directly
        if (Object.keys(obj).length === 0 || (Object.keys(obj).length === 1 && obj['@attributes'])) {
          if (obj['@attributes']) {
            obj['#text'] = trimmedText;
          } else {
            return trimmedText;
          }
        } else {
          obj['#text'] = trimmedText;
        }
      } else if (!hasElementChildren && !trimmedText) {
        // Empty element with no children
        if (Object.keys(obj).length === 0) {
          return null;
        } else if (Object.keys(obj).length === 1 && obj['@attributes']) {
          // Element with only attributes, no text
          return obj;
        }
      }
    }

    // Return empty object if nothing was processed
    return Object.keys(obj).length > 0 ? obj : null;
  }

  convertToTable() {
    try {
      // Clear previous state
      this.errorMessage = '';
      this.hasValidXml = false;

      // Get XML content
      if (!this.aceEditor) {
        this.tableData = [];
        this.filteredData = [];
        this.columns = [];
        return;
      }

      const xmlContent = this.aceEditor.getValue().trim();
      if (!xmlContent) {
        this.tableData = [];
        this.filteredData = [];
        this.columns = [];
        this.hasValidXml = false;
        return;
      }

      // Basic size check to prevent browser crashes (warn if > 5MB)
      if (xmlContent.length > 5 * 1024 * 1024) {
        this.hasValidXml = false;
        this.errorMessage = 'XML file is too large (>5MB). Please use a smaller file or split it into smaller parts.';
        this.tableData = [];
        this.filteredData = [];
        this.columns = [];
        return;
      }

      // Parse XML
      let parsed: any;
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
        
        // Check for parsing errors - more robust error detection
        const parserError = xmlDoc.getElementsByTagName('parsererror');
        if (parserError.length > 0) {
          const errorElement = parserError[0];
          let errorMessage = 'Invalid XML syntax';
          
          // Try to extract detailed error message
          if (errorElement.textContent) {
            const errorText = errorElement.textContent.trim();
            // Extract line number if available
            const lineMatch = errorText.match(/line\s+(\d+)/i);
            if (lineMatch) {
              errorMessage = `Invalid XML syntax at line ${lineMatch[1]}`;
            } else if (errorText.length > 0 && errorText.length < 200) {
              errorMessage = errorText;
            }
          }
          
          throw new Error(errorMessage);
        }

        // Check if document has a root element
        if (!xmlDoc.documentElement) {
          throw new Error('XML must have a root element');
        }

        // Convert XML to JSON
        parsed = this.xmlToJson(xmlDoc.documentElement);
        
        // Handle null or empty result
        if (parsed === null || parsed === undefined) {
          throw new Error('XML structure could not be converted to table format');
        }

        // Handle root element - if it has a single child that's an array, use that
        if (typeof parsed === 'object' && !Array.isArray(parsed)) {
          const rootKeys = Object.keys(parsed).filter(key => key !== '@attributes' && key !== '#text');
          
          if (rootKeys.length === 1 && Array.isArray(parsed[rootKeys[0]])) {
            parsed = parsed[rootKeys[0]];
          } else if (rootKeys.length > 0) {
            // Check if any child is an array
            for (const key of rootKeys) {
              if (Array.isArray(parsed[key])) {
                parsed = parsed[key];
                break;
              }
            }
          }
        }
      } catch (err: any) {
        this.hasValidXml = false;
        // Provide more helpful error messages
        let errorMsg = err.message || 'Invalid XML format';
        if (err.message && err.message.includes('parsererror')) {
          errorMsg = 'Invalid XML syntax. Please check for unclosed tags, mismatched quotes, or special characters.';
        }
        this.errorMessage = errorMsg;
        this.tableData = [];
        this.filteredData = [];
        this.columns = [];
        return;
      }

      // Validate parsed result
      if (parsed === null || parsed === undefined) {
        this.hasValidXml = false;
        this.errorMessage = 'XML structure could not be converted to table format. Please ensure your XML contains elements that can be represented as objects.';
        this.tableData = [];
        this.filteredData = [];
        this.columns = [];
        return;
      }

      this.hasValidXml = true;
      this.isSingleObject = !Array.isArray(parsed);
      const data = Array.isArray(parsed) ? parsed : [parsed];

      // Validate that we have objects
      if (data.length === 0) {
        this.hasValidXml = false;
        this.errorMessage = 'XML does not contain any data that can be displayed as a table';
        this.tableData = [];
        this.filteredData = [];
        this.columns = [];
        return;
      }

      // Filter out null/undefined items and validate
      const validData = data.filter((item: unknown) => {
        return item !== null && item !== undefined && typeof item === 'object';
      });

      if (validData.length === 0) {
        this.hasValidXml = false;
        this.errorMessage = 'XML must contain objects or elements that can be converted to table rows';
        this.tableData = [];
        this.filteredData = [];
        this.columns = [];
        return;
      }

      // Process each object in the array
      const processedData = validData.map((item: Record<string, any>, index: number) => {
        try {
          return this.flattenObject(item);
        } catch (err) {
          console.warn(`Error processing object at index ${index}:`, err);
          // Return a safe fallback object
          return { _error: `Error processing row ${index + 1}` };
        }
      });

      // Get all unique top-level keys
      const allColumns = new Set<string>();
      processedData.forEach((item: Record<string, any>) => {
        if (item && typeof item === 'object') {
          Object.keys(item).forEach(key => {
            // Skip error keys
            if (key !== '_error') {
              allColumns.add(key);
            }
          });
        }
      });

      if (allColumns.size === 0) {
        this.hasValidXml = false;
        this.errorMessage = 'No valid columns found in XML data';
        this.tableData = [];
        this.filteredData = [];
        this.columns = [];
        return;
      }

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
      // Catch-all error handler
      this.hasValidXml = false;
      this.errorMessage = error.message || 'An unexpected error occurred while processing XML';
      this.tableData = [];
      this.filteredData = [];
      this.columns = [];
      console.error('XML Parser Error:', error);
    }
  }

  private checkMobileView() {
    this.isMobile = window.innerWidth <= 768;
  }

  private initSplitter() {
    this.leftPane = document.querySelector('.xml-input-container');
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
    // XML sharing functionality not yet implemented
    // This prevents impacting the existing JSON share modal component
    if (isPlatformBrowser(this.platformId)) {
      import('bootstrap').then(({ Modal }) => {
        let modalElement = document.getElementById('xmlShareNotAvailableModal');
        if (!modalElement) {
          modalElement = document.createElement('div');
          modalElement.id = 'xmlShareNotAvailableModal';
          modalElement.className = 'modal fade';
          modalElement.tabIndex = -1;
          modalElement.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
              <div class="modal-content">
                <div class="modal-header bg-dark text-white">
                  <h5 class="modal-title"><i class='fas fa-info-circle me-2'></i>Sharing Not Available</h5>
                  <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                  <p>XML sharing functionality is not yet available. This feature will be added in a future update.</p>
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
        const infoModal = new Modal(modalElement, { keyboard: true });
        infoModal.show();
      });
    }
  }

  showInvalidXmlModal(): void {
    if (isPlatformBrowser(this.platformId)) {
      import('bootstrap').then(({ Modal }) => {
        let modalElement = document.getElementById('invalidXmlModal');
        if (!modalElement) {
          // Create the modal if it doesn't exist
          modalElement = document.createElement('div');
          modalElement.id = 'invalidXmlModal';
          modalElement.className = 'modal fade';
          modalElement.tabIndex = -1;
          modalElement.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
              <div class="modal-content">
                <div class="modal-header bg-black text-white">
                  <h5 class="modal-title"><i class='fas fa-exclamation-triangle me-2'></i>Invalid XML</h5>
                  <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                  <p>Please enter a valid XML in the editor before sharing.</p>
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
    // Note: For XML editing, we don't update the XML editor directly as it's complex
    // Users can edit the table and then manually update XML if needed
    this.editingRow = null;
    this.editingCol = null;
    this.applyFilters();
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

