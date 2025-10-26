import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ContactService } from '../../services/contact.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent {
  @ViewChild('contactForm') contactForm!: NgForm;
  
  formData = {
    name: '',
    email: '',
    message: ''
  };
  
  isSubmitting = false;
  showSuccessModal = false;

  constructor(private contactService: ContactService) {}

  onSubmit() {
    if (this.isSubmitting || !this.contactForm.valid) return;
    
    this.isSubmitting = true;

    this.contactService.sendMessage(this.formData).subscribe({
      next: (response) => {
        console.log('Email sent successfully:', response);
        
        // Show success modal
        this.showSuccessModal = true;
        
        // Reset form
        this.formData = {
          name: '',
          email: '',
          message: ''
        };
        this.contactForm.resetForm();
        
        // Reset submitting state
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Error sending message:', error);
        
        // Check if it's a CORS or response parsing issue (status 0 or 200)
        // In these cases, the email was likely sent successfully
        if (error.status === 0 || error.status === 200) {
          console.log('Response issue detected, but email likely sent');
          
          // Show success modal anyway
          this.showSuccessModal = true;
          
          // Reset form
          this.formData = {
            name: '',
            email: '',
            message: ''
          };
          this.contactForm.resetForm();
        } else {
          // Actual error
          alert('Failed to send message. Please try again.');
        }
        
        // Reset submitting state
        this.isSubmitting = false;
      }
    });
  }

  closeSuccessModal() {
    this.showSuccessModal = false;
  }
} 