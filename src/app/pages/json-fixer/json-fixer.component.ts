import { Component, AfterViewInit, ViewChild, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { JsonFixerService } from '../../services/json-fixer.service';
import { Title, Meta } from '@angular/platform-browser';
import { HorizontalAdComponent } from '../../shared/components';
declare const ace: any;

@Component({
  selector: 'app-json-fixer',
  standalone: true,
  imports: [CommonModule, RouterModule, HorizontalAdComponent],
  templateUrl: './json-fixer.component.html',
  styleUrls: ['./json-fixer.component.css']
})
export class JsonFixerComponent implements AfterViewInit {
  @ViewChild('editorLeft') private editorLeft!: ElementRef<HTMLElement>;
  @ViewChild('editorRight') private editorRight!: ElementRef<HTMLElement>;
  @ViewChild('splitter') private splitter!: ElementRef<HTMLElement>;

  private aceEditorLeft: any;
  private aceEditorRight: any;
  private isDragging = false;
  private leftPane: HTMLElement | null = null;
  private rightPane: HTMLElement | null = null;
  private initialX = 0;
  private containerWidth = 0;
  errorMessage: string = '';

  // Loading modal state
  isLoading: boolean = false;
  loadingMessages: string[] = [
    "Analyzing JSON structure...",
    "Fixing syntax errors...",
    "Validating property names...",
    "Correcting nested objects...",
    "Checking for missing commas...",
    "Validating array structures...",
    "Fixing quote inconsistencies...",
    "Resolving escape sequences...",
    "Analyzing data types...",
    "Correcting boolean values...",
    "Fixing null representations...",
    "Validating UTF-8 characters...",
    "Organizing nested arrays...",
    "Restructuring object hierarchy...",
    "Removing trailing commas...",
    "Fixing duplicate keys...",
    "Validating number formats...",
    "Optimizing whitespace...",
    "Ensuring proper indentation...",
    "Processing complex structures...",
    "Checking bracket pairs...",
    "Validating string values...",
    "Almost done, final touches...",
    "Formatting output...",
    "Almost there...",
  ];
  currentMessageIndex: number = 0;
  progressPercent: number = 0;
  private loadingInterval: any;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object, 
    private fixerService: JsonFixerService,
    private titleService: Title,
    private metaService: Meta
  ) {
    // Set page title
    this.titleService.setTitle('JSON Fixer - Fix JSON Parse Errors, Syntax Errors, and Format JSON Files');

    // Set meta description
    this.metaService.updateTag({
      name: 'description',
      content: 'Easily fix JSON file errors, from parse errors to syntax issues, with the JSON fixer. Validate, repair, and format JSON data for accurate, error-free results—perfect for developers and data analysts working with JSON.'
    });

    // Set meta keywords
    this.metaService.updateTag({
      name: 'keywords',
      content: 'json fixer, json file fixer, fix json online, fix json error, json parse error, json syntax error, invalid json repair, vscode fix json, json format fixer, json string fixer'
    });
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.initializeEditors();
        this.initSplitter();
      }, 100);
    }
  }

  private initializeEditors(): void {
    if (typeof ace === 'undefined') {
      console.error('Ace editor is not loaded');
      return;
    }
    this.aceEditorLeft = ace.edit(this.editorLeft.nativeElement);
    this.aceEditorLeft.setTheme('ace/theme/github');
    this.aceEditorLeft.session.setMode('ace/mode/json');
    this.aceEditorLeft.setOptions({
      fontSize: '14px',
      showPrintMargin: false,
      showGutter: true,
      highlightActiveLine: true,
      enableBasicAutocompletion: true,
      enableLiveAutocompletion: true,
      useWrapMode: true,
      showLineNumbers: true,
      displayIndentGuides: true
    });
    this.aceEditorLeft.session.setUseWrapMode(true);
    this.aceEditorLeft.session.setOption('wrap', 'free');

    this.aceEditorRight = ace.edit(this.editorRight.nativeElement);
    this.aceEditorRight.setTheme('ace/theme/github');
    this.aceEditorRight.session.setMode('ace/mode/json');
    this.aceEditorRight.setOptions({
      fontSize: '14px',
      showPrintMargin: false,
      showGutter: true,
      highlightActiveLine: false,
      enableBasicAutocompletion: false,
      enableLiveAutocompletion: false,
      useWrapMode: true,
      showLineNumbers: true,
      displayIndentGuides: true
    });
    this.aceEditorRight.session.setUseWrapMode(true);
    this.aceEditorRight.session.setOption('wrap', 'free');
    this.aceEditorRight.setReadOnly(true);
  }

  private initSplitter() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.leftPane = this.splitter.nativeElement.previousElementSibling as HTMLElement;
    this.rightPane = this.splitter.nativeElement.nextElementSibling as HTMLElement;
    const parentEl = this.splitter.nativeElement.parentNode as HTMLElement;
    const totalWidth = parentEl.offsetWidth;
    console.log(`Splitter debug -> Left: ${this.leftPane.offsetWidth}px, Splitter: ${this.splitter.nativeElement.offsetWidth}px, Right: ${this.rightPane.offsetWidth}px, Total: ${totalWidth}px`);

    this.splitter.nativeElement.addEventListener('mousedown', (e: MouseEvent) => this.startDrag(e));
    document.addEventListener('mousemove', (e: MouseEvent) => this.onMouseMove(e));
    document.addEventListener('mouseup', () => this.onMouseUp());
    document.addEventListener('selectstart', (e: Event) => this.preventSelection(e));
  }

  private startDrag(e: MouseEvent) {
    this.isDragging = true;
    this.initialX = e.clientX;
    this.containerWidth = (this.splitter.nativeElement.parentNode as HTMLElement).offsetWidth;
    if (this.leftPane) {
      this.leftPane.style.userSelect = 'none';
      this.leftPane.style.pointerEvents = 'none';
    }
    if (this.rightPane) {
      this.rightPane.style.userSelect = 'none';
      this.rightPane.style.pointerEvents = 'none';
    }
    document.body.style.cursor = 'col-resize';
  }

  private onMouseMove(e: MouseEvent) {
    if (!this.isDragging) return;

    const dx = e.clientX - this.initialX;
    const newLeftWidth = ((this.leftPane?.offsetWidth || 0) + dx) / this.containerWidth * 100;
    const newRightWidth = 100 - newLeftWidth;

    if (newLeftWidth > 10 && newRightWidth > 10) {
      if (this.leftPane) this.leftPane.style.flex = `0 0 ${newLeftWidth}%`;
      if (this.rightPane) this.rightPane.style.flex = `0 0 ${newRightWidth}%`;
      this.initialX = e.clientX;
      
      // Resize editors after changing pane sizes
      if (this.aceEditorLeft) this.aceEditorLeft.resize();
      if (this.aceEditorRight) this.aceEditorRight.resize();
    }
  }

  private onMouseUp() {
    this.isDragging = false;
    if (this.leftPane) {
      this.leftPane.style.userSelect = '';
      this.leftPane.style.pointerEvents = '';
    }
    if (this.rightPane) {
      this.rightPane.style.userSelect = '';
      this.rightPane.style.pointerEvents = '';
    }
    document.body.style.cursor = '';
  }

  private preventSelection(e: Event) {
    if (this.isDragging) {
      e.preventDefault();
      return false;
    }
    return true;
  }

  loadSampleData(): void {
    const sampleJson = [
      {
        "team": "Team A",
        "members": [
          { "name": "Alice", "role": "Leader" },
          { "name": "Bob", "role": "Member" }
        ]
      },
      {
        "members": [
          { "name": "Carol", "role": "Leader" },
          { "name": "Dave", "role": "Member" }
        ]
      }
    ];
    this.aceEditorLeft.setValue(JSON.stringify(sampleJson, null, 2), -1);
    this.aceEditorRight.setValue('', -1);
  }

  fixJson(): void {
    const input = this.aceEditorLeft.getValue().trim();
    if (!input) {
      this.aceEditorRight.setValue('Please enter invalid JSON to fix', -1);
      return;
    }
    // Clear right editor before making the network call
    this.aceEditorRight.setValue('', -1);
    // Show loading modal
    this.isLoading = true;
    this.currentMessageIndex = 0;
    this.progressPercent = 0;
    // Animate loading messages and progress
    this.loadingInterval = setInterval(() => {
      this.currentMessageIndex = (this.currentMessageIndex + 1) % this.loadingMessages.length;
      this.progressPercent = Math.min(100, this.progressPercent + Math.ceil(100 / this.loadingMessages.length));
    }, 700);
    // Call backend API
    this.fixerService.fixJson(input).subscribe(
      (response) => {
        clearInterval(this.loadingInterval);
        this.progressPercent = 100;
        this.isLoading = false;
        this.aceEditorRight.setValue(JSON.stringify(response, null, 2), -1);
      },
      (error) => {
        clearInterval(this.loadingInterval);
        this.progressPercent = 100;
        this.isLoading = false;
        this.aceEditorRight.setValue('Sorry, unable to fix this JSON.... 😔', -1);
      }
    );
  }

  clearEditors(): void {
    // TODO: Clear both left and right editors
  }
}
