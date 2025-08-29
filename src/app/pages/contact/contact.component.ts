import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ContactService } from '../../services/contact.service';
import { HttpClientModule } from '@angular/common/http';
import { MultiplexAdComponent } from '../../shared/components';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, MultiplexAdComponent],
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
      next: () => {
        // Show success modal
        this.showSuccessModal = true;
        
        // Reset form
        this.formData = {
          name: '',
          email: '',
          message: ''
        };
        this.contactForm.resetForm();
      },
      error: (error) => {
        console.error('Error sending message:', error);
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  closeSuccessModal() {
    this.showSuccessModal = false;
  }
} 