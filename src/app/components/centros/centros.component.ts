import { Component, inject, signal, computed } from '@angular/core';
import { DataService, CentroContacto } from '../../data.service';
import { CommonModule } from '@angular/common';
import { CentroCardComponent } from '../centro-card/centro-card.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-centros',
  standalone: true,
  imports: [CommonModule, CentroCardComponent, FormsModule],
  template: `
    <section class="section-header">
      <h2 style="color: var(--text-heading);">Centros e Institutos CFE</h2>
      <p style="color: var(--text-muted);">Guía de contactos oficial de institutos de formación en educación.</p>
      
      <div class="filter-bar" style="margin-top: 25px; display: flex;">
        <div style="position: relative; width: 100%; max-width: 400px;">
          <label for="centros-search" class="sr-only">Buscar centros, departamentos o tipos</label>
          <span style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none;" aria-hidden="true">🔍</span>
          <input 
            id="centros-search"
            type="text" 
            class="search-input" 
            style="width: 100%; text-align: left; padding: 12px 15px; padding-left: 40px; padding-right: 40px; background: var(--surface); color: var(--text-main); border: 1px solid var(--border-color); border-radius: 8px;"
            placeholder="Buscar por nombre, departamento o tipo..."
            [ngModel]="searchTerm()"
            (ngModelChange)="searchTerm.set($event)">
          <button 
            *ngIf="searchTerm()" 
            (click)="searchTerm.set('')"
            style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: #eee; border: none; color: #333; cursor: pointer; padding: 2px 6px; border-radius: 50%; z-index: 10; display: flex; align-items: center; justify-content: center; width: 22px; height: 22px;"
            title="Limpiar búsqueda"
            aria-label="Limpiar búsqueda"
          >
            <i class="fa-solid fa-xmark" style="font-size: 14px;" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    </section>

    <div class="doe-card-grid">
      <app-centro-card *ngFor="let centro of filteredCentros()" [data]="centro"></app-centro-card>
    </div>

    <div *ngIf="filteredCentros().length === 0" class="welcome-banner" style="text-align: center; margin-top: 50px;">
      <p>No se encontraron centros que coincidan con la búsqueda.</p>
    </div>
  `,
  styles: [`
    .search-input:focus {
      outline: none;
      border-color: var(--primary-color) !important;
      box-shadow: 0 0 0 3px rgba(0, 174, 239, 0.1);
    }
  `]
})
export class CentrosComponent {
  private dataService = inject(DataService);
  
  searchTerm = signal('');
  centros = this.dataService.getCentrosData();
  
  filteredCentros = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.centros;
    
    return this.centros.filter(c => 
      c.nombre.toLowerCase().includes(term) ||
      c.departamento.toLowerCase().includes(term) ||
      c.tipo.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term)
    );
  });
}
