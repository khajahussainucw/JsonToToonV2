import { Component, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, GridApi } from 'ag-grid-community';

@Component({
  selector: 'app-csv-viewer',
  standalone: true,
  imports: [CommonModule, RouterModule, AgGridAngular],
  templateUrl: './csv-viewer.component.html',
  styleUrl: './csv-viewer.component.css'
})
export class CsvViewerComponent implements AfterViewInit {
  @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;

  rowData: any[] = [];
  columnDefs: ColDef[] = [];
  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    editable: true
  };
  
  private gridApi!: GridApi;
  
  // Modal dialog state
  errorModalVisible = false;
  errorMessage = '';
  // Copy success message state
  copySuccessVisible = false;
  copySuccessMessage = '';
  copyErrorVisible = false;
  copyErrorMessage = '';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private meta: Meta,
    private title: Title
  ) {
    this.setupMetaTags();
  }

  private setupMetaTags() {
    this.title.setTitle('CSV Viewer - View and Edit CSV Online');
    this.meta.updateTag({
      name: 'description',
      content: 'View, edit, and analyze CSV files online with our interactive CSV viewer. Sort, filter, and export your CSV data with ease.'
    });
    this.meta.updateTag({
      name: 'keywords',
      content: 'csv viewer, csv editor, view csv online, csv grid, csv table viewer'
    });
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadSampleData();
    }
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();
  }

  loadSampleData() {
    const sampleCsv = `id,name,email,age,city,salary,department
1,John Doe,john@example.com,30,New York,75000,Engineering
2,Jane Smith,jane@example.com,28,Los Angeles,68000,Marketing
3,Bob Johnson,bob@example.com,35,Chicago,82000,Sales
4,Alice Williams,alice@example.com,32,Houston,71000,Engineering
5,Charlie Brown,charlie@example.com,29,Phoenix,69000,Marketing
6,Diana Prince,diana@example.com,31,Philadelphia,78000,Sales`;

    this.parseAndDisplayCsv(sampleCsv);
  }

  triggerFileUpload(): void {
    this.fileInput.nativeElement.value = '';
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      this.parseAndDisplayCsv(content);
    };
    reader.readAsText(file);
  }

  private parseAndDisplayCsv(csvContent: string) {
    try {
      const lines = csvContent.trim().split('\n');
      if (lines.length < 2) {
        this.showErrorModal('CSV must have at least a header row and one data row');
        return;
      }

      // Parse header
      const headers = this.parseCsvLine(lines[0]);
      
      // Create column definitions
      this.columnDefs = headers.map(header => ({
        field: header,
        headerName: header,
        sortable: true,
        filter: true,
        resizable: true,
        editable: true
      }));

      // Parse data rows
      const data: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = this.parseCsvLine(line);
        const obj: any = {};
        
        headers.forEach((header, index) => {
          let value: any = values[index] || '';
          
          // Try to parse as number
          if (value && !isNaN(value)) {
            value = parseFloat(value);
          }
          // Try to parse as boolean
          else if (value.toLowerCase() === 'true') {
            value = true;
          }
          else if (value.toLowerCase() === 'false') {
            value = false;
          }
          
          obj[header] = value;
        });
        
        data.push(obj);
      }

      this.rowData = data;
      
      // Fit columns after data is loaded
      setTimeout(() => {
        if (this.gridApi) {
          this.gridApi.sizeColumnsToFit();
        }
      }, 100);
    }
    catch (error: any) {
      this.showErrorModal('Error parsing CSV: ' + error.message);
      return;
    }
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  clearData(): void {
    this.rowData = [];
    this.columnDefs = [];
  }

  exportToJson(): void {
    if (this.rowData.length === 0) {
      this.copyErrorMessage = 'No data to export';
      this.copyErrorVisible = true;
      setTimeout(() => {
        this.copyErrorVisible = false;
      }, 3000);
      return;
    }

    const json = JSON.stringify(this.rowData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'exported.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    this.copySuccessMessage = 'JSON exported successfully!';
    this.copySuccessVisible = true;
    setTimeout(() => {
      this.copySuccessVisible = false;
    }, 3000);
  }

  exportToCsv(): void {
    if (this.rowData.length === 0) {
      this.copyErrorMessage = 'No data to export';
      this.copyErrorVisible = true;
      setTimeout(() => {
        this.copyErrorVisible = false;
      }, 3000);
      return;
    }

    // Get column headers
    const headers = this.columnDefs.map(col => col.field || '');
    let csv = headers.join(',') + '\n';
    
    // Add data rows
    this.rowData.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        if (value === undefined || value === null) {
          return '';
        }
        const strValue = String(value);
        // Escape if contains comma or quotes
        if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
          return '"' + strValue.replace(/"/g, '""') + '"';
        }
        return strValue;
      });
      csv += values.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'exported.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    this.copySuccessMessage = 'CSV exported successfully!';
    this.copySuccessVisible = true;
    setTimeout(() => {
      this.copySuccessVisible = false;
    }, 3000);
  }

  showErrorModal(message: string): void {
    this.errorMessage = message;
    this.errorModalVisible = true;
  }

  closeErrorModal(): void {
    this.errorModalVisible = false;
  }
}

