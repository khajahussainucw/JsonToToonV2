import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JsonStorageService } from '../../services/json-storage.service';

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
              <i class="fas fa-file-alt me-2"></i>
              Permission/Consent to Save JSON Data
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body p-4">
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

            <div *ngIf="sharedUrl" class="mt-4">
              <div class="alert alert-success">
                <i class="fas fa-check-circle me-2"></i>
                JSON data has been saved successfully!
              </div>
              <div class="input-group">
                <input type="text" class="form-control" [value]="sharedUrl" readonly #urlInput>
                <button class="btn btn-outline-secondary" type="button" (click)="copyUrl(urlInput)">
                  <i class="fas fa-copy"></i>
                </button>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-sm btn-danger" data-bs-dismiss="modal">
              <i class="fas fa-times me-2"></i>
              Cancel
            </button>
            <button type="button" class="btn btn-sm btn-success" (click)="saveJson()">
              <i class="fas fa-save me-2"></i>
              Save
            </button>
          </div>
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
  `]
})
export class ShareModalComponent {
  @Input() jsonData: string = '';
  retentionDays: number = 1; // Default to 1 month
  isSaving: boolean = false;
  sharedUrl: string = '';

  constructor(private jsonStorageService: JsonStorageService) {}

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
            let pathname = window.location.pathname;
            if (!pathname.endsWith('index.html')) {
              pathname = pathname === '/' ? '/index.html' : 
                        `${pathname.endsWith('/') ? pathname : `${pathname}/`}index.html`;
            }
            this.sharedUrl = `${window.location.origin}${pathname}?guid=${response.guid}`;
          }
        },
        error: (error) => {
          console.error('Error saving JSON:', error);
          alert('Failed to save JSON. Please try again.');
        },
        complete: () => {
          this.isSaving = false;
        }
      });
  }

  copyUrl(input: HTMLInputElement) {
    input.select();
    document.execCommand('copy');
    alert('URL copied to clipboard!');
  }
} 
