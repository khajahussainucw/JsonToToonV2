import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';

declare const ace: any;

@Component({
  selector: 'app-json-formatter',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './json-formatter.component.html',
  styleUrl: './json-formatter.component.css'
})
export class JsonFormatterComponent implements AfterViewInit {
  @ViewChild('inputEditor') private inputEditor!: ElementRef<HTMLElement>;
  @ViewChild('outputEditor') private outputEditor!: ElementRef<HTMLElement>;
  @ViewChild('splitter') private splitter!: ElementRef<HTMLElement>;
  
  private aceInputEditor: any;
  private aceOutputEditor: any;
  private isDragging = false;
  private leftPane: HTMLElement | null = null;
  private rightPane: HTMLElement | null = null;
  private initialX = 0;
  private initialLeftWidth = 0;
  private containerWidth = 0;
  private isMobile = false;
  private debounceTimer: any;
  
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private meta: Meta,
    private title: Title
  ) {
    this.setupMetaTags();
  }

  private setupMetaTags() {
    this.title.setTitle('JSON Formatter - Format and Beautify JSON Online');
    this.meta.updateTag({
      name: 'description',
      content: 'Format and beautify JSON data with real-time preview. Supports complex JSON structures with syntax highlighting.'
    });
    this.meta.updateTag({
      name: 'keywords',
      content: 'json formatter,json beautifier,format json,json validator,json pretty print,json editor,json viewer'
    });
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.initializeEditors();
        this.checkMobileView();
        this.initSplitter();
        
        window.addEventListener('resize', () => {
          this.checkMobileView();
          if (this.aceInputEditor) {
            this.aceInputEditor.resize();
          }
          if (this.aceOutputEditor) {
            this.aceOutputEditor.resize();
          }
        });
      }, 100);
    }
  }

  private initializeEditors() {
    if (typeof ace === 'undefined') {
      console.error('Ace editor is not loaded');
      return;
    }

    // Initialize input editor
    this.aceInputEditor = ace.edit(this.inputEditor.nativeElement);
    this.aceInputEditor.setTheme('ace/theme/github');
    this.aceInputEditor.session.setMode('ace/mode/json');
    this.aceInputEditor.setOptions({
      useWrapMode: true,
    });
    // Enable wrap explicitly
    this.aceInputEditor.getSession().setUseWrapMode(true);

    // Initialize output editor
    this.aceOutputEditor = ace.edit(this.outputEditor.nativeElement);
    this.aceOutputEditor.setTheme('ace/theme/github');
    this.aceOutputEditor.session.setMode('ace/mode/json');
    this.aceOutputEditor.setOptions({
      useWrapMode: true
    });
    // Enable wrap explicitly
    this.aceOutputEditor.getSession().setUseWrapMode(true);

    // Add change listener to input editor
    this.aceInputEditor.session.on('change', () => {
      this.debouncedFormatJson();
    });

    // Force resize after initialization
    setTimeout(() => {
      this.aceInputEditor.resize(true);
      this.aceOutputEditor.resize(true);
    }, 100);
  }

  private debouncedFormatJson() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.formatJson();
    }, 300);
  }

  private formatJson() {
    try {
      const inputJson = this.aceInputEditor.getValue().trim();
      if (!inputJson) {
        this.aceOutputEditor.setValue('');
        return;
      }

      let parsedJson: any = JSON.parse(inputJson);
      // If the JSON text is a quoted string, parse it again to get the real object
      if (typeof parsedJson === 'string') {
        try {
          parsedJson = JSON.parse(parsedJson);
        } catch (error: any) {
          this.aceOutputEditor.setValue('Invalid JSON string: ' + error.message);
          return;
        }
      }
      const formattedJson = JSON.stringify(parsedJson, null, 2);
      this.aceOutputEditor.setValue(formattedJson, -1);
      this.aceOutputEditor.clearSelection();
    } catch (error: any) {
      this.aceOutputEditor.setValue('Invalid JSON: ' + error.message);
    }
  }

  loadSampleJson() {
    const sampleJson = {
      "name": "JSON Formatter Example",
      "version": "1.0.0",
      "description": "A sample JSON object with various data types",
      "active": true,
      "created_at": "2024-03-15T10:30:00Z",
      "stats": {
        "views": 1000,
        "likes": 150,
        "shares": 75
      },
      "tags": [
        "json",
        "formatter",
        "example"
      ],
      "author": {
        "id": 123,
        "name": "John Doe",
        "email": "john@example.com",
        "roles": ["admin", "editor"]
      },
      "settings": {
        "theme": "dark",
        "notifications": true,
        "language": "en-US"
      }
    };
    
    this.aceInputEditor.setValue(JSON.stringify(sampleJson, null, 2), -1);
    this.aceInputEditor.clearSelection();
    this.formatJson();
  }

  private checkMobileView() {
    this.isMobile = window.innerWidth <= 768;
    this.adjustLayoutForMobile();
  }

  private adjustLayoutForMobile() {
    if (!this.leftPane || !this.rightPane) return;
    
    if (this.isMobile) {
      this.leftPane.style.height = 'calc(50vh - 12px)';
      this.rightPane.style.height = 'calc(50vh - 12px)';
      this.leftPane.style.width = '100%';
      this.rightPane.style.width = '100%';
    } else {
      this.leftPane.style.height = '100%';
      this.rightPane.style.height = '100%';
      this.leftPane.style.flex = '0.5';
      this.rightPane.style.flex = '0.5';
    }
  }

  private initSplitter() {
    this.leftPane = document.querySelector('.input-container');
    this.rightPane = document.querySelector('.output-container');
    
    if (!this.leftPane || !this.rightPane || !this.splitter) {
      return;
    }

    if (!this.isMobile) {
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
    const minWidth = 200;
    const maxWidth = this.containerWidth - minWidth;
    const newLeftWidth = Math.max(
      minWidth,
      Math.min(maxWidth, this.initialLeftWidth + deltaX)
    );
    
    const leftRatio = newLeftWidth / this.containerWidth;
    const rightRatio = 1 - leftRatio;
    
    this.leftPane.style.flex = `${leftRatio}`;
    this.rightPane.style.flex = `${rightRatio}`;
    
    if (this.aceInputEditor && this.aceOutputEditor) {
      this.aceInputEditor.resize();
      this.aceOutputEditor.resize();
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
      
      if (this.aceInputEditor && this.aceOutputEditor) {
        this.aceInputEditor.resize();
        this.aceOutputEditor.resize();
      }
    }
  }

  private preventSelection(e: Event) {
    e.preventDefault();
    return false;
  }
} 
