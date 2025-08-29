import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MultiplexAdComponent } from '../../shared/components';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterModule, MultiplexAdComponent],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent {} 