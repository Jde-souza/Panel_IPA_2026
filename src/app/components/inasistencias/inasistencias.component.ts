import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../data.service';
import { firstValueFrom } from 'rxjs';
import { AlertService } from '../../services/alert.service';

interface Inasistencia {
  id?: number;
  timestamp: string;
  email: string;
  nombre: string;
  apellido: string;
  inicio: string;
  fin: string;
  grupos: string;
  asignaturas: string[];
  isToday?: boolean;
  causal?: string;
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
  causalesList: string[] = [];

  // KPIs
  totalRegistros = 0;
  ausentesHoy = 0;
  multiplesDias = 0;

  ngOnInit() {
    this.loadData();
  }

  private dataService = inject(DataService);

  async loadData() {
    try {
      this.isLoading = true;
      const dbData = await firstValueFrom(this.dataService.getInasistenciasData());
      
      // Mapear los datos de la base de datos a la interfaz esperada por el frontend
      const data: Inasistencia[] = (dbData as any[]).map((row: any) => ({
        id: row.id,
        timestamp: row.marca_temporal || row.timestamp,
        email: row.email,
        nombre: row.nombre,
        apellido: row.apellido,
        inicio: row.fecha_inicio || row.inicio,
        fin: row.fecha_fin || row.fin,
        grupos: row.grupos,
        causal: row.causal,
        asignaturas: [row.asignatura1, row.asignatura2, row.asignatura3, row.asignatura4].filter(Boolean)
      }));
      
      this.inasistencias = data; // Ya vienen ordenados descendentemente desde el backend
      
      this.calculateStats();
      this.filterData();

      // Load config for modal dropdowns
      const config = await firstValueFrom(this.dataService.getConfiguracion());
      if (config.causales) {
        this.causalesList = Array.isArray(config.causales) ? config.causales : config.causales.split('\n').filter(Boolean);
      }
    } catch (e: any) {
      this.error = e.message;
      console.error('Error conectando al backend. Asegúrate de tener el servidor corriendo en localhost:3000', e);
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

  // --- Modal Logic ---
  showModal = false;
  isSaving = false;
  editingId: number | null = null;
  newRecord: any = {
    nombre: '',
    apellido: '',
    email: '',
    inicio: '',
    fin: '',
    grupos: '',
    asignaturasStr: '', // comma separated input
    causal: ''
  };

  openModal(item?: Inasistencia) {
    this.showModal = true;
    if (item && item.id) {
      this.editingId = item.id;
      this.newRecord = {
        nombre: item.nombre || '',
        apellido: item.apellido || '',
        email: item.email || '',
        inicio: item.inicio || '',
        fin: item.fin || '',
        grupos: item.grupos || '',
        asignaturasStr: (item.asignaturas || []).join(', '),
        causal: item.causal || ''
      };
    } else {
      this.editingId = null;
      this.newRecord = { nombre: '', apellido: '', email: '', inicio: '', fin: '', grupos: '', asignaturasStr: '', causal: '' };
    }
  }

  closeModal() {
    this.showModal = false;
  }

  private alertService = inject(AlertService);

  async saveRecord() {
    try {
      this.isSaving = true;
      const asignaturasArray = this.newRecord.asignaturasStr.split(',').map((s: string) => s.trim()).filter(Boolean);
      
      const payload = {
        nombre: this.newRecord.nombre,
        apellido: this.newRecord.apellido,
        email: this.newRecord.email,
        fecha_inicio: this.newRecord.inicio,
        fecha_fin: this.newRecord.fin,
        grupos: this.newRecord.grupos,
        asignatura1: asignaturasArray[0] || '',
        asignatura2: asignaturasArray[1] || '',
        asignatura3: asignaturasArray[2] || '',
        asignatura4: asignaturasArray[3] || '',
        causal: this.newRecord.causal,
        marca_temporal: new Date().toISOString()
      };

      if (this.editingId) {
        await firstValueFrom(this.dataService.updateInasistencia(this.editingId, payload));
        this.alertService.success('Inasistencia actualizada correctamente');
      } else {
        await firstValueFrom(this.dataService.saveInasistencia(payload));
        this.alertService.success('Inasistencia registrada correctamente');
      }
      
      this.closeModal();
      await this.loadData(); // Recargar datos
    } catch (e: any) {
      console.error(e);
      this.alertService.error('Error al guardar: ' + e.message);
    } finally {
      this.isSaving = false;
    }
  }

  async deleteRecord(id?: number) {
    if (!id) return;
    if (confirm('¿Estás seguro de que deseas eliminar este registro de inasistencia?')) {
      try {
        await firstValueFrom(this.dataService.deleteInasistencia(id));
        this.alertService.success('Inasistencia eliminada exitosamente');
        await this.loadData();
      } catch (e: any) {
        console.error(e);
        this.alertService.error('Error al eliminar: ' + e.message);
      }
    }
  }
}
