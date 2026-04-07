import { Component, Input } from '@angular/core';
import { UnifiedDoeEntry } from '../../data.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-doe-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './doe-card.component.html',
  styleUrl: './doe-card.component.css'
})
export class DoeCardComponent {
  @Input({ required: true }) data!: UnifiedDoeEntry;

  isArray(val: any): boolean {
    return Array.isArray(val);
  }

  asArray(val: string | string[] | undefined): string[] {
    if (!val) return [];
    return Array.isArray(val) ? val : [val];
  }
}
