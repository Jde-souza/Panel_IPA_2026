import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DataService, InasistenciaDocente } from '../../data.service';
import { CommonModule } from '@angular/common';
import { AccessibilityService } from '../../services/accessibility.service';

@Component({
  selector: 'app-inasistencias',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inasistencias.component.html',
  styleUrl: './inasistencias.component.css'
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
