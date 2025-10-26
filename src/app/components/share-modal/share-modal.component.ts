import { Component, Input, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JsonStorageService } from '../../services/json-storage.service';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-share-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal fade" id="shareModal" tabindex="-1" aria-labelledby="shareModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-dark text-white">
            <h5 class="modal-title d-flex align-items-center" id="shareModalLabel">
              <i class="fas fa-file-alt "></i>
              Permission/Consent to Save JSON Data
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body p-4">
            <ng-container *ngIf="!sharedUrl; else urlBlock">
              <div class="mb-2">
                <b>Please give permission to save the data for the following period:</b>
              </div>
              <div class="mb-4">
                <select class="form-select" [(ngModel)]="retentionDays">
                  <option value="1">1 Month</option>
                  <option value="3">3 Months</option>
                  <option value="6">6 Months</option>
                  <option value="12">1 Year</option>
                  <option value="24">2 Year</option>
                </select>
              </div>
            </ng-container>
            <ng-template #urlBlock>
              <div class="mb-3 fw-bold">Shareable URL:</div>
              <div class="input-group">
                <input type="text" class="form-control" [value]="sharedUrl" readonly #urlInput>
                <button class="btn btn-success" type="button" (click)="copyUrl(urlInput)">
                  <i class="fas fa-copy"></i> Copy URL
                </button>
              </div>
            </ng-template>
          </div>
          <div class="modal-footer justify-content-end bg-light">
            <ng-container *ngIf="!sharedUrl">
              <button type="button" class="btn btn-sm btn-danger" data-bs-dismiss="modal">
                <i class="fas fa-times"></i> Cancel
              </button>
              <button type="button" class="btn btn-sm btn-success" (click)="saveJson()" [disabled]="isSaving">
                <i class="fas" [ngClass]="{'fa-save': !isSaving, 'fa-spinner fa-spin': isSaving}"></i>
                {{ isSaving ? 'Saving...' : 'Save' }}
              </button>
            </ng-container>
            <ng-container *ngIf="sharedUrl">
              <button type="button" class="btn btn-dark" data-bs-dismiss="modal">
                <i class="fas fa-times "></i> Close
              </button>
            </ng-container>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Container -->
    <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 1100">
      <div
        class="toast align-items-center text-bg-success border-0"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        [class.show]="showToast"
        [class.hide]="!showToast"
        style="min-width: 300px;"
      >
        <div class="d-flex">
          <div class="toast-body">
            <i class="fas fa-check-circle "></i>
            {{ toastMessage }}
          </div>
          <button
            type="button"
            class="btn-close btn-close-white  m-auto"
            (click)="showToast = false"
            aria-label="Close"
          ></button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-body {
      padding: 1.5rem;
    }
    .form-select {
      font-size: 1rem;
      padding: 0.75rem;
    }
    .modal-footer {
      padding: 1rem 1.5rem;
      background-color: #f8f9fa;
    }
    .modal-dialog {
      max-width: 600px;
      width: 90%;
    }
    .toast-container {
      z-index: 1100;
    }
    .toast {
      opacity: 1;
      transition: opacity 0.5s;
    }
    .toast.hide {
      opacity: 0;
      pointer-events: none;
    }
  `]
})
export class ShareModalComponent implements AfterViewInit {
  @Input() jsonData: string = '';
  retentionDays: number = 1; // Default to 1 month
  isSaving: boolean = false;
  sharedUrl: string = '';
  showToast: boolean = false;
  toastMessage: string = '';

  constructor(
    private jsonStorageService: JsonStorageService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      const modalElement = document.getElementById('shareModal');
      if (modalElement) {
        modalElement.addEventListener('hidden.bs.modal', () => {
          this.resetModal();
        });
      }
    }
  }

  resetModal() {
    this.sharedUrl = '';
    this.retentionDays = 1;
    this.isSaving = false;
    // Optionally reset toast/message if needed
    // this.showToast = false;
    // this.toastMessage = '';
  }

  saveJson() {
    if (!this.jsonData.trim()) {
      alert('Please enter JSON data first.');
      return;
    }

    try {
      JSON.parse(this.jsonData); // Validate JSON
    } catch (e) {
      alert('Invalid JSON. Please correct it before sharing.');
      return;
    }

    this.isSaving = true;
    // Convert months to days
    const daysToStore = this.retentionDays * 30;
    
    this.jsonStorageService.saveJson(this.jsonData, daysToStore)
      .subscribe({
        next: (response) => {
          if (response?.guid) {
            if (isPlatformBrowser(this.platformId)) {
              // Build the URL with the guid as a query parameter
              let url = window.location.origin + window.location.pathname;
              let separator = url.includes('?') ? '&' : '?';
              this.sharedUrl = `${url}${separator}guid=${response.guid}`;
              // Update the browser's address bar
              window.history.replaceState({}, '', this.sharedUrl);
            } else {
              this.sharedUrl = `?guid=${response.guid}`;
            }
            this.toastMessage = 'JSON data has been saved successfully!';
            this.showToast = true;
            setTimeout(() => this.showToast = false, 3000);
          } else {
            console.error('No GUID received from server');
            alert('Failed to save JSON. No GUID received from server.');
          }
        },
        error: (error) => {
          console.error('Error saving JSON:', error);
          const errorMessage = error?.message || 'Failed to save JSON. Please try again.';
          alert(errorMessage);
        },
        complete: () => {
          this.isSaving = false;
        }
      });
  }

  async copyUrl(input: HTMLInputElement) {
    if (isPlatformBrowser(this.platformId)) {
      try {
        // Modern clipboard API
        await navigator.clipboard.writeText(this.sharedUrl);
        this.toastMessage = 'URL copied to clipboard!';
        this.showToast = true;
        setTimeout(() => this.showToast = false, 2000);
      } catch (err) {
        console.error('Failed to copy using modern API, trying fallback:', err);
        // Fallback for older browsers
        try {
          input.select();
          document.execCommand('copy');
          this.toastMessage = 'URL copied to clipboard!';
          this.showToast = true;
          setTimeout(() => this.showToast = false, 2000);
        } catch (fallbackErr) {
          console.error('Failed to copy URL:', fallbackErr);
          alert('Failed to copy URL. Please copy manually.');
        }
      }
    }
  }
} 
