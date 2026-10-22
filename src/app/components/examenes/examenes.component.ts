import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService, AgendaItem } from '../../data.service';
import { firstValueFrom } from 'rxjs';
import { AlertService } from '../../services/alert.service';

interface Examen {
  id?: number;
  dia: string;
  hora: string;
  examen: string;
  anio: string;
  plan: string;
  tribunal1?: string;
  tribunal2?: string;
  tribunal3?: string;
  tribunal: string[];
  salones: string;
}

@Component({
  selector: 'app-examenes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './examenes.component.html',
  styleUrl: './examenes.component.css'
})
export class ExamenesComponent implements OnInit {
  private dataService = inject(DataService);
  private alertService = inject(AlertService);

  examenes: Examen[] = [];
  filteredExamenes: Examen[] = [];
  
  // Dashboard stats
  totalExamenes = 0;
  planesCount: { [key: string]: number } = {};
  aniosCount: { [key: string]: number } = {};
  examenesHoy = 0;

  // Filters
  searchTerm = '';
  selectedPlan = '';
  selectedAnio = '';
  
  isLoading = true;
  error = '';

  // --- Catálogos institucionales para desplegables ---
  materiasList: { nombre: string; anio?: string }[] = [];
  planesList: string[] = ['2023', '2023 (Reformulación 2025)', '2008', '1986'];
  aniosList: string[] = ['1º Año', '2º Año', '3º Año', '4º Año', '1º y 2º Año', '3º y 4º Año', 'Todos los Años'];
  horasSugeridas: string[] = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '12:00',
    '13:30', '14:00', '14:30', '15:00',
    '17:30', '18:00', '18:30', '19:00'
  ];
  diasList: string[] = [];
  docentesList: string[] = [];
  salonesByPiso: { piso: string; salones: { nombre: string; capacidad?: any }[] }[] = [];
  salonesFlatList: string[] = [];

  // Modo de ingreso personalizado (true = input libre, false = select desplegable)
  customMode: { [key: string]: boolean } = {
    examen: false,
    anio: false,
    plan: false,
    dia: false,
    hora: false,
    salones: false,
    tribunal1: false,
    tribunal2: false,
    tribunal3: false
  };

  ngOnInit() {
    this.loadExamenes();
    this.loadCatalogos();
  }

  async loadCatalogos() {
    try {
      const [config, agenda] = await Promise.all([
        firstValueFrom(this.dataService.getConfiguracion()).catch(() => null),
        firstValueFrom(this.dataService.getAgendaData()).catch(() => [])
      ]);

      if (config) {
        if (Array.isArray(config.materias) && config.materias.length > 0) {
          this.materiasList = [...config.materias].sort((a, b) => a.nombre.localeCompare(b.nombre));
        }
        if (Array.isArray(config.planes) && config.planes.length > 0) {
          this.planesList = config.planes;
        }
        if (Array.isArray(config.salones) && config.salones.length > 0) {
          this.salonesFlatList = config.salones.map((s: any) => s.nombre);
          
          const pisos = config.pisos || ['Sub suelo', 'Planta baja', 'Primer piso', 'Segundo piso', 'Patio'];
          const grupos: { [key: string]: any[] } = {};
          pisos.forEach((p: string) => grupos[p] = []);

          config.salones.forEach((s: any) => {
            const pisoKey = s.piso || 'Otros';
            if (!grupos[pisoKey]) grupos[pisoKey] = [];
            grupos[pisoKey].push(s);
          });

          this.salonesByPiso = Object.keys(grupos)
            .filter(p => grupos[p].length > 0)
            .map(p => ({
              piso: p,
              salones: grupos[p].sort((a, b) => a.nombre.localeCompare(b.nombre, undefined, { numeric: true }))
            }));
        }
      }

      if (Array.isArray(agenda) && agenda.length > 0) {
        const docentesSet = new Set<string>();
        agenda.forEach((a: AgendaItem) => {
          if (a.nombre && a.nombre.trim()) docentesSet.add(a.nombre.trim());
        });
        this.docentesList = Array.from(docentesSet).sort((a, b) => a.localeCompare(b));
      }
    } catch (e) {
      console.warn('Error al cargar catálogos:', e);
    }
  }

  async loadExamenes() {
    try {
      this.isLoading = true;
      const dbData = await firstValueFrom(this.dataService.getExamenesData());
      
      this.examenes = dbData.map((row: any) => ({
        id: row.id,
        dia: row.dia || '',
        hora: row.hora || '',
        examen: row.examen || '',
        anio: row.anio || '',
        plan: row.plan || '',
        tribunal1: row.tribunal1 || '',
        tribunal2: row.tribunal2 || '',
        tribunal3: row.tribunal3 || '',
        tribunal: [row.tribunal1, row.tribunal2, row.tribunal3].filter(Boolean),
        salones: row.salones || ''
      }));
      this.filteredExamenes = this.examenes;
      
      // Extraer días existentes para sugerencias
      const diasSet = new Set<string>();
      this.examenes.forEach(ex => {
        if (ex.dia && ex.dia.trim()) diasSet.add(ex.dia.trim());
      });
      this.diasList = Array.from(diasSet).sort((a, b) => a.localeCompare(b));

      this.calculateStats();
      this.isLoading = false;
    } catch (err: any) {
      this.error = err.message;
      this.isLoading = false;
    }
  }

  calculateStats() {
    this.totalExamenes = this.examenes.length;
    this.planesCount = {};
    this.aniosCount = {};
    
    this.examenes.forEach(ex => {
      const plan = ex.plan || 'Sin plan';
      this.planesCount[plan] = (this.planesCount[plan] || 0) + 1;
      
      const anio = ex.anio || 'Sin año';
      this.aniosCount[anio] = (this.aniosCount[anio] || 0) + 1;
    });
    
    if (this.examenes.length > 0) {
      const primerDia = this.examenes[0].dia;
      this.examenesHoy = this.examenes.filter(ex => ex.dia === primerDia).length;
    }
  }

  filterExamenes() {
    this.filteredExamenes = this.examenes.filter(ex => {
      const matchesSearch = this.searchTerm === '' || 
        ex.examen.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        ex.tribunal.some(t => t.toLowerCase().includes(this.searchTerm.toLowerCase()));
        
      const matchesPlan = this.selectedPlan === '' || ex.plan === this.selectedPlan;
      const matchesAnio = this.selectedAnio === '' || ex.anio === this.selectedAnio;
      
      return matchesSearch && matchesPlan && matchesAnio;
    });
  }
  
  get groupedExamenes() {
    const groups: { [key: string]: Examen[] } = {};
    this.filteredExamenes.forEach(ex => {
      const key = ex.dia || 'Sin fecha';
      if (!groups[key]) groups[key] = [];
      groups[key].push(ex);
    });
    return groups;
  }
  
  objectKeys(obj: any) {
    return Object.keys(obj);
  }

  // --- Modal Logic ---
  showModal = false;
  isSaving = false;
  editingId: number | null = null;
  newRecord: any = {
    dia: '',
    hora: '',
    examen: '',
    anio: '',
    plan: '',
    tribunal1: '',
    tribunal2: '',
    tribunal3: '',
    salones: ''
  };

  openModal(examenToEdit?: Examen) {
    this.showModal = true;
    if (examenToEdit && examenToEdit.id) {
      this.editingId = examenToEdit.id;
      const t1 = examenToEdit.tribunal1 || (examenToEdit.tribunal && examenToEdit.tribunal[0]) || '';
      const t2 = examenToEdit.tribunal2 || (examenToEdit.tribunal && examenToEdit.tribunal[1]) || '';
      const t3 = examenToEdit.tribunal3 || (examenToEdit.tribunal && examenToEdit.tribunal[2]) || '';

      this.newRecord = {
        dia: examenToEdit.dia || '',
        hora: examenToEdit.hora || '',
        examen: examenToEdit.examen || '',
        anio: examenToEdit.anio || '',
        plan: examenToEdit.plan || '',
        tribunal1: t1,
        tribunal2: t2,
        tribunal3: t3,
        salones: examenToEdit.salones || ''
      };

      // Si el valor actual no está en el catálogo, activar modo custom automáticamente
      this.customMode = {
        examen: !!this.newRecord.examen && this.materiasList.length > 0 && !this.materiasList.some(m => m.nombre === this.newRecord.examen),
        anio: !!this.newRecord.anio && !this.aniosList.includes(this.newRecord.anio),
        plan: !!this.newRecord.plan && !this.planesList.includes(this.newRecord.plan),
        dia: !!this.newRecord.dia && this.diasList.length > 0 && !this.diasList.includes(this.newRecord.dia),
        hora: !!this.newRecord.hora && !this.horasSugeridas.includes(this.newRecord.hora),
        salones: !!this.newRecord.salones && this.salonesFlatList.length > 0 && !this.salonesFlatList.includes(this.newRecord.salones),
        tribunal1: !!t1 && this.docentesList.length > 0 && !this.docentesList.includes(t1),
        tribunal2: !!t2 && this.docentesList.length > 0 && !this.docentesList.includes(t2),
        tribunal3: !!t3 && this.docentesList.length > 0 && !this.docentesList.includes(t3)
      };
    } else {
      this.editingId = null;
      this.newRecord = {
        dia: this.diasList.length > 0 ? this.diasList[0] : '',
        hora: '08:00',
        examen: '',
        anio: '1º Año',
        plan: '2023',
        tribunal1: '',
        tribunal2: '',
        tribunal3: '',
        salones: ''
      };
      this.customMode = {
        examen: false,
        anio: false,
        plan: false,
        dia: false,
        hora: false,
        salones: false,
        tribunal1: false,
        tribunal2: false,
        tribunal3: false
      };
    }
  }

  closeModal() {
    this.showModal = false;
  }

  toggleCustom(field: string) {
    this.customMode[field] = !this.customMode[field];
  }

  onSelectCheckCustom(field: string, value: string) {
    if (value === '__custom__') {
      this.customMode[field] = true;
      this.newRecord[field] = '';
    }
  }

  onMateriaChange(selectedNombre: string) {
    if (selectedNombre === '__custom__') {
      this.customMode['examen'] = true;
      this.newRecord.examen = '';
      return;
    }
    this.newRecord.examen = selectedNombre;

    // Sugerir o auto-completar año si la asignatura lo tiene definido
    const matObj = this.materiasList.find(m => m.nombre === selectedNombre);
    if (matObj && matObj.anio && (!this.newRecord.anio || this.newRecord.anio.trim() === '')) {
      this.newRecord.anio = matObj.anio;
      if (!this.aniosList.includes(matObj.anio)) {
        this.aniosList.unshift(matObj.anio);
      }
    }
  }

  onDatePicked(isoDate: string) {
    if (!isoDate) return;
    const parts = isoDate.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      const formatted = d.toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long' });
      this.newRecord.dia = formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }
  }

  async saveRecord() {
    try {
      this.isSaving = true;

      const t1 = this.newRecord.tribunal1?.trim() || '';
      const t2 = this.newRecord.tribunal2?.trim() || '';
      const t3 = this.newRecord.tribunal3?.trim() || '';

      const payload = {
        dia: this.newRecord.dia?.trim() || '',
        hora: this.newRecord.hora?.trim() || '',
        examen: this.newRecord.examen?.trim() || '',
        anio: this.newRecord.anio?.trim() || '',
        plan: this.newRecord.plan?.trim() || '',
        tribunal1: t1,
        tribunal2: t2,
        tribunal3: t3,
        salones: this.newRecord.salones?.trim() || ''
      };

      if (!payload.examen) {
        this.alertService.warning('Debe especificar el nombre del examen o materia.');
        this.isSaving = false;
        return;
      }

      if (this.editingId) {
        await firstValueFrom(this.dataService.updateExamen(this.editingId, payload));
        this.alertService.success('Examen actualizado exitosamente');
      } else {
        await firstValueFrom(this.dataService.saveExamen(payload));
        this.alertService.success('Examen guardado exitosamente');
      }
      
      this.closeModal();
      await this.loadExamenes(); 
    } catch (e: any) {
      console.error(e);
      this.alertService.error('Error al guardar: ' + e.message);
    } finally {
      this.isSaving = false;
    }
  }

  async deleteRecord(id?: number) {
    if (!id) return;
    const confirmed = await this.alertService.confirm({
      title: 'Eliminar Mesa de Examen',
      message: '¿Estás seguro de que deseas eliminar este examen? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar examen',
      cancelText: 'Cancelar',
      type: 'danger'
    });
    if (confirmed) {
      try {
        await firstValueFrom(this.dataService.deleteExamen(id));
        this.alertService.success('Examen eliminado exitosamente');
        await this.loadExamenes();
      } catch (e: any) {
        console.error(e);
        this.alertService.error('Error al eliminar: ' + e.message);
      }
    }
  }
}
