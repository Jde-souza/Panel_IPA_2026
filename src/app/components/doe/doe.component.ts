import { Component, inject, signal, computed } from '@angular/core';
import { DataService, DoeEntry } from '../../data.service';
import { CommonModule } from '@angular/common';
import { DoeCardComponent } from '../doe-card/doe-card.component';

@Component({
  selector: 'app-doe',
  standalone: true,
  imports: [CommonModule, DoeCardComponent],
  template: `
    <section class="section-header">
      <h2>Horarios DOE</h2>
      <p>Departamento de Orientación Estudiantil - Planificación de Turnos</p>
      <div class="filter-bar" role="group" aria-label="Filtrar por turno">
        <button 
          *ngFor="let filter of filters" 
          class="filter-btn" 
          [class.active]="currentFilter() === filter"
          (click)="setFilter(filter)"
          [attr.aria-pressed]="currentFilter() === filter">
          {{filter}}
        </button>
      </div>
    </section>
    
    <div class="doe-card-grid">
      <app-doe-card *ngFor="let item of filteredDoeData()" [data]="item"></app-doe-card>
    </div>

    <div *ngIf="filteredDoeData().length === 0" class="welcome-banner" style="text-align: center; margin-top: 50px;">
      <p>No se encontraron orientadores para esta selección.</p>
    </div>
  `,
  styles: []
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
