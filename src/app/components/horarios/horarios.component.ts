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
  configMaterias: any[] = [];
  configSalones: string[] = [];
  configSalonesRaw: any[] = [];
  agendaList: any[] = [];
  materiaAniosMap: { [nombre: string]: string[] } = {};
  
  gruposAgrupados: { turno: string, grupos: string[] }[] = [];
  selectedGrupo: string = '';
  
  semestre: 'sem1' | 'sem2' = 'sem1';
  
  dias = [1, 2, 3, 4, 5];
  diasNombres = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  horas: string[] = [];
  
  // grilla[hora][dia] = Array of class objects
  grilla: { [hora: string]: { [dia: number]: any[] } } = {};
  
  clasesList: any[] = []; // Para vista móvil

  // Modos de entrada manual opcionales en el modal
  customMode: { [campo: string]: boolean } = {
    grupo: false,
    materia: false,
    docente: false,
    hora_inicio: false,
    hora_fin: false,
    salon: false
  };

  // Mapeo de módulos estándar de 45/40 min en IPA (Hora Inicio -> Hora Fin sugerida)
  private readonly moduloFinSugerido: { [inicio: string]: string } = {
    '08:00': '08:45',
    '08:45': '09:30',
    '09:30': '10:15',
    '10:25': '11:10',
    '11:10': '11:55',
    '11:55': '12:40',
    '12:40': '13:25',
    '13:25': '14:10',
    '13:30': '14:15',
    '14:10': '14:55',
    '14:15': '15:00',
    '15:00': '15:45',
    '15:55': '16:40',
    '16:30': '17:25',
    '16:40': '17:25',
    '17:25': '18:10',
    '18:00': '18:50',
    '18:10': '18:55',
    '18:20': '19:00',
    '18:30': '19:30',
    '19:00': '19:40',
    '19:40': '20:20',
    '20:20': '21:00',
    '21:00': '21:40',
    '21:40': '22:20',
    '22:20': '23:00',
    '23:00': '23:40'
  };

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
          id: row.id,
          dia: parseInt(row.dia, 10),
          hora: row.hora_inicio && row.hora_fin ? `${row.hora_inicio}-${row.hora_fin}` : row.hora_inicio || '',
          hora_inicio: row.hora_inicio,
          hora_fin: row.hora_fin,
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
      if (config.materias && Array.isArray(config.materias)) {
        this.configMaterias = config.materias;
        this.materiaAniosMap = {};
        config.materias.forEach((m: any) => {
          if (m && m.nombre) {
            this.materiaAniosMap[m.nombre] = Array.isArray(m.anios) && m.anios.length > 0
              ? m.anios
              : (m.anio ? [m.anio] : []);
          }
        });
      }
      if (config.salones && Array.isArray(config.salones)) {
         this.configSalonesRaw = config.salones;
         if (config.salones.length > 0 && typeof config.salones[0] === 'object') {
           this.configSalones = config.salones.map((s: any) => s.nombre);
         } else {
           this.configSalones = config.salones;
         }
      } else if (config.salones) {
         this.configSalones = config.salones.split('\n').filter(Boolean);
      }

      // Cargar directorio docente de Agenda para enriquecer lista desplegable de docentes
      try {
        this.agendaList = await firstValueFrom(this.dataService.getAgendaData());
      } catch {
        this.agendaList = [];
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
      const allGroups = Object.keys(this.rawData[this.selectedEsp] || {}).sort();
      
      const turnosMap: { [key: string]: string[] } = {
        'Mañana': [],
        'Tarde': [],
        'Noche': [],
        'Otros': []
      };

      allGroups.forEach(g => {
        const groupData = (this.rawData[this.selectedEsp] || {})[g];
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
  editingId: number | null = null;
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

  resetCustomModes() {
    this.customMode = {
      grupo: false,
      materia: false,
      docente: false,
      hora_inicio: false,
      hora_fin: false,
      salon: false
    };
  }

  toggleCustomField(field: string, enable: boolean) {
    this.customMode[field] = enable;
    if (enable && this.newRecord[field] === '__custom__') {
      this.newRecord[field] = '';
    }
  }

  onSelectCheckCustom(field: string, val: string) {
    if (val === '__custom__') {
      this.customMode[field] = true;
      this.newRecord[field] = '';
    }
  }

  openModal(item?: any) {
    this.showModal = true;
    this.resetCustomModes();
    if (item && item.id) {
      this.editingId = item.id;
      this.newRecord = {
        especialidad: this.selectedEsp || '',
        semestre: this.semestre,
        grupo: this.selectedGrupo || '',
        materia: item.materia || '',
        docente: item.docente || '',
        dia: item.dia ? item.dia.toString() : '1',
        hora_inicio: item.hora_inicio || '',
        hora_fin: item.hora_fin || '',
        salon: item.salon || ''
      };
    } else {
      this.editingId = null;
      const defaultEsp = this.selectedEsp || (this.configEspecialidades[0]?.nombre || this.especialidades[0] || '');
      let defaultGrupo = this.selectedGrupo || '';
      if (!defaultGrupo && defaultEsp && this.rawData[defaultEsp]) {
        const gruposEsp = Object.keys(this.rawData[defaultEsp]).sort();
        if (gruposEsp.length > 0) defaultGrupo = gruposEsp[0];
      }
      this.newRecord = {
        especialidad: defaultEsp,
        semestre: this.semestre,
        grupo: defaultGrupo,
        materia: '',
        docente: '',
        dia: '1',
        hora_inicio: '08:00',
        hora_fin: '08:45',
        salon: ''
      };
    }
  }

  onModalEspChange() {
    const esp = this.newRecord.especialidad;
    const gruposEsp = esp && this.rawData[esp] ? Object.keys(this.rawData[esp]).sort() : [];
    if (!this.customMode['grupo']) {
      if (gruposEsp.length > 0 && !gruposEsp.includes(this.newRecord.grupo)) {
        this.newRecord.grupo = gruposEsp[0];
      } else if (gruposEsp.length === 0 && !this.newRecord.grupo) {
        this.newRecord.grupo = '1°A';
      }
    }
    if (!this.customMode['materia']) {
      const validMaterias = this.getModalMateriasAgrupadas().flatMap(g => g.materias);
      if (this.newRecord.materia && !validMaterias.includes(this.newRecord.materia)) {
        this.newRecord.materia = '';
      }
    }
  }

  onModalGrupoChange(val: string) {
    if (val === '__custom__') {
      this.onSelectCheckCustom('grupo', val);
      return;
    }
  }

  onModalMateriaChange(val: string) {
    if (val === '__custom__') {
      this.onSelectCheckCustom('materia', val);
      return;
    }
    // Si la materia seleccionada ya se dicta en este mismo grupo y semestre, pre-sugerir docente y salón si están vacíos
    const esp = this.newRecord.especialidad;
    const grp = this.newRecord.grupo;
    const sem = this.newRecord.semestre || 'sem1';
    if (esp && grp && val && this.rawData[esp]?.[grp]?.[sem]) {
      const match = this.rawData[esp][grp][sem].find((c: any) => c.materia === val && (c.docente || c.salon));
      if (match) {
        if (!this.newRecord.docente && match.docente) {
          this.newRecord.docente = match.docente;
        }
        if (!this.newRecord.salon && match.salon) {
          this.newRecord.salon = match.salon;
        }
      }
    }
  }

  onModalHoraInicioChange(val: string) {
    if (val === '__custom__') {
      this.onSelectCheckCustom('hora_inicio', val);
      return;
    }
    if (val && this.moduloFinSugerido[val] && !this.customMode['hora_fin']) {
      this.newRecord.hora_fin = this.moduloFinSugerido[val];
    }
  }

  getModalEspecialidadesAgrupadas(): { label: string, items: string[] }[] {
    const cfeNames = new Set(this.configEspecialidades.map((e: any) => e.nombre));
    const carreras = this.especialidades.filter(e => cfeNames.has(e)).sort((a, b) => a.localeCompare(b, 'es'));
    const paquetes = this.especialidades.filter(e => !cfeNames.has(e)).sort((a, b) => a.localeCompare(b, 'es'));
    const groups: { label: string, items: string[] }[] = [];
    if (carreras.length > 0) {
      groups.push({ label: 'Carreras de Profesorado (Plan CFE)', items: carreras });
    }
    if (paquetes.length > 0) {
      groups.push({ label: 'Paquetes, Tronco Común y Talleres', items: paquetes });
    }
    return groups;
  }

  getModalGruposAgrupados(): { label: string, grupos: string[] }[] {
    const esp = this.newRecord.especialidad;
    const espData = (esp && this.rawData[esp]) ? this.rawData[esp] : {};
    const allGroups = Object.keys(espData).sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));

    const turnosMap: { [key: string]: string[] } = {
      'Turno Mañana': [],
      'Turno Tarde': [],
      'Turno Noche': [],
      'Otros grupos de la especialidad': []
    };

    allGroups.forEach(g => {
      const groupData = espData[g];
      const clases = [...(groupData?.sem1 || []), ...(groupData?.sem2 || [])];
      if (clases.length === 0) {
        turnosMap['Otros grupos de la especialidad'].push(g);
        return;
      }
      let earliest = '23:59';
      clases.forEach((c: any) => {
        const horaInicio = c.hora ? c.hora.split('-')[0] : null;
        if (horaInicio && horaInicio.localeCompare(earliest) < 0) {
          earliest = horaInicio;
        }
      });
      const hourPrefix = parseInt(earliest.split(':')[0], 10);
      if (hourPrefix < 13) {
        turnosMap['Turno Mañana'].push(g);
      } else if (hourPrefix < 18) {
        turnosMap['Turno Tarde'].push(g);
      } else {
        turnosMap['Turno Noche'].push(g);
      }
    });

    const result: { label: string, grupos: string[] }[] = [
      { label: 'Turno Mañana', grupos: turnosMap['Turno Mañana'] },
      { label: 'Turno Tarde', grupos: turnosMap['Turno Tarde'] },
      { label: 'Turno Noche', grupos: turnosMap['Turno Noche'] },
      { label: 'Otros grupos de la especialidad', grupos: turnosMap['Otros grupos de la especialidad'] }
    ].filter(t => t.grupos.length > 0);

    const existingSet = new Set(allGroups);
    const estandar = ['1°A', '1°B', '1°C', '1°D', '2°A', '2°B', '2°C', '3°A', '3°B', '4°A', '4°B']
      .filter(g => !existingSet.has(g));
    if (estandar.length > 0) {
      result.push({ label: 'Grupos estándar (1º a 4º Año)', grupos: estandar });
    }

    const current = this.newRecord.grupo;
    if (current && current !== '__custom__' && !existingSet.has(current) && !estandar.includes(current)) {
      result.unshift({ label: 'Grupo seleccionado', grupos: [current] });
    }

    return result;
  }

  private detectAnioFromGrupo(grupo: string): string | null {
    if (!grupo) return null;
    const m = grupo.trim().match(/^([1-4])/);
    if (!m) return null;
    return `${m[1]}º Año`;
  }

  getModalMateriasAgrupadas(): { label: string, materias: string[] }[] {
    const espName = this.newRecord.especialidad;
    const anioGrupo = this.detectAnioFromGrupo(this.newRecord.grupo);
    const espConfig = this.configEspecialidades.find(e => e.nombre === espName);
    const cfeMaterias: string[] = espConfig && Array.isArray(espConfig.materias) ? espConfig.materias : [];

    const byYear: { [anio: string]: string[] } = {
      '1º Año': [],
      '2º Año': [],
      '3º Año': [],
      '4º Año': [],
      'Otros': []
    };

    const seen = new Set<string>();
    cfeMaterias.forEach(mat => {
      seen.add(mat);
      const anios = this.materiaAniosMap[mat] || [];
      if (anios.length === 0) {
        byYear['Otros'].push(mat);
      } else {
        anios.forEach(a => {
          if (byYear[a]) {
            byYear[a].push(mat);
          } else {
            byYear['Otros'].push(mat);
          }
        });
      }
    });

    // Materias ya presentes en la grilla de esta especialidad
    const enGrillaSet = new Set<string>();
    if (espName && this.rawData[espName]) {
      Object.values(this.rawData[espName]).forEach((gData: any) => {
        [...(gData.sem1 || []), ...(gData.sem2 || [])].forEach((c: any) => {
          if (c.materia && c.materia.trim() && !seen.has(c.materia.trim())) {
            enGrillaSet.add(c.materia.trim());
          }
        });
      });
    }

    const groups: { label: string, materias: string[] }[] = [];
    const orderedYears = ['1º Año', '2º Año', '3º Año', '4º Año'];

    // Si el grupo indica un año (ej: 1°A -> 1º Año), priorizar ese año arriba del todo
    if (anioGrupo && byYear[anioGrupo] && byYear[anioGrupo].length > 0) {
      groups.push({
        label: `Unidades Curriculares de ${anioGrupo} (${espName})`,
        materias: byYear[anioGrupo]
      });
    }

    orderedYears.forEach(yr => {
      if (yr === anioGrupo) return;
      if (byYear[yr] && byYear[yr].length > 0) {
        groups.push({
          label: `Unidades Curriculares de ${yr}`,
          materias: byYear[yr]
        });
      }
    });

    if (byYear['Otros'].length > 0) {
      groups.push({ label: 'Otras Unidades Curriculares del Plan', materias: byYear['Otros'] });
    }

    if (enGrillaSet.size > 0) {
      groups.push({
        label: cfeMaterias.length > 0 ? 'Otras denominaciones en grilla actual' : `Materias de ${espName}`,
        materias: Array.from(enGrillaSet).sort((a, b) => a.localeCompare(b, 'es'))
      });
    }

    // Si es un paquete/espacio sin malla específica y hay catálogo global
    if (cfeMaterias.length === 0 && this.configMaterias.length > 0) {
      const globalNames = this.configMaterias
        .map((m: any) => m.nombre)
        .filter((n: string) => n && !enGrillaSet.has(n))
        .sort((a: string, b: string) => a.localeCompare(b, 'es'));
      if (globalNames.length > 0) {
        groups.push({ label: 'Catálogo General de Unidades Curriculares (CFE)', materias: globalNames });
      }
    }

    const current = this.newRecord.materia;
    const allIncluded = new Set(groups.flatMap(g => g.materias));
    if (current && current !== '__custom__' && !allIncluded.has(current)) {
      groups.unshift({ label: 'Materia actual', materias: [current] });
    }

    return groups;
  }

  private isCleanTeacherName(name: string): boolean {
    if (!name) return false;
    const t = name.trim();
    if (t.length < 3 || t.length > 55) return false;
    if (/^[(\d+\/]/.test(t)) return false;
    if (/\b(HORA|SAL[OÓ]N|SALA\s+DE|LAB|A\s+PARTIR|SOLO\s+\d|GRUPO)\b/i.test(t)) return false;
    return /^[A-ZÁÉÍÓÚÑ]/i.test(t);
  }

  getModalDocentesAgrupados(): { label: string, docentes: string[] }[] {
    const espName = this.newRecord.especialidad;
    const matName = (this.newRecord.materia || '').toLowerCase();

    const sugeridosSet = new Set<string>();
    const todosSet = new Set<string>();

    // 1. Docentes de la especialidad actual en la grilla
    if (espName && this.rawData[espName]) {
      Object.values(this.rawData[espName]).forEach((gData: any) => {
        [...(gData.sem1 || []), ...(gData.sem2 || [])].forEach((c: any) => {
          if (c.docente && this.isCleanTeacherName(c.docente)) {
            const d = c.docente.trim();
            sugeridosSet.add(d);
          }
        });
      });
    }

    // 2. Docentes de Agenda
    this.agendaList.forEach((item: any) => {
      if (!item || !item.nombre) return;
      const nombre = item.nombre.trim();
      if (!this.isCleanTeacherName(nombre)) return;

      const asigs: string[] = Array.isArray(item.asignaturas) ? item.asignaturas : [];
      const esps: string[] = Array.isArray(item.especialidades) ? item.especialidades : [];

      const matchesMat = matName && asigs.some(a => a.toLowerCase().includes(matName) || matName.includes(a.toLowerCase()));
      const matchesEsp = espName && esps.some(e => e.toLowerCase() === espName.toLowerCase());

      if (matchesMat || matchesEsp) {
        sugeridosSet.add(nombre);
      } else {
        todosSet.add(nombre);
      }
    });

    // 3. Resto de docentes en horarios globales
    Object.values(this.rawData).forEach((espObj: any) => {
      Object.values(espObj).forEach((gData: any) => {
        [...(gData.sem1 || []), ...(gData.sem2 || [])].forEach((c: any) => {
          if (c.docente && this.isCleanTeacherName(c.docente)) {
            const d = c.docente.trim();
            if (!sugeridosSet.has(d)) {
              todosSet.add(d);
            }
          }
        });
      });
    });

    const groups: { label: string, docentes: string[] }[] = [];
    const current = this.newRecord.docente;
    if (current && current !== '__custom__' && !sugeridosSet.has(current) && !todosSet.has(current)) {
      groups.push({ label: 'Docente asignado actualmente', docentes: [current] });
    }
    if (sugeridosSet.size > 0) {
      groups.push({
        label: `Docentes de ${espName || 'la especialidad / materia'}`,
        docentes: Array.from(sugeridosSet).sort((a, b) => a.localeCompare(b, 'es'))
      });
    }
    if (todosSet.size > 0) {
      groups.push({
        label: 'Directorio General de Docentes (IPA)',
        docentes: Array.from(todosSet).sort((a, b) => a.localeCompare(b, 'es'))
      });
    }
    return groups;
  }

  getModalHorasInicioAgrupadas(): { label: string, horas: string[] }[] {
    const matutino = ['08:00', '08:45', '09:30', '10:25', '11:10', '11:55', '12:40'];
    const vespertino = ['13:25', '13:30', '14:10', '14:15', '15:00', '15:55', '16:30', '16:40', '17:25', '18:00', '18:10', '18:20'];
    const nocturno = ['18:30', '19:00', '19:40', '20:20', '21:00', '21:40', '22:20', '23:00'];

    const groups: { label: string, horas: string[] }[] = [
      { label: 'Turno Matutino', horas: matutino },
      { label: 'Turno Intermedio / Vespertino', horas: vespertino },
      { label: 'Turno Nocturno', horas: nocturno }
    ];

    const allKnown = new Set([...matutino, ...vespertino, ...nocturno]);
    const current = this.newRecord.hora_inicio;
    if (current && current !== '__custom__' && !allKnown.has(current)) {
      groups.unshift({ label: 'Hora actual', horas: [current] });
    }
    return groups;
  }

  getModalHorasFinAgrupadas(): { label: string, horas: string[] }[] {
    const matutino = ['08:45', '09:30', '10:15', '11:00', '11:10', '11:55', '12:40', '13:25'];
    const vespertino = ['14:10', '14:15', '14:55', '15:00', '15:45', '16:30', '16:40', '17:25', '18:00', '18:10', '18:50', '18:55', '19:00'];
    const nocturno = ['19:30', '19:40', '20:20', '20:45', '21:00', '21:40', '22:20', '22:30', '23:00', '23:40'];

    const groups: { label: string, horas: string[] }[] = [
      { label: 'Turno Matutino', horas: matutino },
      { label: 'Turno Intermedio / Vespertino', horas: vespertino },
      { label: 'Turno Nocturno', horas: nocturno }
    ];

    const allKnown = new Set([...matutino, ...vespertino, ...nocturno]);
    const current = this.newRecord.hora_fin;
    if (current && current !== '__custom__' && !allKnown.has(current)) {
      groups.unshift({ label: 'Hora actual', horas: [current] });
    }
    return groups;
  }

  getModalSalonesAgrupados(): { label: string, salones: string[] }[] {
    const espName = this.newRecord.especialidad;
    const habitualesSet = new Set<string>();

    if (espName && this.rawData[espName]) {
      Object.values(this.rawData[espName]).forEach((gData: any) => {
        [...(gData.sem1 || []), ...(gData.sem2 || [])].forEach((c: any) => {
          if (c.salon && c.salon.trim()) {
            habitualesSet.add(c.salon.trim());
          }
        });
      });
    }

    const laboratorios = [
      'LAB BIOL 1', 'LAB BIOL 2',
      'LAB FIS 1', 'LAB FIS 2', 'LAB FIS 3',
      'LAB QUIM 1', 'LAB QUIM 2', 'LAB QUIM 3',
      'LABORATORIO 1', 'LABORATORIO 2', 'LAB 2', 'LAB 3',
      'SALON LEXO', '001 Audiovisual', '101 Fotoco', '109 Info'
    ];

    const salonesPlantaBaja: string[] = [];
    const salonesPrimerPiso: string[] = [];
    const salonesSegundoPiso: string[] = [];
    const otrosSalones: string[] = [];

    // Combinar salones de configuración y salones limpios de horarios
    const todosSalonesSet = new Set<string>(this.configSalones);
    Object.values(this.rawData).forEach((espObj: any) => {
      Object.values(espObj).forEach((gData: any) => {
        [...(gData.sem1 || []), ...(gData.sem2 || [])].forEach((c: any) => {
          if (c.salon && c.salon.trim() && !c.salon.includes('/')) {
            todosSalonesSet.add(c.salon.trim());
          }
        });
      });
    });

    const labSet = new Set(laboratorios);
    Array.from(todosSalonesSet)
      .filter(s => !labSet.has(s))
      .sort((a, b) => a.localeCompare(b, 'es', { numeric: true }))
      .forEach(s => {
        const numMatch = s.match(/(\d+)/);
        if (numMatch) {
          const n = parseInt(numMatch[1], 10);
          if (n < 100) salonesPlantaBaja.push(s);
          else if (n < 200) salonesPrimerPiso.push(s);
          else salonesSegundoPiso.push(s);
        } else {
          otrosSalones.push(s);
        }
      });

    const groups: { label: string, salones: string[] }[] = [];
    const current = this.newRecord.salon;
    const allKnown = new Set([
      ...habitualesSet,
      ...laboratorios,
      ...salonesPlantaBaja,
      ...salonesPrimerPiso,
      ...salonesSegundoPiso,
      ...otrosSalones
    ]);

    if (current && current !== '__custom__' && !allKnown.has(current)) {
      groups.push({ label: 'Salón actual', salones: [current] });
    }
    if (habitualesSet.size > 0) {
      groups.push({
        label: `Salones usados en ${espName}`,
        salones: Array.from(habitualesSet).sort((a, b) => a.localeCompare(b, 'es', { numeric: true }))
      });
    }
    groups.push({ label: 'Laboratorios y Espacios Especiales', salones: laboratorios });
    if (salonesPlantaBaja.length > 0) {
      groups.push({ label: 'Salones Planta Baja / Subsuelo (1 al 14)', salones: salonesPlantaBaja });
    }
    if (salonesPrimerPiso.length > 0) {
      groups.push({ label: 'Salones Primer Piso (102 al 116)', salones: salonesPrimerPiso });
    }
    if (salonesSegundoPiso.length > 0) {
      groups.push({ label: 'Salones Segundo Piso (201 al 230)', salones: salonesSegundoPiso });
    }
    if (otrosSalones.length > 0) {
      groups.push({ label: 'Otros Espacios', salones: otrosSalones });
    }

    return groups;
  }

  closeModal() {
    this.showModal = false;
  }

  private alertService = inject(AlertService);

  async saveRecord() {
    try {
      this.isSaving = true;
      const targetEsp = this.newRecord.especialidad || this.selectedEsp;
      const targetGrupo = this.newRecord.grupo || this.selectedGrupo;
      if (this.editingId) {
        await firstValueFrom(this.dataService.updateHorario(this.editingId, this.newRecord));
        this.alertService.success('Horario actualizado exitosamente');
      } else {
        await firstValueFrom(this.dataService.saveHorario(this.newRecord));
        this.alertService.success('Horario guardado exitosamente');
      }
      
      this.closeModal();
      await this.loadData();
      if (targetEsp) {
        this.selectedEsp = targetEsp;
        this.onEspChange();
        if (targetGrupo) {
          this.selectedGrupo = targetGrupo;
          this.updateGrilla();
        }
      }
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
      title: 'Eliminar Horario',
      message: '¿Estás seguro de que deseas eliminar este horario? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar horario',
      cancelText: 'Cancelar',
      type: 'danger'
    });
    if (confirmed) {
      try {
        await firstValueFrom(this.dataService.deleteHorario(id));
        this.alertService.success('Horario eliminado exitosamente');
        await this.loadData();
        if (this.selectedEsp) this.onEspChange();
      } catch (e: any) {
        console.error(e);
        this.alertService.error('Error al eliminar: ' + e.message);
      }
    }
  }
}
