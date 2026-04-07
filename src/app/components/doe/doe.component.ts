import { Component, inject, signal, computed } from '@angular/core';
import { DataService, DoeEntry } from '../../data.service';
import { CommonModule } from '@angular/common';
import { DoeCardComponent } from '../doe-card/doe-card.component';

@Component({
  selector: 'app-doe',
  standalone: true,
  imports: [CommonModule, DoeCardComponent],
  templateUrl: './doe.component.html',
  styleUrl: './doe.component.css'
})
export class DoeComponent {
  private dataService = inject(DataService);
  
  filters = ['Todos', 'Matutino', 'Intermedio', 'Vespertino', 'Nocturno'];
  currentFilter = signal('Todos');
  
  doeData = this.dataService.getUnifiedDoeData();
  
  filteredDoeData = computed(() => {
    const filter = this.currentFilter();
    if (filter === 'Todos') return this.doeData;
    return this.doeData.filter(d => 
      d.shifts.some(s => s.turno.toLowerCase().includes(filter.toLowerCase()))
    );
  });

  setFilter(filter: string) {
    this.currentFilter.set(filter);
  }
}
