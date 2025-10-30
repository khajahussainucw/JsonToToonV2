import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-base64-tool',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './base64-tool.component.html',
  styleUrl: './base64-tool.component.css'
})
export class Base64ToolComponent {
  textInput = '';
  base64Output = '';
  errorMessage = '';
  copySuccessMessage = '';
  mode: 'encode' | 'decode' = 'encode';

  constructor(private titleService: Title, private metaService: Meta) {
    this.titleService.setTitle('Base64 Encoder/Decoder - Encode and Decode Base64 Online');
    this.metaService.updateTag({
      name: 'description',
      content: 'Encode and decode Base64 strings online. Convert text to Base64 and vice versa.'
    });
    
    this.loadSample();
  }

  loadSample() {
    if (this.mode === 'encode') {
      this.textInput = 'Hello, World! This is a sample text for Base64 encoding.';
    } else {
      this.textInput = 'SGVsbG8sIFdvcmxkISBUaGlzIGlzIGEgc2FtcGxlIHRleHQgZm9yIEJhc2U2NCBlbmNvZGluZy4=';
    }
    this.process();
  }

  switchMode(newMode: 'encode' | 'decode') {
    this.mode = newMode;
    this.textInput = '';
    this.base64Output = '';
    this.errorMessage = '';
    this.loadSample();
  }

  process() {
    this.errorMessage = '';
    this.copySuccessMessage = '';

    if (!this.textInput.trim()) {
      this.base64Output = '';
      return;
    }

    try {
      if (this.mode === 'encode') {
        this.base64Output = btoa(unescape(encodeURIComponent(this.textInput)));
      } else {
        this.base64Output = decodeURIComponent(escape(atob(this.textInput)));
      }
    } catch (error: any) {
      this.errorMessage = `Error ${this.mode === 'encode' ? 'encoding' : 'decoding'}: ${error.message}`;
      this.base64Output = '';
    }
  }

  copyToClipboard() {
    if (!this.base64Output) {
      this.errorMessage = 'No output to copy';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    navigator.clipboard.writeText(this.base64Output).then(() => {
      this.copySuccessMessage = 'Copied to clipboard!';
      setTimeout(() => this.copySuccessMessage = '', 2000);
    });
  }

  downloadOutput() {
    if (!this.base64Output) {
      this.errorMessage = 'No output to download';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    const blob = new Blob([this.base64Output], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.mode === 'encode' ? 'encoded.txt' : 'decoded.txt';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  uploadFile(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.textInput = e.target.result;
        this.process();
      };
      reader.readAsText(file);
    }
    event.target.value = '';
  }

  clearAll() {
    this.textInput = '';
    this.base64Output = '';
    this.errorMessage = '';
    this.copySuccessMessage = '';
  }
}

