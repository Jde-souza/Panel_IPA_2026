import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../data.service';
import { AlertService } from '../../services/alert.service';
import { firstValueFrom } from 'rxjs';

export interface Especialidad {
  nombre: string;
  materias: string[];
}

export interface Salon {
  nombre: string;
  piso: string;
  capacidad: number | null;
  recursos: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html'
})
export class SettingsComponent implements OnInit {
  private dataService = inject(DataService);
  private alertService = inject(AlertService);

  isLoading = true;
  isSaving = false;
  activeTab = 'general';

  config = {
    anoLectivo: '2026',
    semestreActual: 'sem1',
    planes: '',
    causales: ''
  };

  especialidades: Especialidad[] = [];
  salones: Salon[] = [];
  materiasGlobales: string[] = [];

  // Modal State para Especialidades
  showEspecialidadModal = false;
  editingEspIndex: number = -1;
  currentEsp: Especialidad = { nombre: '', materias: [] };
  newMateria: string = '';
  filtroMateriaEsp: string = '';
  nuevaMateriaGlobal: string = '';

  // Modal State para Salones
  showSalonModal = false;
  editingSalonIndex: number = -1;
  currentSalon: Salon = { nombre: '', piso: '', capacidad: null, recursos: '' };

  async ngOnInit() {
    await this.loadConfig();
  }

  async loadConfig() {
    try {
      this.isLoading = true;
      const res = await firstValueFrom(this.dataService.getConfiguracion());
      
      // Map API response to component state
      if (res.anoLectivo) this.config.anoLectivo = res.anoLectivo;
      if (res.semestreActual) this.config.semestreActual = res.semestreActual;
      
      if (res.especialidades) {
        if (typeof res.especialidades === 'string') {
          // Legacy migration
          this.especialidades = res.especialidades.split('\n').filter(Boolean).map((e: string) => ({ nombre: e, materias: [] }));
        } else {
          this.especialidades = res.especialidades;
        }
      }
      
      if (res.salones) {
        if (typeof res.salones === 'string') {
          // Legacy migration
          this.salones = res.salones.split('\n').filter(Boolean).map((s: string) => ({ nombre: s, piso: '', capacidad: null, recursos: '' }));
        } else if (Array.isArray(res.salones) && res.salones.length > 0 && typeof res.salones[0] === 'string') {
           this.salones = res.salones.map((s: string) => ({ nombre: s, piso: '', capacidad: null, recursos: '' }));
        } else {
          this.salones = res.salones;
        }
      }

      if (res.materias) {
        this.materiasGlobales = res.materias;
      } else {
        const matSet = new Set<string>();
        if (this.especialidades) {
            this.especialidades.forEach(e => {
                if (e.materias) e.materias.forEach(m => matSet.add(m));
            });
        }
        this.materiasGlobales = Array.from(matSet);
      }
      
      if (res.planes) this.config.planes = Array.isArray(res.planes) ? res.planes.join('\n') : res.planes;
      if (res.causales) this.config.causales = Array.isArray(res.causales) ? res.causales.join('\n') : res.causales;
      
    } catch (e: any) {
      this.alertService.error('Error al cargar configuración: ' + e.message);
    } finally {
      this.isLoading = false;
    }
  }

  async saveConfig() {
    try {
      this.isSaving = true;
      
      // Parse textareas back to arrays
      const payload = {
        anoLectivo: this.config.anoLectivo,
        semestreActual: this.config.semestreActual,
        especialidades: this.especialidades,
        salones: this.salones,
        planes: this.config.planes.split('\n').map(s => s.trim()).filter(Boolean),
        causales: this.config.causales.split('\n').map(s => s.trim()).filter(Boolean),
        materias: this.materiasGlobales
      };

      await firstValueFrom(this.dataService.saveConfiguracion(payload));
      this.alertService.success('Configuración del sistema guardada con éxito');
    } catch (e: any) {
      console.error(e);
      this.alertService.error('Error al guardar configuración: ' + e.message);
    } finally {
      this.isSaving = false;
    }
  }

