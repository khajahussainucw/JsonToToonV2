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
  private baseUrl = 'https://jsontotablebackendapp.azurewebsites.net/api/Cfd1';
  private insertEndpoint = `${this.baseUrl}/InsertJsonData`;
  private getEndpoint = `${this.baseUrl}/GetJsonDataByGuid`;
  private getAllEndpoint = `${this.baseUrl}/GetAllJsonData`;
  private deleteEndpoint = `${this.baseUrl}/DeleteJsonData`;

  constructor(private http: HttpClient) {}

  saveJson(jsonData: string, retentionDays: number): Observable<JsonStorageResponse> {
    const minimizedJson = JSON.stringify(JSON.parse(jsonData)); // Validate and minimize
    return this.http.post<JsonStorageResponse>(this.insertEndpoint, {
      jsonData: minimizedJson,
      retentionDays: retentionDays
    });
  }

  getJsonByGuid(guid: string): Observable<string> {
    return this.http.get(`${this.getEndpoint}`, {
      params: { guid },
      responseType: 'text'
    }).pipe(
      map(jsonString => {
        try {
          const firstParse = JSON.parse(jsonString);
          
          // If firstParse is a string, it means the JSON was stored as a JSON string
          if (typeof firstParse === 'string') {
            // Parse the string to get the actual JSON object, then format it
            const actualJson = JSON.parse(firstParse);
            return JSON.stringify(actualJson, null, 2);
          } else {
            // If it's already an object, just format it
            return JSON.stringify(firstParse, null, 2);
          }
        } catch {
          // If parsing fails, return the raw string
          return jsonString;
        }
      })
    );
  }

  // Additional utility methods for Cfd1 features
  getAllJsonData(): Observable<any[]> {
    return this.http.get<any[]>(this.getAllEndpoint);
  }

  deleteJsonData(guid: string): Observable<boolean> {
    return this.http.delete<any>(this.deleteEndpoint, {
      params: { guid }
    }).pipe(
      map(result => result.Message?.includes('successfully') || result.message?.includes('successfully') || true)
    );
  }
} 