import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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
    // Create URL parameters
    const params = new HttpParams()
      .set('name', formData.name)
      .set('email', formData.email)
      .set('message', formData.message);

    // Make POST request with parameters in URL
    return this.http.post(this.apiUrl, null, { params });
  }
} 
