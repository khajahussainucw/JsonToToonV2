import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContactService, ContactFormData } from '../../services/contact.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent {
  formData: ContactFormData = {
    name: '',
    email: '',
    message: ''
  };
  
  isSubmitting = false;
  showSuccessMessage = false;
  showErrorMessage = false;
  errorMessage = '';

  constructor(private contactService: ContactService) {}

  onSubmit() {
    if (this.isSubmitting) return;
    
    this.isSubmitting = true;
    this.showSuccessMessage = false;
    this.showErrorMessage = false;

    this.contactService.sendMessage(this.formData).subscribe({
      next: (response) => {
        this.showSuccessMessage = true;
        this.formData = {
          name: '',
          email: '',
          message: ''
        };
      },
      error: (error) => {
        this.showErrorMessage = true;
        this.errorMessage = 'Failed to send message. Please try again later.';
        console.error('Error sending message:', error);
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }
} 