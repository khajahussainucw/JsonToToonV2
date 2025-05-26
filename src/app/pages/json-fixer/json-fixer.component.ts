import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-json-fixer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './json-fixer.component.html',
  styleUrls: ['./json-fixer.component.css']
})
export class JsonFixerComponent {
  loadSampleData(): void {
    // TODO: Load sample JSON into left editor
  }

  fixJson(): void {
    // TODO: Fix or transform JSON from left editor to right editor
  }

  clearEditors(): void {
    // TODO: Clear both left and right editors
  }
}
