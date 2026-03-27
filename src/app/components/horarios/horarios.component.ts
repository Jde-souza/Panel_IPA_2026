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
  template: `
    <section class="section-header">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;">
        <div>
          <h2>Horarios 2026</h2>
          <p>Consulta horarios, disponibilidad de salones o estado en tiempo real.</p>
        </div>
        <div class="view-toggle" role="group" aria-label="Modo de visualización">
          <button [class.active]="viewMode() === 'grupo'" (click)="viewMode.set('grupo')" [attr.aria-pressed]="viewMode() === 'grupo'">
            <i class="fa-solid fa-users" aria-hidden="true"></i> Grupos
          </button>
          <button [class.active]="viewMode() === 'salon'" (click)="viewMode.set('salon')" [attr.aria-pressed]="viewMode() === 'salon'">
            <i class="fa-solid fa-door-open" aria-hidden="true"></i> Salones
          </button>
          <button [class.active]="viewMode() === 'actividad'" (click)="viewMode.set('actividad')" [attr.aria-pressed]="viewMode() === 'actividad'">
            <i class="fa-solid fa-bolt" aria-hidden="true"></i> En Vivo
          </button>
        </div>
        <div class="header-actions">
          <button (click)="clearFilters()" class="btn-clear" [disabled]="!especialidad() && !grupo() && !searchSalon()" aria-label="Limpiar filtros de búsqueda">
            <i class="fa-solid fa-eraser" aria-hidden="true"></i> Limpiar
          </button>
          <a href="https://docs.google.com/spreadsheets/d/1NFHuPEvw9Cns-M9YWtVcfx_Kd6Eo-4r6/edit?rtpof=true&sd=true" target="_blank" class="btn-external" aria-label="Abrir planilla original (abre en nueva pestaña)">
            <i class="fa-solid fa-file-excel" aria-hidden="true"></i> Planilla Original
          </a>
          <div class="semester-toggle" role="group" aria-label="Seleccionar semestre">
            <button [class.active]="semestre() === 1" (click)="semestre.set(1)" [attr.aria-pressed]="semestre() === 1">1er Semestre</button>
            <button [class.active]="semestre() === 2" (click)="semestre.set(2)" [attr.aria-pressed]="semestre() === 2">2do Semestre</button>
          </div>
        </div>
      </div>
      
      <div class="filter-bar" style="margin-top: 25px; display: flex; gap: 20px; flex-wrap: wrap;" *ngIf="viewMode() === 'grupo'">
        <div class="filter-item">
          <label for="select-especialidad" style="display: block; font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-bottom: 5px; text-transform: uppercase;">Especialidad</label>
          <select id="select-especialidad" [ngModel]="especialidad()" (ngModelChange)="setEspecialidad($event)" class="custom-select">
            <option *ngFor="let esp of especialidades()" [value]="esp">{{esp}}</option>
          </select>
        </div>

        <div class="filter-item">
          <label for="select-turno" style="display: block; font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-bottom: 5px; text-transform: uppercase;">Turno</label>
          <select id="select-turno" [ngModel]="turno()" (ngModelChange)="setTurno($event)" class="custom-select" style="min-width: 120px;">
            <option value="">Todos</option>
            <option value="Mañana">Mañana</option>
            <option value="Tarde">Tarde</option>
            <option value="Noche">Noche</option>
          </select>
        </div>

        <div class="filter-item">
          <label for="select-grupo" style="display: block; font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-bottom: 5px; text-transform: uppercase;">Grupo</label>
          <select id="select-grupo" [ngModel]="grupo()" (ngModelChange)="grupo.set($event)" class="custom-select" [disabled]="!especialidad()" style="min-width: 150px;">
            <option *ngFor="let g of grupos()" [value]="g">{{g}}</option>
          </select>
        </div>
      </div>

      <div class="filter-bar" style="margin-top: 25px; display: flex; gap: 20px; flex-wrap: wrap;" *ngIf="viewMode() === 'salon'">
        <div class="filter-item">
          <label for="select-salon" style="display: block; font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-bottom: 5px; text-transform: uppercase;">Selecciona un Salón</label>
          <div style="display: flex; gap: 10px; align-items: center;">
            <select id="select-salon" [ngModel]="salonSeleccionado()" (ngModelChange)="salonSeleccionado.set($event)" class="custom-select">
              <option *ngFor="let s of salonesFiltrados()" [value]="s">{{s}}</option>
            </select>
            <div class="search-input-wrapper">
              <i class="fa-solid fa-search" aria-hidden="true"></i>
              <input type="text" id="input-search-salon" [ngModel]="searchSalon()" (ngModelChange)="searchSalon.set($event)" placeholder="Filtrar salón..." class="salon-search-field" aria-label="Filtrar salones por nombre">
            </div>
          </div>
        </div>
      </div>
      <div class="filter-bar" style="margin-top: 25px; display: flex; gap: 20px; flex-wrap: wrap;" *ngIf="viewMode() === 'actividad'">
        <div class="live-info" style="flex: 1;">
          <span class="badge-live"><i class="fa-solid fa-clock"></i> {{currentDayName}} - {{currentTime}}</span>
          <p style="margin-top: 8px; color: var(--text-muted); font-size: 0.85rem;">Mostrando estado actual de todos los salones registrados.</p>
        </div>
        
        <div class="status-toggles" role="group" aria-label="Filtrar por estado">
          <button [class.active]="statusFilter() === 'todos'" (click)="statusFilter.set('todos')" [attr.aria-pressed]="statusFilter() === 'todos'">Todos</button>
          <button [class.active]="statusFilter() === 'libres'" (click)="statusFilter.set('libres')" class="btn-free" [attr.aria-pressed]="statusFilter() === 'libres'">Libres</button>
          <button [class.active]="statusFilter() === 'ocupados'" (click)="statusFilter.set('ocupados')" class="btn-busy" [attr.aria-pressed]="statusFilter() === 'ocupados'">Ocupados</button>
        </div>

        <div class="search-input-wrapper" style="align-self: flex-end;">
          <i class="fa-solid fa-search" aria-hidden="true"></i>
          <input type="text" [ngModel]="searchSalon()" (ngModelChange)="searchSalon.set($event)" placeholder="Buscas un salón?" class="salon-search-field" aria-label="Buscar salón específico">
        </div>
      </div>
    </section>

    <!-- Vista de Actividad En Vivo -->
    <div class="live-panel fade-in" *ngIf="viewMode() === 'actividad'">
      <div class="live-grid">
        <div *ngFor="let s of statusSalones()" class="salon-status-card" [class.is-free]="s.libre">
          <div class="card-top">
            <span class="salon-name">{{s.nombre}}</span>
            <span class="status-badge" [class.free]="s.libre">
              {{s.libre ? 'LIBRE' : 'OCUPADO'}}
            </span>
          </div>
          
          <div class="card-body">
            <ng-container *ngIf="!s.libre && s.claseActual as current">
              <div class="current-class">{{current.materia}}</div>
              <div class="class-time">{{current.hora}}</div>
              <div class="next-event">Finaliza en: <strong>{{s.minutosRestantes}} min</strong></div>
            </ng-container>
            
            <ng-container *ngIf="s.libre">
              <div class="free-msg">Disponible para reasignar</div>
              <div class="next-event" *ngIf="s.proximaClase as next">
                Próxima: {{next.materia}} ({{next.hora.split('-')[0]}})
              </div>
              <div class="next-event" *ngIf="!s.proximaClase">Sin más clases hoy</div>
            </ng-container>
          </div>
        </div>
      </div>
    </div>

    <div class="schedule-wrapper fade-in" *ngIf="viewMode() === 'grupo' ? grupo() : salonSeleccionado()">
      <div class="table-container shadow-premium">
        <table class="schedule-table">
          <thead>
            <tr>
              <th class="time-col" scope="col">Hora</th>
              <th scope="col">Lunes</th>
              <th scope="col">Martes</th>
              <th scope="col">Miércoles</th>
              <th scope="col">Jueves</th>
              <th scope="col">Viernes</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let h of (viewMode() === 'grupo' ? franjasHorarias() : franjasHorariasS())">
              <td class="time-cell">{{h}}</td>
              <td *ngFor="let d of [1,2,3,4,5]" class="class-cell">
                <ng-container *ngIf="(viewMode() === 'grupo' ? getClassInfo(d, h) : getSalonInfo(d, h)) as info">
                  <div class="class-card-inner">
                    <div class="class-text">{{formatInfo(info).materia}}</div>
                    <div class="class-subtext" *ngIf="formatInfo(info).docente">
                      <i class="fa-solid fa-user-tie" aria-hidden="true"></i> {{formatInfo(info).docente}}
                    </div>
                    <div class="class-venue">
                      <i class="fa-solid" [class.fa-door-open]="viewMode() === 'grupo'" [class.fa-users]="viewMode() === 'salon'" aria-hidden="true"></i> 
                      {{viewMode() === 'grupo' ? formatInfo(info).salon : formatInfo(info).grupo}}
                    </div>
                  </div>
                </ng-container>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div *ngIf="!grupo()" class="welcome-banner" style="text-align: center; padding: 60px 0;">
      <i class="fa-solid fa-calendar-days" style="font-size: 4rem; color: var(--primary-color); opacity: 0.2; margin-bottom: 20px; display: block;"></i>
      <h3>Selecciona una especialidad y grupo</h3>
      <p>Para visualizar la grilla horaria correspondiente.</p>
    </div>
  `,
  styles: [`
    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .btn-clear, .btn-external {
      padding: 10px 18px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.3s;
      border: 1px solid var(--border-color);
      text-decoration: none;
    }
    .btn-clear {
      background: var(--surface);
      color: var(--text-main);
    }
    .btn-clear:hover:not(:disabled) {
      background: var(--surface-alt);
      border-color: var(--primary-color);
    }
    .btn-external {
      background: #1d6f42;
      color: white;
      border: none;
    }
    .btn-external:hover {
      background: #155231;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(29, 111, 66, 0.3);
    }
    .view-toggle {
      display: flex;
      background: var(--surface-alt);
      padding: 4px;
      border-radius: 12px;
      border: 1px solid var(--border-color);
    }
    .view-toggle button {
      padding: 8px 20px;
      border: none;
      background: transparent;
      color: var(--text-muted);
      font-weight: 700;
      font-size: 0.9rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .view-toggle button.active {
      background: var(--surface);
      color: var(--primary-color);
      box-shadow: 0 4px 10px rgba(0,0,0,0.05);
    }
    .live-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
      margin-top: 10px;
    }
    .salon-status-card {
      background: var(--surface);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 18px;
      transition: all 0.3s;
      border-left: 5px solid #ef4444;
    }
    .salon-status-card.is-free {
      border-left-color: #22c55e;
    }
    .salon-status-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 20px rgba(0,0,0,0.1);
    }
    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    .salon-name {
      font-weight: 800;
      font-size: 1.1rem;
      color: var(--text-heading);
    }
    .status-badge {
      font-size: 0.65rem;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 20px;
      background: #fee2e2;
      color: #ef4444;
    }
    .status-badge.free {
      background: #dcfce7;
      color: #22c55e;
    }
    .current-class {
      font-weight: 700;
      font-size: 0.95rem;
      color: var(--text-main);
      margin-bottom: 4px;
    }
    .class-time {
      font-size: 0.8rem;
      color: var(--primary-color);
      font-weight: 600;
      margin-bottom: 12px;
    }
    .next-event {
      font-size: 0.8rem;
      color: var(--text-muted);
      border-top: 1px solid var(--border-color);
      padding-top: 10px;
    }
    .free-msg {
      color: #22c55e;
      font-weight: 600;
      font-size: 0.9rem;
      margin-bottom: 12px;
    }
    .badge-live {
      background: var(--primary-color);
      color: white;
      padding: 6px 14px;
      border-radius: 80px;
      font-size: 0.85rem;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 12px rgba(0, 174, 239, 0.3);
    }
    .search-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }
    .search-input-wrapper i {
      position: absolute;
      left: 12px;
      color: var(--text-muted);
      font-size: 0.8rem;
    }
    .salon-search-field {
      padding: 10px 15px 10px 35px;
      border: 1px solid var(--border-color);
      background: var(--surface);
      border-radius: 8px;
      color: var(--text-main);
      font-weight: 600;
      outline: none;
      transition: all 0.3s;
      min-width: 150px;
    }
    .salon-search-field:focus {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(0, 174, 239, 0.1);
    }
    .status-toggles {
      display: flex;
      background: var(--surface-alt);
      padding: 4px;
      border-radius: 12px;
      border: 1px solid var(--border-color);
      align-self: flex-end;
    }
    .status-toggles button {
      padding: 8px 16px;
      border: none;
      background: transparent;
      color: var(--text-muted);
      cursor: pointer;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      transition: all 0.2s;
    }
    .status-toggles button.active {
      background: var(--surface);
      color: var(--primary-color);
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    .status-toggles button.active.btn-free {
      color: #22c55e;
    }
    .status-toggles button.active.btn-busy {
      color: #ef4444;
    }
    .semester-toggle {
      display: flex;
      background: var(--surface-alt);
      padding: 4px;
      border-radius: 12px;
      border: 1px solid var(--border-color);
    }
    .semester-toggle button {
      padding: 8px 16px;
      border: none;
      background: transparent;
      color: var(--text-muted);
      font-weight: 600;
      font-size: 0.85rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;
    }
    .semester-toggle button.active {
      background: var(--primary-color);
      color: white;
      box-shadow: 0 4px 12px rgba(0, 174, 239, 0.3);
    }
    .custom-select {
      background: var(--surface);
      color: var(--text-main);
      border: 1px solid var(--border-color);
      padding: 10px 15px;
      border-radius: 8px;
      font-weight: 600;
      min-width: 200px;
      outline: none;
    }
    .custom-select:focus {
      border-color: var(--primary-color);
    }
    .schedule-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    .schedule-table th {
      background: var(--surface-alt);
      color: var(--text-heading);
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding: 15px;
      border: 1px solid var(--border-color);
    }
    .time-col { width: 120px; }
    .time-cell {
      background: var(--surface-alt);
      color: var(--primary-color);
      font-weight: 700;
      font-size: 0.8rem;
      text-align: center;
      border: 1px solid var(--border-color);
    }
    .class-cell {
      height: 90px;
      border: 1px solid var(--border-color);
      padding: 5px;
      vertical-align: top;
      background: var(--surface);
    }
    .class-card-inner {
      background: rgba(0, 174, 239, 0.05);
      border-left: 3px solid var(--primary-color);
      padding: 8px;
      height: 100%;
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .class-text {
      font-weight: 700;
      font-size: 0.85rem;
      color: var(--text-heading);
      line-height: 1.2;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .class-subtext, .class-venue {
      font-size: 0.7rem;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .class-subtext i, .class-venue i {
      margin-right: 4px;
      width: 10px;
    }
    .shadow-premium {
      box-shadow: 0 10px 30px rgba(0,0,0,0.05);
      border-radius: 12px;
      overflow: hidden;
    }
  `]
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
