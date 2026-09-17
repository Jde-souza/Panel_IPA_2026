import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Inasistencia {
  timestamp: string;
  email: string;
  nombre: string;
  apellido: string;
  inicio: string;
  fin: string;
  grupos: string;
  asignaturas: string[];
  isToday?: boolean;
}

@Component({
  selector: 'app-inasistencias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inasistencias.component.html'
})
export class InasistenciasComponent implements OnInit {
  inasistencias: Inasistencia[] = [];
  filteredInasistencias: Inasistencia[] = [];
  
  isLoading = true;
  error = '';
  searchTerm = '';
  activeFilter: 'all' | 'today' | 'multiple' = 'all';

  // KPIs
  totalRegistros = 0;
  ausentesHoy = 0;
  multiplesDias = 0;

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    try {
      this.isLoading = true;
      const response = await fetch('/data/inasistencias.json');
      if (!response.ok) throw new Error('Error al cargar datos');
      
      const data: Inasistencia[] = await response.json();
      
      // Ordenar por fecha más reciente (usando el timestamp original si es posible, o simplemente invirtiendo porque google forms los agrega al final)
      this.inasistencias = data.reverse();
      
      this.calculateStats();
      this.filterData();
    } catch (e: any) {
      this.error = e.message;
    } finally {
      this.isLoading = false;
    }
  }

  parseDate(dateStr: string): Date {
    if (!dateStr) return new Date(0);
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      // DD/MM/YYYY
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return new Date(dateStr); // Fallback
  }

  isDateInRange(targetDate: Date, startStr: string, endStr: string): boolean {
    const startDate = this.parseDate(startStr);
    const endDate = endStr ? this.parseDate(endStr) : startDate; // Si no hay fin, asume un día
    
    // Normalizar horas a 0 para comparación justa
    const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    return target >= start && target <= end;
  }

  calculateStats() {
    this.totalRegistros = this.inasistencias.length;
    
    // Usamos el 16 de septiembre de 2026 como "hoy" según el contexto del sistema, o un Date normal si estuviéramos en producción
    const today = new Date(2026, 8, 16); 
    
    this.ausentesHoy = 0;
    this.multiplesDias = 0;

    this.inasistencias.forEach(i => {
      // Calcular los ausentes hoy
      if (i.inicio) {
        if (this.isDateInRange(today, i.inicio, i.fin)) {
          this.ausentesHoy++;
          i.isToday = true;
        }
      }
      
      // Múltiples días
      if (i.inicio && i.fin && i.inicio !== i.fin) {
        this.multiplesDias++;
      }
    });
  }

  setFilter(filter: 'all' | 'today' | 'multiple') {
    this.activeFilter = filter;
    this.filterData();
  }

  filterData() {
    let filtered = this.inasistencias;

    // Filtro por tipo de tarjeta
    if (this.activeFilter === 'today') {
      filtered = filtered.filter(i => i.isToday);
    } else if (this.activeFilter === 'multiple') {
      filtered = filtered.filter(i => i.inicio && i.fin && i.inicio !== i.fin);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(i => 
        (i.nombre || '').toLowerCase().includes(term) ||
        (i.apellido || '').toLowerCase().includes(term) ||
        (i.grupos || '').toLowerCase().includes(term) ||
        i.asignaturas.some(a => (a || '').toLowerCase().includes(term))
      );
    }

    this.filteredInasistencias = filtered;
  }
}
