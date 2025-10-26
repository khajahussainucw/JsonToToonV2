import { Component, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridOptions, GridReadyEvent, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { ShareModalComponent } from '../../components/share-modal/share-modal.component';
import { HttpClientModule } from '@angular/common/http';
import { JsonStorageService } from '../../services/json-storage.service';

// Register Grid Community modules
ModuleRegistry.registerModules([AllCommunityModule]);

declare const ace: any;

@Component({
  selector: 'app-json-grid',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    ShareModalComponent, 
    HttpClientModule, 
    AgGridAngular
  ],
  templateUrl: './json-grid.component.html',
  styleUrl: './json-grid.component.css'
})
export class JsonGridComponent implements AfterViewInit {
  @ViewChild('editor') private editor!: ElementRef<HTMLElement>;
  @ViewChild('splitter') private splitter!: ElementRef<HTMLElement>;
  @ViewChild('agGrid') agGrid!: AgGridAngular;
  
  private aceEditor: any;
  private editorBackupContent: string = '';
  private isDragging = false;
  private leftPane: HTMLElement | null = null;
  private rightPane: HTMLElement | null = null;
  private initialX = 0;
  private initialLeftWidth = 0;
  private containerWidth = 0;
  private isMobile = false;
  private debounceTimer: any;
  
