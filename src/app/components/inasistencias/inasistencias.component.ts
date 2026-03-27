import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DataService, InasistenciaDocente } from '../../data.service';
import { CommonModule } from '@angular/common';
import { AccessibilityService } from '../../services/accessibility.service';

@Component({
  selector: 'app-inasistencias',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="section-header">
      <h2>Inasistencias Docentes</h2>
      <p>Registro actualizado de avisos y solicitudes de inasistencia extraído de la planilla oficial.</p>
      
      <div class="filter-bar" style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
        <div style="position: relative; width: 350px;">
          <label for="inasistencias-search" class="sr-only">Buscar docente o asignatura</label>
          <i class="fa-solid fa-magnifying-glass" aria-hidden="true" style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none;"></i>
          <input 
            id="inasistencias-search"
            type="text" 
            class="search-input" 
            placeholder="Buscar docente o asignatura..."
            [value]="searchTerm()"
            (input)="updateSearch($event)"
            style="width: 100%; text-align: left; padding: 12px 40px; cursor: text; border-radius: 8px; border: 1px solid var(--border-color); background: var(--surface); color: var(--text-main);"
          >
          <button 
            *ngIf="searchTerm()" 
            (click)="clearSearch()"
            style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: #eee; border: none; color: #333; cursor: pointer; padding: 2px 6px; border-radius: 50%; z-index: 10; display: flex; align-items: center; justify-content: center; width: 20px; height: 20px;"
            title="Limpiar búsqueda"
            aria-label="Limpiar búsqueda"
          >
            <i class="fa-solid fa-xmark" aria-hidden="true" style="font-size: 12px;"></i>
          </button>
        </div>
        
        <a href="https://docs.google.com/spreadsheets/d/1VYYStJRPBSwO_7IBVfL60ie4KR-qF7AmTkrKYOZ5Cr4/edit?gid=223638343#gid=223638343" 
           target="_blank" 
           class="btn-original"
           aria-label="Abrir planilla original (abre en nueva pestaña)"
           style="text-decoration: none; display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; background: #1d8541; color: white; border-radius: 8px; font-weight: 600; font-size: 0.9rem; transition: all 0.3s;"
        >
          <i class="fa-solid fa-file-excel" aria-hidden="true"></i>
          Abrir Planilla Original
        </a>
      </div>
    </section>

    <div class="table-container fade-in">
      <table class="doe-table">
        <thead>
          <tr>
            <th scope="col">Docente</th>
            <th scope="col">Desde</th>
            <th scope="col">Hasta</th>
            <th scope="col">Grupos</th>
            <th scope="col">Asignaturas / Observaciones</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of filteredInasistencias()" [class.row-today]="isToday(item.inicio, item.fin)">
            <td style="font-weight: 700; color: var(--primary-color);">
              {{item.nombre}} {{item.apellido}}
              <span *ngIf="isToday(item.inicio, item.fin)" class="badge-today">HOY</span>
            </td>
            <td>{{item.inicio}}</td>
            <td>{{item.fin}}</td>
            <td style="font-size: 0.85rem; color: var(--text-muted);">{{item.grupos}}</td>
            <td>
              <div *ngFor="let asig of item.asignaturas" class="info-text" style="margin-bottom: 4px; font-size: 0.9rem;">
                <i class="fa-solid fa-circle-info" aria-hidden="true" style="font-size: 0.7rem; color: var(--primary-color); opacity: 0.7; margin-right: 5px;"></i> {{asig}}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div *ngIf="filteredInasistencias().length === 0" class="welcome-banner" style="text-align: center; margin-top: 50px;">
      <i class="fa-solid fa-calendar-xmark" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 20px; display: block;"></i>
      <p>No se encontraron registros que coincidan con la búsqueda.</p>
    </div>
  `,
  styles: [`
    .doe-table td { 
      vertical-align: top;
      padding-top: 15px;
      padding-bottom: 15px;
    }
    .search-input {
      transition: all 0.3s ease;
    }
    .search-input:focus {
      outline: none;
      border-color: var(--primary-color) !important;
      box-shadow: 0 0 0 3px rgba(0, 174, 239, 0.1);
    }
    .btn-original:hover {
      background: #156d35 !important;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(29, 133, 65, 0.3);
    }
    .row-today {
      background-color: rgba(0, 174, 239, 0.05);
      border-left: 4px solid var(--primary-color);
    }
    .badge-today {
      background: var(--primary-color);
      color: white;
      font-size: 0.65rem;
      padding: 2px 6px;
      border-radius: 4px;
      margin-left: 8px;
      vertical-align: middle;
      box-shadow: 0 2px 4px rgba(0, 174, 239, 0.3);
    }
  `]
})
export class InasistenciasComponent implements OnInit {
  private dataService = inject(DataService);
  private a11y = inject(AccessibilityService);
  
  inasistencias = signal<InasistenciaDocente[]>([]);
  searchTerm = signal('');

  filteredInasistencias = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const data = this.inasistencias();
    
    let filtered = term 
      ? data.filter(i => 
          i.nombre.toLowerCase().includes(term) || 
          i.apellido.toLowerCase().includes(term) || 
          i.grupos.toLowerCase().includes(term) ||
          i.asignaturas.some(a => a.toLowerCase().includes(term))
        )
      : [...data];

    // Ordenamiento: 1. Hoy, 2. Fecha de inicio descendente (más recientes primero)
    return filtered.sort((a, b) => {
      const aToday = this.isToday(a.inicio, a.fin);
      const bToday = this.isToday(b.inicio, b.fin);
      
      if (aToday && !bToday) return -1;
      if (!aToday && bToday) return 1;
      
      const dateA = this.parseDate(a.inicio);
      const dateB = this.parseDate(b.inicio);
      return dateB.getTime() - dateA.getTime();
    });
  });

  ngOnInit() {
    this.a11y.announce('Cargando inasistencias docentes...', 'polite');
    this.dataService.getInasistenciasData().subscribe({
      next: (data) => {
        this.inasistencias.set(data);
        this.a11y.announce(`Se han cargado ${data.length} registros de inasistencias.`, 'polite');
      },
      error: (err) => {
        console.error('Error cargando inasistencias:', err);
        this.a11y.announce('Error al cargar inasistencias.', 'assertive');
      }
    });
  }

  updateSearch(event: any) {
    const value = event.target.value;
    this.searchTerm.set(value);
    
    // Announce results after a short debounce-like delay
    setTimeout(() => {
      if (this.searchTerm() === value) {
        const count = this.filteredInasistencias().length;
        this.a11y.announce(`Encontrados ${count} resultados para "${value}"`, 'polite');
      }
    }, 500);
  }

  clearSearch() {
    this.searchTerm.set('');
  }

  isToday(inicioStr: string, finStr: string): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const start = this.parseDate(inicioStr);
    const end = this.parseDate(finStr);
    
    // Si parseDate devuelve una fecha inválida (0), no es hoy
    if (start.getTime() === 0 || end.getTime() === 0) return false;
    
    return today >= start && today <= end;
  }

  private parseDate(dateStr: string): Date {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(+parts[2], +parts[1] - 1, +parts[0]);
    }
    return new Date(0);
  }
}
