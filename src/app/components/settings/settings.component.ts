import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../data.service';
import { AlertService } from '../../services/alert.service';
import { firstValueFrom } from 'rxjs';

export interface Especialidad {
  nombre: string;
  materias: string[];
}

export interface MateriaGlobal {
  nombre: string;
  anios: string[];
  anio?: string;
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
export class SettingsComponent implements OnInit, OnDestroy {
  private dataService = inject(DataService);
  private alertService = inject(AlertService);

  isLoading = true;
  isSaving = false;
  autoSaveStatus: 'idle' | 'pending' | 'saving' | 'saved' | 'error' = 'idle';
  lastSavedTime: string = '';
  private autoSaveTimeout: any = null;

  activeTab = 'general';

  config = {
    anoLectivo: '2026',
    semestreActual: 'sem1',
    planes: '',
    causales: '',
    pisos: 'Sub suelo\nPlanta baja\nPrimer piso\nSegundo piso'
  };

  opcionesAniosBase: string[] = [
    '1º Año',
    '2º Año',
    '3º Año',
    '4º Año'
  ];

  filtroAnioTab: string = 'Todos';

  especialidades: Especialidad[] = [];
  salones: Salon[] = [];
  materiasGlobales: MateriaGlobal[] = [];

  // Modal State para Especialidades
  showEspecialidadModal = false;
  editingEspIndex: number = -1;
  currentEsp: Especialidad = { nombre: '', materias: [] };
  newMateria: string = '';
  filtroMateriaEsp: string = '';

  // Modal State para Materias Globales
  showMateriaModal = false;
  editingMateriaIndex: number = -1;
  currentMateria: MateriaGlobal = {
    nombre: '',
    anios: [...this.opcionesAniosBase],
    anio: 'Todos los años'
  };

  // Modal State para Salones
  showSalonModal = false;
  editingSalonIndex: number = -1;
  currentSalon: Salon = { nombre: '', piso: '', capacidad: null, recursos: '' };

  async ngOnInit() {
    await this.loadConfig();
  }

  ngOnDestroy() {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
      this.autoSaveTimeout = null;
      this.saveConfig(true);
    }
  }

  normalizeAnios(rawAnios?: string[], rawAnioStr?: string): string[] {
    if (Array.isArray(rawAnios) && rawAnios.length > 0) {
      return this.opcionesAniosBase.filter(a => rawAnios.includes(a));
    }
    if (rawAnioStr && rawAnioStr !== 'Todos los años') {
      const matched = this.opcionesAniosBase.filter(a => rawAnioStr.includes(a.replace(' Año', '')));
      if (matched.length > 0) return matched;
    }
    return [...this.opcionesAniosBase];
  }

  formatAnios(anios: string[]): string {
    if (!anios || anios.length === 0 || anios.length === this.opcionesAniosBase.length) {
      return 'Todos los años';
    }
    if (anios.length === 1) {
      return anios[0];
    }
    const ordenados = this.opcionesAniosBase.filter(a => anios.includes(a));
    const numeros = ordenados.map(a => a.replace(' Año', ''));
    const ult = numeros.pop();
    return `${numeros.join(', ')} y ${ult} Año`;
  }

