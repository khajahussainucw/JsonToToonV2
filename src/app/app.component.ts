import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule], 
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'json-to-table-angular';

  constructor(private router: Router) {}

  onLogoClick(event: MouseEvent) {
    event.preventDefault();
    // Navigate to home and force a full reload
    window.location.href = '/';
  }
}
