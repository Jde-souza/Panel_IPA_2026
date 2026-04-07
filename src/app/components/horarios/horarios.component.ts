import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DataService, HorariosRoot, HorarioClase } from '../../data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface SalonStatus {
  nombre: string;
  libre: boolean;
  claseActual: { materia: string; hora: string; fin: string } | null;
  proximaClase: { materia: string; hora: string } | null;
  minutosRestantes: number;
}

@Component({
  selector: 'app-horarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './horarios.component.html',
  styleUrl: './horarios.component.css'
})
export class HorariosComponent implements OnInit {
  private dataService = inject(DataService);
  
  allHorarios = signal<HorariosRoot>({});
  viewMode = signal<'grupo' | 'salon' | 'actividad'>('grupo');
  semestre = signal<number>(1);
  especialidad = signal<string>('');
  grupo = signal<string>('');
  salonSeleccionado = signal<string>('');
  searchSalon = signal<string>('');
  statusFilter = signal<'todos' | 'libres' | 'ocupados'>('todos');
  turno = signal<string>('');

  especialidades = computed(() => Object.keys(this.allHorarios()));
  
  salones = computed(() => {
    const data = this.allHorarios();
    const uniqueSalones = new Set<string>();

    Object.values(data).forEach(esp => {
      Object.values(esp).forEach(g => {
        // Extraer de ambos semestres para tener la lista completa del IPA
        const semKeys: ('sem1' | 'sem2')[] = ['sem1', 'sem2'];
        semKeys.forEach(semKey => {
          if (g[semKey]) {
            g[semKey].forEach((c: HorarioClase) => {
              let s = this.formatInfo(c.info).salon;
              if (s && s.length > 2) {
                // Limpieza: "SOLO 17 DE MARZO SALON 207" -> "SALON 207"
                s = s.replace(/SOLO \d+ DE [A-Z]+ /i, '').replace(/\//g, '').trim();
                // Normalizar: "SALON 5"
                s = s.replace(/\s+/g, ' ');
                if (s.toLowerCase() !== 'actualidad' && s.length > 2) {
                  uniqueSalones.add(s.toUpperCase());
                }
              }
            });
          }
        });
      });
    });
    return Array.from(uniqueSalones).sort();
  });

  salonesFiltrados = computed(() => {
    const s = this.searchSalon().toLowerCase();
    const list = this.salones();
    if (!s) return list;
    return list.filter(name => name.toLowerCase().includes(s));
  });

  statusSalones = computed<SalonStatus[]>(() => {
    const data = this.allHorarios();
    const salonesList = this.salonesFiltrados();
    const now = new Date();
    const diaActual = now.getDay(); 
    const currentTimeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    const semKey = this.semestre() === 1 ? 'sem1' : 'sem2';
    const filter = this.statusFilter();

    const allStatus = salonesList.map(salon => {
      let claseActual: any = null;
      let proximaClase: any = null;
      let minRestantes = 0;

      // Solo procesar clases si es día de semana
      if (diaActual >= 1 && diaActual <= 5) {
        const todasLasClases: any[] = [];
        Object.entries(data).forEach(([espName, esp]) => {
          Object.entries(esp).forEach(([gName, g]) => {
            if (g[semKey]) {
              g[semKey].forEach(c => {
                 let s = this.formatInfo(c.info).salon;
                 if (s && s.length > 2) {
                   s = s.replace(/SOLO \d+ DE [A-Z]+ /i, '').replace(/\//g, '').trim().toUpperCase();
                   if (s === salon && c.dia === diaActual) {
                      todasLasClases.push({ ...c, infoParsed: this.formatInfo(c.info), grupo: gName });
                   }
                 }
              });
            }
          });
        });

        todasLasClases.sort((a, b) => a.hora.localeCompare(b.hora));

        todasLasClases.forEach(c => {
          if (!c.hora || !c.hora.includes('-')) return;
          const [start, end] = c.hora.split('-');
          if (!start || !end) return;

          if (currentTimeStr >= start && currentTimeStr <= end) {
            claseActual = { materia: c.infoParsed.materia, hora: c.hora, fin: end };
            const timeParts = end.split(':');
            if (timeParts.length === 2) {
               const [hEnd, mEnd] = timeParts.map(Number);
               const totalMinEnd = hEnd * 60 + mEnd;
               const totalMinNow = now.getHours() * 60 + now.getMinutes();
               minRestantes = totalMinEnd - totalMinNow;
            }
          } else if (currentTimeStr < start && !proximaClase) {
            proximaClase = { materia: c.infoParsed.materia, hora: c.hora };
          }
        });
      }

      return {
        nombre: salon,
        libre: !claseActual,
        claseActual,
        proximaClase,
        minutosRestantes: minRestantes
      };
    });

    if (filter === 'libres') return allStatus.filter(s => s.libre);
    if (filter === 'ocupados') return allStatus.filter(s => !s.libre);
    return allStatus;
  });

  grupos = computed(() => {
    const esp = this.especialidad();
    const data = this.allHorarios();
    const shiftFilter = this.turno();
    if (!esp || !data[esp]) return [];

    let list = Object.keys(data[esp]);
    
    if (shiftFilter) {
      const semKey = this.semestre() === 1 ? 'sem1' : 'sem2';
      list = list.filter(gName => {
        const clases = data[esp][gName][semKey] || [];
        if (clases.length === 0) return false;
        
        // Detectar turno del grupo
        // Mañana: clases que empiezan antes de las 12:00
        // Tarde: clases que empiezan entre las 12:00 y las 18:00
        // Noche: clases que empiezan después de las 18:00
        const shifts = new Set<string>();
        clases.forEach(c => {
          const startStr = c.hora.split('-')[0];
          if (!startStr) return;
          const [h] = startStr.split(':').map(Number);
          if (h < 12) shifts.add('Mañana');
          else if (h < 18) shifts.add('Tarde');
          else shifts.add('Noche');
        });

        return shifts.has(shiftFilter);
      });
    }

    return list.sort();
  });

  franjasHorarias = computed(() => {
    const esp = this.especialidad();
    const g = this.grupo();
    const data = this.allHorarios();
    if (!esp || !g || !data[esp] || !data[esp][g]) return [];
    
    const semKey = this.semestre() === 1 ? 'sem1' : 'sem2';
    const clases = data[esp][g][semKey] || [];
    const franjas = Array.from(new Set(clases.map(c => c.hora)));
    
    return franjas.sort((a, b) => a.localeCompare(b));
  });

  franjasHorariasS = computed(() => {
    const s = this.salonSeleccionado();
    const data = this.allHorarios();
    if (!s) return [];
    
    const semKey = this.semestre() === 1 ? 'sem1' : 'sem2';
    const franjas = new Set<string>();

    Object.values(data).forEach(esp => {
      Object.values(esp).forEach(g => {
        g[semKey].forEach(c => {
          if (this.formatInfo(c.info).salon === s) {
            franjas.add(c.hora);
          }
        });
      });
    });
    
    return Array.from(franjas).sort((a, b) => a.localeCompare(b));
  });

  ngOnInit() {
    this.dataService.getHorariosData().subscribe({
      next: (data) => {
        this.allHorarios.set(data);
        if (this.especialidades().length > 0) {
          this.setEspecialidad(this.especialidades()[0]);
        }
      },
      error: (err) => console.error('Error loading horarios:', err)
    });
  }

  setEspecialidad(esp: string) {
    this.especialidad.set(esp);
    const availableGroups = this.grupos();
    if (availableGroups.length > 0) {
      this.grupo.set(availableGroups[0]);
    } else {
      this.grupo.set('');
    }
  }

  setTurno(t: string) {
    this.turno.set(t);
    // Forzar actualización de grupo si el actual ya no está en la lista filtrada
    setTimeout(() => {
      const available = this.grupos();
      if (available.length > 0 && !available.includes(this.grupo())) {
        this.grupo.set(available[0]);
      } else if (available.length === 0) {
        this.grupo.set('');
      }
    });
  }

  clearFilters() {
    this.searchSalon.set('');
    this.statusFilter.set('todos');
    this.turno.set('');
    if (this.especialidades().length > 0) {
      this.setEspecialidad(this.especialidades()[0]);
    }
    this.semestre.set(1);
  }

  getClassInfo(dia: number, hora: string): string | null {
    const esp = this.especialidad();
    const g = this.grupo();
    const data = this.allHorarios();
    if (!esp || !g || !data[esp] || !data[esp][g]) return null;
    
    const semKey = this.semestre() === 1 ? 'sem1' : 'sem2';
    const clases = data[esp][g][semKey] || [];
    const clase = clases.find(c => c.dia === dia && c.hora === hora);
    return clase ? clase.info : null;
  }

  getSalonInfo(dia: number, hora: string): string | null {
    const s = this.salonSeleccionado();
    const data = this.allHorarios();
    if (!s) return null;

    const semKey = this.semestre() === 1 ? 'sem1' : 'sem2';
    let foundInfo = '';

    Object.entries(data).some(([espName, esp]) => {
      return Object.entries(esp).some(([gName, g]) => {
        const clase = g[semKey].find(c => c.dia === dia && c.hora === hora && this.formatInfo(c.info).salon === s);
        if (clase) {
          foundInfo = `${clase.info}\nGrupo: ${gName}`;
          return true;
        }
        return false;
      });
    });

    return foundInfo || null;
  }

  formatInfo(info: string) {
    if (!info) return { materia: '', docente: '', salon: '', grupo: '' };
    const lines = info.split('\n');
    let grupo = '';

    // Buscar si hay una línea de grupo añadida por getSalonInfo
    const groupLine = lines.find(l => l.startsWith('Grupo: '));
    if (groupLine) {
      grupo = groupLine.replace('Grupo: ', '');
    }

    // Detección inteligente de salón - MUCHO más estricta para evitar falsos positivos
    let salon = '';
    // Buscamos SALON, S. (con punto), o palabras clave específicas
    // El prefijo S solo se acepta si es palabra completa y va seguido de dígitos
    const salonMatch = info.match(/\b(SALON|S\.|AULA|LAB|LABORATORIO|SUM|ANFITEATRO|GIMNASIO|BIBLIOTECA)\b\s*([0-9A-Z\-\/]+)/i);
    
    // Caso especial para "S" sin punto (solo si es palabra suelta y sigue un número)
    const sMatch = info.match(/\bS\s+(\d+)\b/i);

    if (salonMatch) {
      salon = salonMatch[0].replace(/\s+/g, ' ').trim();
      // Normalizar
      const prefix = salonMatch[1].toUpperCase();
      if (prefix === 'S.' || prefix === 'S') {
        salon = 'SALON ' + salonMatch[2].trim();
      }
    } else if (sMatch) {
      salon = 'SALON ' + sMatch[1].trim();
    } else if (lines.length > 2) {
      // Si no hay match de palabra clave pero hay +2 líneas, asumimos que la 3ra es el salón
      // Si es solo un número, le prefijamos SALON para que el usuario lo encuentre mejor
      let candidate = lines[2].replace(/\s+/g, ' ').trim();
      if (/^\d+$/.test(candidate)) {
        salon = 'SALON ' + candidate;
      } else {
        salon = candidate;
      }
    }

    return {
      materia: lines[0] || '',
      docente: lines[1] || '',
      salon: salon.trim(),
      grupo: grupo
    };
  }

  get currentTime(): string {
    const now = new Date();
    return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
  }

  get currentDayName(): string {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[new Date().getDay()];
  }
}