  isTodosLosAnios(anios: string[]): boolean {
    return Boolean(anios && anios.length === this.opcionesAniosBase.length);
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

      if (res.materias && Array.isArray(res.materias)) {
        this.materiasGlobales = res.materias.map((m: any) => {
          if (typeof m === 'string') {
            return {
              nombre: m,
              anios: [...this.opcionesAniosBase],
              anio: 'Todos los años'
            };
          }
          const aniosNorm = this.normalizeAnios(m.anios, m.anio);
          return {
            nombre: m.nombre || '',
            anios: aniosNorm,
            anio: this.formatAnios(aniosNorm)
          };
        }).filter((m: MateriaGlobal) => Boolean(m.nombre));
      } else {
        const matSet = new Set<string>();
        if (this.especialidades) {
          this.especialidades.forEach(e => {
            if (e.materias) e.materias.forEach(m => matSet.add(m));
          });
        }
        this.materiasGlobales = Array.from(matSet).map(nombre => ({
          nombre,
          anios: [...this.opcionesAniosBase],
          anio: 'Todos los años'
        }));
      }
      
      if (res.planes) this.config.planes = Array.isArray(res.planes) ? res.planes.join('\n') : res.planes;
      if (res.causales) this.config.causales = Array.isArray(res.causales) ? res.causales.join('\n') : res.causales;
      if (res.pisos) this.config.pisos = Array.isArray(res.pisos) ? res.pisos.join('\n') : res.pisos;
      
      this.sortData();
    } catch (e: any) {
      this.alertService.error('Error al cargar configuración: ' + e.message);
    } finally {
      this.isLoading = false;
    }
  }

  sortData() {
    this.materiasGlobales.sort((a, b) => a.nombre.localeCompare(b.nombre));
    this.especialidades.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  get opcionesPisos(): string[] {
    return this.config.pisos.split('\n').map(s => s.trim()).filter(Boolean);
  }

  /**
   * Dispara autoguardado con debounce (ideal para inputs de texto y textareas en General)
   */
  onConfigFieldChange() {
    this.autoSaveStatus = 'pending';
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }
    this.autoSaveTimeout = setTimeout(() => {
      this.autoSaveTimeout = null;
      this.saveConfig(true);
    }, 700);
  }

  /**
   * Guarda toda la configuración en el backend.
   * @param isAutoSave Si es true, actualiza el indicador de autoguardado; solo muestra toast si se pasa customToastMessage.
   * @param customToastMessage Mensaje opcional para mostrar en toast tras un autoguardado de modal.
   */
  async saveConfig(isAutoSave: boolean = false, customToastMessage?: string) {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
      this.autoSaveTimeout = null;
    }

    try {
      this.isSaving = true;
      this.autoSaveStatus = 'saving';
      
      // Parse textareas back to arrays
      const payload = {
        anoLectivo: this.config.anoLectivo,
        semestreActual: this.config.semestreActual,
        especialidades: this.especialidades,
        salones: this.salones,
        planes: this.config.planes.split('\n').map(s => s.trim()).filter(Boolean),
        causales: this.config.causales.split('\n').map(s => s.trim()).filter(Boolean),
        pisos: this.config.pisos.split('\n').map(s => s.trim()).filter(Boolean),
        materias: this.materiasGlobales
      };

      await firstValueFrom(this.dataService.saveConfiguracion(payload));
      
      const now = new Date();
      this.lastSavedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      this.autoSaveStatus = 'saved';

      if (!isAutoSave) {
        this.alertService.success('Configuración del sistema guardada con éxito');
      } else if (customToastMessage) {
        this.alertService.success(customToastMessage, 2500);
      }
    } catch (e: any) {
      console.error(e);
      this.autoSaveStatus = 'error';
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

  toggleMateriaEnEsp(matNombre: string) {
    const idx = this.currentEsp.materias.indexOf(matNombre);
    if (idx !== -1) {
      this.currentEsp.materias.splice(idx, 1);
    } else {
      this.currentEsp.materias.push(matNombre);
    }
  }

  get materiasFiltradas(): MateriaGlobal[] {
    if (!this.filtroMateriaEsp) return this.materiasGlobales;
    const term = this.filtroMateriaEsp.toLowerCase();
    return this.materiasGlobales.filter(m =>
      m.nombre.toLowerCase().includes(term) ||
      (m.anio && m.anio.toLowerCase().includes(term)) ||
      (m.anios && m.anios.some(a => a.toLowerCase().includes(term)))
    );
  }

  // --- Modal Logic para Materias Globales ---
  openMateriaModal(index: number = -1) {
    if (index >= 0) {
      this.editingMateriaIndex = index;
      const mat = this.materiasGlobales[index];
      const anios = this.normalizeAnios(mat.anios, mat.anio);
      this.currentMateria = {
        nombre: mat.nombre,
        anios: [...anios],
        anio: this.formatAnios(anios)
      };
    } else {
      this.editingMateriaIndex = -1;
      this.currentMateria = {
        nombre: '',
        anios: [...this.opcionesAniosBase],
        anio: 'Todos los años'
      };
    }
    this.showMateriaModal = true;
  }

  closeMateriaModal() {
    this.showMateriaModal = false;
  }

  toggleAnioMateria(anio: string) {
    const idx = this.currentMateria.anios.indexOf(anio);
    if (idx !== -1) {
      this.currentMateria.anios.splice(idx, 1);
    } else {
      this.currentMateria.anios.push(anio);
      this.currentMateria.anios = this.opcionesAniosBase.filter(a => this.currentMateria.anios.includes(a));
    }
    this.currentMateria.anio = this.formatAnios(this.currentMateria.anios);
  }

  toggleTodosLosAniosMateria() {
    if (this.isTodosLosAnios(this.currentMateria.anios)) {
      this.currentMateria.anios = [];
    } else {
      this.currentMateria.anios = [...this.opcionesAniosBase];
    }
    this.currentMateria.anio = this.formatAnios(this.currentMateria.anios);
  }

  async saveMateriaGlobal() {
    const val = this.currentMateria.nombre.trim();
    if (!val) {
      this.alertService.warning('La materia debe tener un nombre');
      return;
    }

    if (!this.currentMateria.anios || this.currentMateria.anios.length === 0) {
      this.alertService.warning('Selecciona al menos un año para la materia');
      return;
    }

    const aniosOrdenados = this.opcionesAniosBase.filter(a => this.currentMateria.anios.includes(a));
    const anioLabel = this.formatAnios(aniosOrdenados);

    const duplicate = this.materiasGlobales.some(
      (m, idx) => idx !== this.editingMateriaIndex && m.nombre.toLowerCase() === val.toLowerCase()
    );

    if (duplicate) {
      this.alertService.warning('Ya existe una materia con ese nombre');
      return;
    }

    const isEdit = this.editingMateriaIndex >= 0;

    if (isEdit) {
      const oldName = this.materiasGlobales[this.editingMateriaIndex].nombre;
      this.materiasGlobales[this.editingMateriaIndex] = {
        nombre: val,
        anios: aniosOrdenados,
        anio: anioLabel
      };

      // Si cambió el nombre, actualizar referencias en las especialidades
      if (oldName !== val) {
        this.especialidades.forEach(esp => {
          const idx = esp.materias.indexOf(oldName);
          if (idx !== -1) {
            esp.materias[idx] = val;
          }
        });
      }
    } else {
      this.materiasGlobales.push({
        nombre: val,
        anios: aniosOrdenados,
        anio: anioLabel
      });
    }

    this.sortData();
    this.closeMateriaModal();
    await this.saveConfig(true, isEdit ? 'Materia actualizada y guardada' : 'Materia agregada y guardada');
  }

  async removeMateriaGlobal(index: number, event?: Event) {
    if (event) event.stopPropagation();
    const mat = this.materiasGlobales[index];
    const confirmed = await this.alertService.confirm({
      title: 'Eliminar Materia',
      message: `¿Eliminar la materia "${mat.nombre}"? Se quitará también de las especialidades que la usen.`,
      confirmText: 'Eliminar materia',
      cancelText: 'Cancelar',
      type: 'danger'
    });
    if (confirmed) {
      this.materiasGlobales.splice(index, 1);
      this.especialidades.forEach(esp => {
        const idx = esp.materias.indexOf(mat.nombre);
        if (idx !== -1) esp.materias.splice(idx, 1);
      });
      await this.saveConfig(true, 'Materia eliminada y cambios guardados');
    }
  }

  getGruposAniosMaterias(): string[] {
    return ['1º Año', '2º Año', '3º Año', '4º Año', 'Varios años', 'Todos los años'];
  }

  getMateriasByGrupoAnio(grupo: string) {
    return this.materiasGlobales
      .map((materia, index) => ({ materia, index }))
      .filter(item => {
        const anios = item.materia.anios || this.opcionesAniosBase;
        if (this.filtroAnioTab !== 'Todos' && !anios.includes(this.filtroAnioTab)) {
          return false;
        }
        if (grupo === 'Todos los años') {
          return anios.length === this.opcionesAniosBase.length;
        }
        if (grupo === 'Varios años') {
          return anios.length > 1 && anios.length < this.opcionesAniosBase.length;
        }
        return anios.length === 1 && anios[0] === grupo;
      });
  }

  async saveEspecialidad() {
    if (!this.currentEsp.nombre.trim()) {
      this.alertService.warning('La especialidad debe tener un nombre');
      return;
    }

    const isEdit = this.editingEspIndex >= 0;
    if (isEdit) {
      this.especialidades[this.editingEspIndex] = { ...this.currentEsp };
    } else {
      this.especialidades.push({ ...this.currentEsp });
    }
    
    this.sortData();
    this.closeEspModal();
    await this.saveConfig(true, isEdit ? 'Especialidad actualizada y guardada' : 'Especialidad creada y guardada');
  }

  async deleteEspecialidad(index: number, event: Event) {
    event.stopPropagation();
    const esp = this.especialidades[index];
    const confirmed = await this.alertService.confirm({
      title: 'Eliminar Especialidad',
      message: `¿Estás seguro de que deseas eliminar la especialidad "${esp.nombre}" y desvincular todas sus materias?`,
      confirmText: 'Eliminar especialidad',
      cancelText: 'Cancelar',
      type: 'danger'
    });
    if (confirmed) {
      this.especialidades.splice(index, 1);
      await this.saveConfig(true, 'Especialidad eliminada y cambios guardados');
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

  async saveSalon() {
    if (!this.currentSalon.nombre.trim()) {
      this.alertService.warning('El salón debe tener un nombre identificador');
      return;
    }

    const isEdit = this.editingSalonIndex >= 0;
    if (isEdit) {
      this.salones[this.editingSalonIndex] = { ...this.currentSalon };
    } else {
      this.salones.push({ ...this.currentSalon });
    }
    
    this.closeSalonModal();
    await this.saveConfig(true, isEdit ? 'Salón actualizado y guardado' : 'Salón creado y guardado');
  }

  async deleteSalon(index: number, event: Event) {
    event.stopPropagation();
    const salon = this.salones[index];
    const confirmed = await this.alertService.confirm({
      title: 'Eliminar Salón',
      message: `¿Estás seguro de que deseas eliminar el salón "${salon.nombre}"?`,
      confirmText: 'Eliminar salón',
      cancelText: 'Cancelar',
      type: 'danger'
    });
    if (confirmed) {
      this.salones.splice(index, 1);
      await this.saveConfig(true, 'Salón eliminado y cambios guardados');
    }
  }

  getPisosUnicos(): string[] {
    const todosLosPisos = new Set(this.salones.map(s => s.piso || 'Sin Asignar'));
    const resultado = [...this.opcionesPisos];
    todosLosPisos.forEach(p => {
      if (!resultado.includes(p)) resultado.push(p);
    });
    if (todosLosPisos.has('Sin Asignar') && !resultado.includes('Sin Asignar')) {
       resultado.push('Sin Asignar');
    }
    return resultado;
  }

  getSalonesByPiso(piso: string) {
    if (piso === 'Sin Asignar') {
      return this.salones.map((s, index) => ({ salon: s, index })).filter(item => !item.salon.piso);
    }
    return this.salones.map((s, index) => ({ salon: s, index })).filter(item => item.salon.piso === piso);
  }
}
