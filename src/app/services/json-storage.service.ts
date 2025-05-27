import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

interface JsonStorageResponse {
  guid: string;
}

@Injectable({
  providedIn: 'root'
})
export class JsonStorageService {
  private baseUrl = 'https://jsontotablebackendapp.azurewebsites.net/api/JsonStorage';
  private insertEndpoint = `${this.baseUrl}/InsertJsonData`;
  private getEndpoint = `${this.baseUrl}/GetJsonData`;

  constructor(private http: HttpClient) {}

  saveJson(jsonData: string, retentionDays: number): Observable<JsonStorageResponse> {
    const minimizedJson = JSON.stringify(JSON.parse(jsonData)); // Validate and minimize
    return this.http.post<JsonStorageResponse>(this.insertEndpoint, {
      jsonData: minimizedJson,
      retentionDays: retentionDays
    });
  }

  getJsonByGuid(guid: string): Observable<string> {
    return this.http.get<any>(`${this.getEndpoint}`, {
      params: { guid }
    }).pipe(
      map(response => JSON.stringify(response, null, 2))
    );
  }
} 