  // Grid properties
  public columnDefs: ColDef[] = [];
  public rowData: any[] = [];
  public gridOptions: GridOptions;
  public defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    editable: true,
    flex: 1,
    minWidth: 100
  };
  
  errorMessage: string = '';
  public hasValidJson: boolean = false;
  public isLoading: boolean = false;
  private isLoadingSharedJson = false;
  public isSingleObject: boolean = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private meta: Meta,
    private title: Title,
    private route: ActivatedRoute,
    private jsonStorageService: JsonStorageService
  ) {
    console.log('JsonGridComponent constructor called');
    this.setupMetaTags();
    
    // Initialize Grid options
    this.gridOptions = {
      theme: 'legacy', // Use legacy theme to match grid.css and grid-theme-alpine.css
      pagination: true,
      paginationPageSize: 20,
      paginationPageSizeSelector: [10, 20, 50, 100],
      enableCellTextSelection: true,
      ensureDomOrder: true,
      animateRows: true,
      onGridReady: this.onGridReady.bind(this),
      suppressMenuHide: true,
      suppressRowClickSelection: false
    };
    
    if (isPlatformBrowser(this.platformId)) {
      this.handleUrlParameters();
    }
  }

  private setupMetaTags() {
    this.title.setTitle('JSON Grid - Advanced JSON to Table Converter with Grid Features');
    this.meta.updateTag({
      name: 'description',
      content: 'Advanced JSON to Table converter with powerful grid features. Supports complex JSON with sorting, filtering, pagination, and Excel export capabilities.'
    });
    this.meta.updateTag({
      name: 'keywords',
      content: 'json grid,json to table,json to html table,json converter,json parser,advanced table,sortable table,filterable table,data grid'
    });
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });
  }

  private handleUrlParameters(): void {
    this.route.queryParams.subscribe(params => {
      const guid = params['guid'];
      if (guid && !this.isLoadingSharedJson) {
        this.isLoadingSharedJson = true;
        this.isLoading = true;
        this.jsonStorageService.getJsonByGuid(guid).subscribe({
          next: (jsonData) => {
            const checkEditor = setInterval(() => {
              if (this.aceEditor) {
                this.aceEditor.setValue(jsonData, -1);
                this.convertToTable();
                clearInterval(checkEditor);
              }
            }, 100);
          },
          error: (error) => {
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
        try {
          this.initializeEditor('');
          this.checkMobileView();
          this.initSplitter();
          
          window.addEventListener('resize', () => {
            this.checkMobileView();
            if (this.aceEditor) {
              this.aceEditor.resize();
            }
          });
          
          if (!this.isLoadingSharedJson) {
            this.isLoading = false;
          }
          
          console.log('JsonGridComponent initialized successfully');
        } catch (error) {
          console.error('Error initializing JsonGridComponent:', error);
          this.isLoading = false;
        }
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

    this.aceEditor.session.setUseWrapMode(true);
    this.aceEditor.session.setOption('wrap', 'free');

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
    const sampleData = [
      {
        "customer_id": "CUST001",
        "customer_name": "John Smith",
        "plan_type": "Unlimited Premium",
        "monthly_charge": 89.99,
        "data_usage_gb": 45.2,
        "call_minutes": 850,
        "sms_count": 320,
        "activation_date": "2023-01-15",
        "status": "Active",
        "payment_method": "Credit Card"
      },
      {
        "customer_id": "CUST002",
        "customer_name": "Sarah Johnson",
        "plan_type": "Family Share",
        "monthly_charge": 129.99,
        "data_usage_gb": 78.5,
        "call_minutes": 1250,
        "sms_count": 580,
        "activation_date": "2022-11-20",
        "status": "Active",
        "payment_method": "Bank Transfer"
      },
      {
        "customer_id": "CUST003",
        "customer_name": "Michael Chen",
        "plan_type": "Basic 5G",
        "monthly_charge": 49.99,
        "data_usage_gb": 15.8,
        "call_minutes": 420,
        "sms_count": 150,
        "activation_date": "2024-02-10",
        "status": "Active",
        "payment_method": "Credit Card"
      },
      {
        "customer_id": "CUST004",
        "customer_name": "Emily Davis",
        "plan_type": "Unlimited Premium",
        "monthly_charge": 89.99,
        "data_usage_gb": 62.3,
        "call_minutes": 980,
        "sms_count": 410,
        "activation_date": "2023-06-05",
        "status": "Active",
        "payment_method": "Debit Card"
      },
      {
        "customer_id": "CUST005",
        "customer_name": "Robert Martinez",
        "plan_type": "Business Pro",
        "monthly_charge": 159.99,
        "data_usage_gb": 120.7,
        "call_minutes": 2340,
        "sms_count": 890,
        "activation_date": "2022-09-15",
        "status": "Active",
        "payment_method": "Corporate Account"
      },
      {
        "customer_id": "CUST006",
        "customer_name": "Lisa Anderson",
        "plan_type": "Student Special",
        "monthly_charge": 35.99,
        "data_usage_gb": 22.1,
        "call_minutes": 560,
        "sms_count": 280,
        "activation_date": "2023-09-01",
        "status": "Active",
        "payment_method": "Credit Card"
      },
      {
        "customer_id": "CUST007",
        "customer_name": "David Wilson",
        "plan_type": "Pay As You Go",
        "monthly_charge": 25.00,
        "data_usage_gb": 8.5,
        "call_minutes": 180,
        "sms_count": 95,
        "activation_date": "2024-01-20",
        "status": "Active",
        "payment_method": "Prepaid"
      },
      {
        "customer_id": "CUST008",
        "customer_name": "Jennifer Lee",
        "plan_type": "Family Share",
        "monthly_charge": 129.99,
        "data_usage_gb": 95.3,
        "call_minutes": 1580,
        "sms_count": 720,
        "activation_date": "2023-03-12",
        "status": "Suspended",
        "payment_method": "Bank Transfer"
      },
      {
        "customer_id": "CUST009",
        "customer_name": "James Brown",
        "plan_type": "Unlimited Premium",
        "monthly_charge": 89.99,
        "data_usage_gb": 38.9,
        "call_minutes": 740,
        "sms_count": 290,
        "activation_date": "2023-07-22",
        "status": "Active",
        "payment_method": "Credit Card"
      },
      {
        "customer_id": "CUST010",
        "customer_name": "Patricia Taylor",
        "plan_type": "Senior Saver",
        "monthly_charge": 39.99,
        "data_usage_gb": 12.4,
        "call_minutes": 620,
        "sms_count": 180,
        "activation_date": "2022-12-08",
        "status": "Active",
        "payment_method": "Debit Card"
      }
    ];
    
    this.aceEditor.setValue(JSON.stringify(sampleData, null, 2));
    this.convertToTable();
  }

  convertToTable() {
    try {
      const jsonContent = this.aceEditor.getValue().trim();
      if (!jsonContent) {
        this.rowData = [];
        this.columnDefs = [];
        this.errorMessage = '';
        this.hasValidJson = false;
        return;
      }

      let parsed: any;
      try {
        const firstParse = JSON.parse(jsonContent);
        parsed = typeof firstParse === 'string' ? JSON.parse(firstParse) : firstParse;
      } catch (err: any) {
        this.hasValidJson = false;
        this.errorMessage = err.message || 'Invalid JSON format';
        this.rowData = [];
        this.columnDefs = [];
        return;
      }

      this.hasValidJson = true;
      this.isSingleObject = !Array.isArray(parsed);
      
      // Convert to array if single object
      const data = Array.isArray(parsed) ? parsed : [parsed];

      if (data.length === 0) {
        this.hasValidJson = false;
        this.errorMessage = 'JSON array is empty';
        this.rowData = [];
        this.columnDefs = [];
        return;
      }

      // Flatten nested objects for Grid
      const flattenedData = data.map((item: any) => this.flattenObject(item));
      
      // Generate column definitions from all keys
      const allKeys = new Set<string>();
      flattenedData.forEach((item: any) => {
        Object.keys(item).forEach(key => allKeys.add(key));
      });

      this.columnDefs = Array.from(allKeys).map(key => ({
        field: key,
        headerName: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
        sortable: true,
        filter: true,
        resizable: true,
        editable: true,
        cellRenderer: (params: any) => {
          if (params.value === null || params.value === undefined) {
            return '';
          }
          if (typeof params.value === 'object') {
            return JSON.stringify(params.value);
          }
          return params.value;
        }
      }));

      this.rowData = flattenedData;
      this.errorMessage = '';
      
      // Auto-size columns after data is set
      setTimeout(() => {
        if (this.agGrid?.api) {
          try {
            this.agGrid.api.sizeColumnsToFit();
          } catch (error) {
            console.warn('Could not auto-size columns:', error);
          }
        }
      }, 200);
    } catch (error: any) {
      this.hasValidJson = false;
      this.errorMessage = error.message || 'Failed to process JSON';
      this.rowData = [];
      this.columnDefs = [];
    }
  }

  private flattenObject(obj: any, prefix: string = ''): any {
    if (obj === null || obj === undefined) {
      return {};
    }

    if (typeof obj !== 'object' || obj instanceof Date) {
      return prefix ? { [prefix]: obj } : obj;
    }

    if (Array.isArray(obj)) {
      // For arrays, convert to JSON string representation
      return prefix ? { [prefix]: JSON.stringify(obj) } : { value: JSON.stringify(obj) };
    }

    const flattened: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];

        if (value === null || value === undefined) {
          flattened[newKey] = '';
        } else if (typeof value === 'object' && !Array.isArray(value)) {
          // Recursively flatten nested objects
          Object.assign(flattened, this.flattenObject(value, newKey));
        } else if (Array.isArray(value)) {
          // Convert arrays to JSON strings
          flattened[newKey] = JSON.stringify(value);
        } else {
          flattened[newKey] = value;
        }
      }
    }
    return flattened;
  }

  onGridReady(params: GridReadyEvent) {
    console.log('Grid is ready!', params);
    try {
      if (params?.api) {
        params.api.sizeColumnsToFit();
      }
    } catch (error) {
      console.error('Error in onGridReady:', error);
    }
  }

  downloadAsExcel(): void {
    // Using xlsx library for Excel export (Community version compatible)
    if (!this.rowData || this.rowData.length === 0) {
      console.warn('No data to export');
      return;
    }
    
    try {
      import('xlsx').then((XLSX) => {
        const worksheet = XLSX.utils.json_to_sheet(this.rowData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
        XLSX.writeFile(workbook, 'JsonConvertedToExcel.xlsx');
      }).catch(error => {
        console.error('Error loading xlsx library:', error);
        alert('Excel export is not available. Please use CSV export instead.');
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export to Excel. Please try CSV export instead.');
    }
  }

  downloadAsCSV(): void {
    if (this.agGrid && this.agGrid.api) {
      this.agGrid.api.exportDataAsCsv({
        fileName: 'JsonConvertedToCSV.csv'
      });
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
      this.leftPane.style.height = 'calc(40vh - 12px)';
      this.rightPane.style.height = 'calc(60vh - 12px)';
    } else {
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
    
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('mouseup', this.onMouseUp.bind(this));
    document.addEventListener('selectstart', this.preventSelection);
  }
  
  private onMouseMove(e: MouseEvent) {
    if (!this.isDragging || !this.leftPane || !this.rightPane || this.isMobile) return;
    
    const deltaX = e.clientX - this.initialX;
    const minLeftWidth = 100;
    const maxLeftWidth = this.containerWidth - minLeftWidth;
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
  
  private onMouseUp() {
    if (this.isDragging) {
      this.isDragging = false;
      document.documentElement.classList.remove('resize-cursor');
      this.splitter.nativeElement.classList.remove('dragging');
      document.removeEventListener('mousemove', this.onMouseMove.bind(this));
      document.removeEventListener('mouseup', this.onMouseUp.bind(this));
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

  autoSizeAll() {
    if (this.agGrid && this.agGrid.api) {
      const allColumnIds = this.columnDefs.map(col => col.field!);
      this.agGrid.api.autoSizeColumns(allColumnIds);
    }
  }
}

