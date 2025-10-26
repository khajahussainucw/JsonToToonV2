import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class JsonFixerService {
  private apiUrl = `${environment.apiBaseUrl}/FixMyJsonV2/FixMyJsonV3`;

  constructor(private http: HttpClient) {}

  fixJson(jsonString: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json; charset=utf-8' });
    const body = JSON.stringify(jsonString); // ✅ this is important
    return this.http.post<any>(this.apiUrl, body, { headers });
  }
} 