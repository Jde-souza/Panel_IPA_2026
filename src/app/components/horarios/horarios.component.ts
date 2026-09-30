import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../data.service';
import { firstValueFrom } from 'rxjs';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-horarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './horarios.component.html'
})
export class HorariosComponent implements OnInit {
  private dataService = inject(DataService);

  isLoading = true;
  error = '';
  
  rawData: any = {};
  
  especialidades: string[] = [];
  selectedEsp: string = '';
  
  configEspecialidades: any[] = [];
  configSalones: string[] = [];
  
  gruposAgrupados: { turno: string, grupos: string[] }[] = [];
  selectedGrupo: string = '';
  
  semestre: 'sem1' | 'sem2' = 'sem1';
  
  dias = [1, 2, 3, 4, 5];
  diasNombres = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  horas: string[] = [];
  
  // grilla[hora][dia] = Array of class objects
  grilla: { [hora: string]: { [dia: number]: any[] } } = {};
  
  clasesList: any[] = []; // Para vista móvil

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    try {
      this.isLoading = true;
      const flatData = await firstValueFrom(this.dataService.getHorariosData());
      
      // Reconstruir la estructura esperada: rawData[especialidad][grupo][semestre] = []
      this.rawData = {};
      for (const row of flatData) {
        if (!this.rawData[row.especialidad]) {
          this.rawData[row.especialidad] = {};
        }
        if (!this.rawData[row.especialidad][row.grupo]) {
          this.rawData[row.especialidad][row.grupo] = { sem1: [], sem2: [] };
        }
        
        // El semestre viene como 'sem1' o 'sem2'
        const s = row.semestre || 'sem1';
        if (!this.rawData[row.especialidad][row.grupo][s]) {
           this.rawData[row.especialidad][row.grupo][s] = [];
        }
        
        this.rawData[row.especialidad][row.grupo][s].push({
          dia: parseInt(row.dia, 10),
          hora: row.hora_inicio && row.hora_fin ? `${row.hora_inicio}-${row.hora_fin}` : row.hora_inicio || '',
          materia: row.materia,
          docente: row.docente,
          salon: row.salon
        });
      }
      
      this.especialidades = Object.keys(this.rawData).sort();

      // Load Config for form dropdowns
      const config = await firstValueFrom(this.dataService.getConfiguracion());
      if (config.especialidades && Array.isArray(config.especialidades)) {
        this.configEspecialidades = config.especialidades;
        // Merge with existing ones if not present
        config.especialidades.forEach((e: any) => {
          if (!this.especialidades.includes(e.nombre)) {
            this.especialidades.push(e.nombre);
          }
        });
        this.especialidades.sort();
      }
      if (config.salones && Array.isArray(config.salones)) {
         if (config.salones.length > 0 && typeof config.salones[0] === 'object') {
           this.configSalones = config.salones.map((s: any) => s.nombre);
         } else {
           this.configSalones = config.salones;
         }
      } else if (config.salones) {
         this.configSalones = config.salones.split('\n').filter(Boolean);
      }

    } catch (e: any) {
      this.error = e.message;
      console.error('Error conectando al backend en localhost:3000', e);
    } finally {
      this.isLoading = false;
    }
  }

  onEspChange() {
    this.selectedGrupo = '';
    if (this.selectedEsp) {
      const allGroups = Object.keys(this.rawData[this.selectedEsp]).sort();
      
      const turnosMap: { [key: string]: string[] } = {
        'Mañana': [],
        'Tarde': [],
        'Noche': [],
        'Otros': []
      };

      allGroups.forEach(g => {
        const groupData = this.rawData[this.selectedEsp][g];
        // Collect all hours to determine shift
        const clases = [...(groupData.sem1 || []), ...(groupData.sem2 || [])];
        if (clases.length === 0) {
           turnosMap['Otros'].push(g);
           return;
        }
        
        // Find earliest hour
        let earliest = '23:59';
        clases.forEach((c: any) => {
          // Extraer la primera parte de la hora (ej: "08:00" de "08:00-08:45")
          const horaInicio = c.hora ? c.hora.split('-')[0] : null;
          if (horaInicio && horaInicio.localeCompare(earliest) < 0) {
            earliest = horaInicio;
          }
        });
        
        const hourPrefix = parseInt(earliest.split(':')[0], 10);
        
        if (hourPrefix < 13) {
          turnosMap['Mañana'].push(g);
        } else if (hourPrefix < 18) {
          turnosMap['Tarde'].push(g);
        } else {
          turnosMap['Noche'].push(g);
        }
      });
      
      this.gruposAgrupados = [
        { turno: 'Mañana', grupos: turnosMap['Mañana'] },
        { turno: 'Tarde', grupos: turnosMap['Tarde'] },
        { turno: 'Noche', grupos: turnosMap['Noche'] },
        { turno: 'Otros', grupos: turnosMap['Otros'] }
      ].filter(t => t.grupos.length > 0);
      
    } else {
      this.gruposAgrupados = [];
    }
    this.updateGrilla();
  }
  
  onGrupoChange() {
    this.updateGrilla();
  }
  
  onSemestreChange(sem: 'sem1' | 'sem2') {
    this.semestre = sem;
    this.updateGrilla();
  }
  
  updateGrilla() {
    this.horas = [];
    this.grilla = {};
    this.clasesList = [];
    
    if (!this.selectedEsp || !this.selectedGrupo) return;
    
    const groupData = this.rawData[this.selectedEsp][this.selectedGrupo];
    if (!groupData) return;

    const clases = groupData[this.semestre] || [];
    
    // Lista ordenada para vista móvil
    this.clasesList = [...clases].sort((a: any, b: any) => {
      if (a.dia !== b.dia) return a.dia - b.dia;
      return (a.hora || '').localeCompare(b.hora || '');
    });

    const horasSet = new Set<string>();
    clases.forEach((c: any) => {
      if (c.hora) horasSet.add(c.hora);
    });
    
    this.horas = Array.from(horasSet).sort();
    
    this.horas.forEach(h => {
      this.grilla[h] = {};
      this.dias.forEach(d => {
        this.grilla[h][d] = clases.filter((c: any) => c.hora === h && c.dia === d);
      });
    });
  }
  
  formatInfo(info: string): string[] {
    return info ? info.split('\n').filter(l => l.trim() !== '') : [];
  }

  getClasesForDay(dia: number): any[] {
    return this.clasesList.filter(c => c.dia === dia);
  }

  // --- Modal Logic ---
  showModal = false;
  isSaving = false;
  newRecord: any = {
    especialidad: '',
    semestre: 'sem1',
    grupo: '',
    materia: '',
    docente: '',
    dia: '1',
    hora_inicio: '',
    hora_fin: '',
    salon: ''
  };

  openModal() {
    this.showModal = true;
    this.newRecord = {
      especialidad: this.selectedEsp || '',
      semestre: this.semestre,
      grupo: this.selectedGrupo || '',
      materia: '', docente: '', dia: '1', hora_inicio: '', hora_fin: '', salon: ''
    };
  }

  getMateriasForNewRecord(): string[] {
    if (!this.newRecord.especialidad) return [];
    const esp = this.configEspecialidades.find(e => e.nombre === this.newRecord.especialidad);
    return esp ? esp.materias : [];
  }

  closeModal() {
    this.showModal = false;
  }

  private alertService = inject(AlertService);

  async saveRecord() {
    try {
      this.isSaving = true;
      await firstValueFrom(this.dataService.saveHorario(this.newRecord));
      
      this.closeModal();
      this.alertService.success('Horario guardado exitosamente');
      await this.loadData();
      if (this.selectedEsp) this.onEspChange();
    } catch (e: any) {
      console.error(e);
      this.alertService.error('Error al guardar: ' + e.message);
    } finally {
      this.isSaving = false;
    }
  }
}
