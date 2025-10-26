import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

interface JsonStorageResponse {
  guid: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class JsonStorageService {
  private baseUrl = `${environment.apiBaseUrl}/api/Cfd1`;
  private insertEndpoint = `${this.baseUrl}/InsertJsonData`;
  private getEndpoint = `${this.baseUrl}/GetJsonDataByGuid`;
  private getAllEndpoint = `${this.baseUrl}/GetAllJsonData`;
  private deleteEndpoint = `${this.baseUrl}/DeleteJsonData`;

  constructor(private http: HttpClient) {}

  saveJson(jsonData: string, retentionDays: number): Observable<JsonStorageResponse> {
    try {
      // Validate and minimize JSON before sending
      const minimizedJson = JSON.stringify(JSON.parse(jsonData));
      
      return this.http.post<any>(this.insertEndpoint, {
        jsonData: minimizedJson,
        retentionDays: retentionDays
      }).pipe(
        map(result => {
          // Cfd1 API returns { Message: "Record inserted successfully", Guid: "..." }
          const guid = result.Guid || result.guid;
          
          if (!guid) {
            console.error('No GUID returned from Cfd1 API:', result);
            throw new Error('Failed to get GUID from storage service');
          }
          
          return {
            guid: guid,
            message: result.Message || result.message || 'Record inserted successfully'
          };
        }),
        catchError(this.handleError)
      );
    } catch (error) {
      console.error('Error validating JSON:', error);
      return throwError(() => new Error('Invalid JSON data'));
    }
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
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          return throwError(() => new Error('The shared link is invalid or has expired'));
        }
        console.error('Get JSON data failed:', {
          status: error.status,
          statusText: error.statusText,
          error: error.message
        });
        return throwError(() => new Error('Unable to load shared JSON. The link may be invalid or expired'));
      })
    );
  }

  // Additional utility methods for Cfd1 features
  getAllJsonData(): Observable<any[]> {
    return this.http.get<any[]>(this.getAllEndpoint).pipe(
      catchError(this.handleError)
    );
  }

  deleteJsonData(guid: string): Observable<boolean> {
    return this.http.delete<any>(this.deleteEndpoint, {
      params: { guid }
    }).pipe(
      map(result => result.Message?.includes('successfully') || result.message?.includes('successfully') || true),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      console.error('HTTP Error:', {
        status: error.status,
        statusText: error.statusText,
        message: error.message
      });
      
      if (error.status === 0) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      } else if (error.status === 404) {
        errorMessage = 'The requested data was not found.';
      } else if (error.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else {
        errorMessage = `HTTP error! status: ${error.status}`;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }
} 