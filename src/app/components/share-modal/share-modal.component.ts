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
            <h5 class="modal-title" id="shareModalLabel">
              <i class="fas fa-share-square me-2"></i>
              Share JSON
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label for="retentionPeriod" class="form-label">Retention Period (days)</label>
              <select class="form-select" id="retentionPeriod" [(ngModel)]="retentionDays">
                <option value="1">1 day</option>
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
              </select>
            </div>
            
            <div class="alert alert-info" role="alert">
              <i class="fas fa-info-circle me-2"></i>
              Your JSON will be stored securely and will automatically expire after the selected period.
            </div>

            <div *ngIf="sharedUrl" class="mt-3">
              <label class="form-label">Share URL:</label>
              <div class="input-group">
                <input type="text" class="form-control" [value]="sharedUrl" readonly #urlInput>
                <button class="btn btn-outline-secondary" type="button" (click)="copyUrl(urlInput)">
                  <i class="fas fa-copy"></i>
                </button>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" [disabled]="isSaving">Cancel</button>
            <button type="button" class="btn btn-dark" (click)="saveJson()" [disabled]="isSaving || sharedUrl">
              <i class="fas" [class.fa-share-square]="!isSaving" [class.fa-spinner]="isSaving" [class.fa-spin]="isSaving"></i>
              {{ isSaving ? 'Saving...' : 'Share' }}
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
    .btn-close {
      filter: invert(1) brightness(200%);
    }
  `]
})
export class ShareModalComponent {
  @Input() jsonData: string = '';
  retentionDays: number = 7;
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
    this.jsonStorageService.saveJson(this.jsonData, this.retentionDays)
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