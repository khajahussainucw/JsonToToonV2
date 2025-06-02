import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private readonly apiUrl = 'https://jsontotablebackendapp.azurewebsites.net/ContactUs/SendEmail';

  constructor(private http: HttpClient) {}

  sendMessage(formData: ContactFormData): Observable<any> {
    return this.http.get(this.apiUrl, {
      params: {
        name: formData.name,
        email: formData.email,
        message: formData.message
      }
    });
  }
} 