import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-regex-tester',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './regex-tester.component.html',
  styleUrl: './regex-tester.component.css'
})
export class RegexTesterComponent {
  regexPattern = '';
  regexFlags = 'g';
  testString = '';
  matches: any[] = [];
  errorMessage = '';
  isValid = false;

  constructor(private titleService: Title, private metaService: Meta) {
    this.titleService.setTitle('RegEx Tester - Test Regular Expressions Online');
    this.metaService.updateTag({
      name: 'description',
      content: 'Test and debug regular expressions online with real-time matching and explanations.'
    });
    
    this.loadSample();
  }

  loadSample() {
    this.regexPattern = '\\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}\\b';
    this.regexFlags = 'gi';
    this.testString = `Contact us at support@example.com or sales@company.org
For more info, email info@website.net`;
    this.testRegex();
  }

  testRegex() {
    this.matches = [];
    this.errorMessage = '';
    this.isValid = false;

    if (!this.regexPattern) {
      return;
    }

    try {
      const regex = new RegExp(this.regexPattern, this.regexFlags);
      this.isValid = true;

      if (!this.testString) {
        return;
      }

      let match;
      const matchesArray: any[] = [];
      
      if (this.regexFlags.includes('g')) {
        while ((match = regex.exec(this.testString)) !== null) {
          matchesArray.push({
            text: match[0],
            index: match.index,
            groups: match.slice(1)
          });
          
          // Prevent infinite loop
          if (match.index === regex.lastIndex) {
            regex.lastIndex++;
          }
        }
      } else {
        match = regex.exec(this.testString);
        if (match) {
          matchesArray.push({
            text: match[0],
            index: match.index,
            groups: match.slice(1)
          });
        }
      }

      this.matches = matchesArray;
    } catch (error: any) {
      this.errorMessage = 'Invalid RegEx: ' + error.message;
      this.isValid = false;
    }
  }

  getHighlightedText(): string {
    if (!this.isValid || !this.testString || this.matches.length === 0) {
      return this.testString;
    }

    let result = '';
    let lastIndex = 0;

    // Sort matches by index
    const sortedMatches = [...this.matches].sort((a, b) => a.index - b.index);

    for (const match of sortedMatches) {
      // Add text before match
      result += this.escapeHtml(this.testString.substring(lastIndex, match.index));
      // Add highlighted match
      result += `<mark>${this.escapeHtml(match.text)}</mark>`;
      lastIndex = match.index + match.text.length;
    }

    // Add remaining text
    result += this.escapeHtml(this.testString.substring(lastIndex));

    return result;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  clearAll() {
    this.regexPattern = '';
    this.regexFlags = 'g';
    this.testString = '';
    this.matches = [];
    this.errorMessage = '';
    this.isValid = false;
  }
}