  // --- Modal Logic para Especialidades ---
  openEspModal(index: number = -1) {
    if (index >= 0) {
      this.editingEspIndex = index;
      this.currentEsp = JSON.parse(JSON.stringify(this.especialidades[index])); // Deep copy
    } else {
      this.editingEspIndex = -1;
      this.currentEsp = { nombre: '', materias: [] };
    }
    this.newMateria = '';
    this.filtroMateriaEsp = '';
    this.showEspecialidadModal = true;
  }

  closeEspModal() {
    this.showEspecialidadModal = false;
  }

  addMateria() {
    const val = this.newMateria.trim();
    if (val && !this.currentEsp.materias.includes(val)) {
      this.currentEsp.materias.push(val);
      this.newMateria = '';
    }
  }

  removeMateria(index: number) {
    this.currentEsp.materias.splice(index, 1);
  }

  toggleMateriaEnEsp(mat: string) {
    const idx = this.currentEsp.materias.indexOf(mat);
    if (idx !== -1) {
      this.currentEsp.materias.splice(idx, 1);
    } else {
      this.currentEsp.materias.push(mat);
    }
  }

  get materiasFiltradas() {
    if (!this.filtroMateriaEsp) return this.materiasGlobales;
    return this.materiasGlobales.filter(m => m.toLowerCase().includes(this.filtroMateriaEsp.toLowerCase()));
  }

  addMateriaGlobal() {
    const val = this.nuevaMateriaGlobal.trim();
    if (val && !this.materiasGlobales.includes(val)) {
      this.materiasGlobales.push(val);
      this.nuevaMateriaGlobal = '';
    }
  }

  removeMateriaGlobal(index: number) {
    const mat = this.materiasGlobales[index];
    if (confirm(`¿Eliminar la materia "${mat}"? Se quitará también de las especialidades que la usen.`)) {
      this.materiasGlobales.splice(index, 1);
      this.especialidades.forEach(esp => {
        const idx = esp.materias.indexOf(mat);
        if (idx !== -1) esp.materias.splice(idx, 1);
      });
    }
  }

  saveEspecialidad() {
    if (!this.currentEsp.nombre.trim()) {
      this.alertService.warning('La especialidad debe tener un nombre');
      return;
    }

    if (this.editingEspIndex >= 0) {
      this.especialidades[this.editingEspIndex] = { ...this.currentEsp };
    } else {
      this.especialidades.push({ ...this.currentEsp });
    }
    
    this.closeEspModal();
  }

  deleteEspecialidad(index: number, event: Event) {
    event.stopPropagation();
    if (confirm('¿Estás seguro de que deseas eliminar esta especialidad y todas sus materias?')) {
      this.especialidades.splice(index, 1);
    }
  }

  // --- Modal Logic para Salones ---
  openSalonModal(index: number = -1) {
    if (index >= 0) {
      this.editingSalonIndex = index;
      this.currentSalon = { ...this.salones[index] };
    } else {
      this.editingSalonIndex = -1;
      this.currentSalon = { nombre: '', piso: '', capacidad: null, recursos: '' };
    }
    this.showSalonModal = true;
  }

  closeSalonModal() {
    this.showSalonModal = false;
  }

  saveSalon() {
    if (!this.currentSalon.nombre.trim()) {
      this.alertService.warning('El salón debe tener un nombre identificador');
      return;
    }

    if (this.editingSalonIndex >= 0) {
      this.salones[this.editingSalonIndex] = { ...this.currentSalon };
    } else {
      this.salones.push({ ...this.currentSalon });
    }
    
    this.closeSalonModal();
  }

  deleteSalon(index: number, event: Event) {
    event.stopPropagation();
    if (confirm('¿Estás seguro de que deseas eliminar este salón?')) {
      this.salones.splice(index, 1);
    }
  }
}
