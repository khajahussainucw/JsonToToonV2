import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

interface GenericStorageResponse {
  message: string;
  guid: string;
  dataType: string;
}

interface GenericStorageRequest {
  data: string;
  dataType: string;
  retentionDays: number;
  source?: string;
  metadata?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GenericStorageService {
  private baseUrl = 'https://jsontotablebackendapp.azurewebsites.net/api/GenericData';
  private storeEndpoint = `${this.baseUrl}/Store`;
  private getEndpoint = `${this.baseUrl}/GetByGuid`;
  private getAllEndpoint = `${this.baseUrl}/GetAll`;
  private deleteEndpoint = `${this.baseUrl}/Delete`;

  constructor(private http: HttpClient) {}

  saveData(data: string, dataType: string, retentionDays: number, source?: string, metadata?: string): Observable<GenericStorageResponse> {
    const requestBody: GenericStorageRequest = {
      data: data,
      dataType: dataType.toLowerCase(),
      retentionDays: retentionDays,
      source: source,
      metadata: metadata
    };

    return this.http.post<any>(this.storeEndpoint, requestBody).pipe(
      map(result => ({
        message: result.Message || result.message || 'Data stored successfully',
        guid: result.Guid || result.guid,
        dataType: result.DataType || result.dataType || dataType
      }))
    );
  }

  getDataByGuid(guid: string): Observable<{data: string, dataType: string, source?: string}> {
    return this.http.get<any>(this.getEndpoint, {
      params: { guid }
    }).pipe(
      map(result => ({
        data: result.Data || result.data,
        dataType: result.DataType || result.dataType,
        source: result.Source || result.source
      }))
    );
  }

  getAllData(dataType?: string): Observable<any[]> {
    const params = dataType ? { dataType } : {};
    return this.http.get<any[]>(this.getAllEndpoint, { params });
  }

  deleteData(guid: string): Observable<boolean> {
    return this.http.delete<any>(this.deleteEndpoint, {
      params: { guid }
    }).pipe(
      map(() => true)
    );
  }
}

export type { GenericStorageResponse, GenericStorageRequest };
