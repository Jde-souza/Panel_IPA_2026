import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import * as QRCode from 'qrcode';
import { DataService } from '../../data.service';
import { AlertService } from '../../services/alert.service';
import { AccessibilityService } from '../../services/accessibility.service';

export interface SalonInfo {
  idSlug: string;
  nombre: string;
  piso: string;
  capacidad: number | null;
  recursos: string;
  qrDataUrl?: string;
  scanUrl?: string;
}

export interface ClaseSalon {
  id?: number;
  especialidad: string;
  grupo: string;
  semestre: 'sem1' | 'sem2';
  dia: number;
  hora: string;
  hora_inicio: string;
  hora_fin: string;
  startMin: number;
  endMin: number;
  materia: string;
  docente: string;
  salon: string;
  status?: 'pasada' | 'en_curso' | 'proxima';
  progressPercent?: number;
  remainingMinutes?: number;
  minutesUntilStart?: number;
  daysUntil?: number;
  docenteAusenteHoy?: boolean;
  causalInasistencia?: string;
}

export interface SalonParsedDisplay {
  tipo: 'numero_puro' | 'numero_letra' | 'prefijo_numero' | 'texto_largo';
  kicker?: string;
  numeroPrincipal: string;
}

export interface SalonLiveStatus {
  salon: SalonInfo;
  enUsoAhora: boolean;
  clasesActuales: ClaseSalon[];
  proximaClase: ClaseSalon | null;
  clasesHoyCount: number;
  totalClasesSemestre: number;
}

@Component({
  selector: 'app-salones',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './salones.component.html',
  styleUrl: './salones.component.css'
})
export class SalonesComponent implements OnInit, OnDestroy {
  private dataService = inject(DataService);
  private alertService = inject(AlertService);
  private a11y = inject(AccessibilityService);
  private route = inject(ActivatedRoute);
  public router = inject(Router);

  isLoading = true;
  error = '';

  // Parámetro de ruta (/salon/:nombre)
  selectedSalonParam: string | null = null;
  activeSalon: SalonInfo | null = null;

  // Catálogos y datos crudos
  salonesCatalog: SalonInfo[] = [];
  allClases: ClaseSalon[] = [];
  inasistenciasHoyMap: { [docenteNorm: string]: string } = {};
  pisosConfig: string[] = ['Sub suelo', 'Planta baja', 'Primer piso', 'Segundo piso'];

  // Semestre activo y filtros de horario ampliado
  semestreActivo: 'sem1' | 'sem2' = 'sem1';
  dias = [1, 2, 3, 4, 5];
  diasNombres = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  selectedDayTab: number = 1;
  showExpandedSchedule = false;
  turnoFilter: 'todos' | 'manana' | 'tarde' | 'noche' = 'todos';

  // Reloj en tiempo real y modo simulación opcional
  now: Date = new Date();
  private clockInterval: any = null;
  useCustomTime = false;
  customDayIndex: number = 1;
  customTimeStr: string = '10:00';

  // Filtros del Directorio de Salones (/salones)
  searchTerm = '';
  selectedPisoFilter = 'Todos';
  selectedEstadoFilter: 'todos' | 'ocupados' | 'libres' = 'todos';

  // Estado del Generador / Impresor de Códigos QR
  showQrModal = false;
  qrPrintFormat: 'poster' | 'grid' = 'poster';
  qrScope: 'single' | 'piso' | 'all' = 'single';
  qrSelectedPiso: string = 'Todos';
  qrSingleSalon: SalonInfo | null = null;
  qrBaseUrl: string = '';
  qrItemsToPrint: SalonInfo[] = [];
  isGeneratingQr = false;

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.showQrModal) {
      this.closeQrModal();
    }
  }

  async ngOnInit() {
    if (typeof window !== 'undefined' && window.location) {
      this.qrBaseUrl = window.location.origin;
    } else {
      this.qrBaseUrl = 'http://localhost:4200';
    }

    this.initCurrentDayAndTime();
    await this.loadAllData();

    this.route.paramMap.subscribe(async params => {
      const nombreParam = params.get('nombre');
      this.selectedSalonParam = nombreParam ? decodeURIComponent(nombreParam) : null;
      await this.resolveActiveSalonFromRoute();
    });

    this.route.queryParamMap.subscribe(async qParams => {
      const qrSalon = qParams.get('qrSalon');
      const qrAll = qParams.get('qrAll');
      if (!this.isLoading) {
        if (qrSalon) {
          const found = this.findSalonByIdentifier(qrSalon);
          if (found) {
            await this.openQrGeneratorModal(found, 'single');
          }
        } else if (qrAll === '1') {
          await this.openQrGeneratorModal(undefined, 'all');
        }
      }
    });

    this.clockInterval = setInterval(() => {
      if (!this.useCustomTime) {
        this.now = new Date();
      }
    }, 30000);
  }

  ngOnDestroy() {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
  }

  private initCurrentDayAndTime() {
    this.now = new Date();
    const jsDay = this.now.getDay(); // 0=Dom, 1=Lun ... 6=Sab
    this.selectedDayTab = jsDay >= 1 && jsDay <= 5 ? jsDay : 1;
    this.customDayIndex = this.selectedDayTab;
    const hh = String(this.now.getHours()).padStart(2, '0');
    const mm = String(this.now.getMinutes()).padStart(2, '0');
    this.customTimeStr = `${hh}:${mm}`;
  }

  async loadAllData() {
    try {
      this.isLoading = true;
      const [config, horariosRaw, inasistenciasRaw] = await Promise.all([
        firstValueFrom(this.dataService.getConfiguracion()).catch(() => ({} as any)),
        firstValueFrom(this.dataService.getHorariosData()).catch(() => []),
        firstValueFrom(this.dataService.getInasistenciasData()).catch(() => [])
      ]);

      // 1. Semestre y Pisos de Configuración
      if (config?.semestreActual === 'sem1' || config?.semestreActual === 'sem2') {
        this.semestreActivo = config.semestreActual;
      }
      if (config?.pisos) {
        const parsedPisos = (Array.isArray(config.pisos) ? config.pisos : String(config.pisos).split('\n'))
          .map((p: string) => p.trim())
          .filter(Boolean);
        if (parsedPisos.length > 0) {
          this.pisosConfig = parsedPisos;
        }
      }

      // 2. Procesar Inasistencias activas hoy
      this.buildInasistenciasMap(inasistenciasRaw || []);

      // 3. Procesar todas las clases de Horarios
      this.allClases = (horariosRaw || [])
        .map((row: any) => this.mapHorarioRow(row))
        .filter((c: ClaseSalon | null): c is ClaseSalon => c !== null);

      // 4. Construir catálogo unificado de Salones (Configuración + Horarios)
      this.buildUnifiedSalonesCatalog(config?.salones || [], this.allClases);

      await this.resolveActiveSalonFromRoute();

      // Verificar si habían queryParams pendientes al terminar de cargar
      const qrSalon = this.route.snapshot.queryParamMap.get('qrSalon');
      const qrAll = this.route.snapshot.queryParamMap.get('qrAll');
      if (qrSalon) {
        const found = this.findSalonByIdentifier(qrSalon);
        if (found) await this.openQrGeneratorModal(found, 'single');
      } else if (qrAll === '1') {
        await this.openQrGeneratorModal(undefined, 'all');
      }
    } catch (err: any) {
      this.error = err?.message || 'Error al cargar datos de salones y horarios.';
    } finally {
      this.isLoading = false;
    }
  }

  private buildInasistenciasMap(rows: any[]) {
    this.inasistenciasHoyMap = {};
    const todayRef = new Date(2026, 8, 16); // Fecha de referencia del sistema o fecha actual
    const realToday = new Date();

    rows.forEach((r: any) => {
      const inicio = r.fecha_inicio || r.inicio || '';
      const fin = r.fecha_fin || r.fin || inicio;
      if (!inicio) return;

      const isActiveToday =
        this.isDateInRange(realToday, inicio, fin) ||
        this.isDateInRange(todayRef, inicio, fin);

      if (isActiveToday) {
        const fullName = `${r.nombre || ''} ${r.apellido || ''}`.trim();
        const apellidoFirst = `${r.apellido || ''} ${r.nombre || ''}`.trim();
        const causal = r.causal || 'Licencia docente registrada';
        if (fullName) this.inasistenciasHoyMap[this.normalizeText(fullName)] = causal;
        if (apellidoFirst) this.inasistenciasHoyMap[this.normalizeText(apellidoFirst)] = causal;
        if (r.apellido && String(r.apellido).trim().length > 3) {
          this.inasistenciasHoyMap[this.normalizeText(String(r.apellido))] = causal;
        }
      }
    });
  }

  private parseDate(dateStr: string): Date {
    if (!dateStr) return new Date(0);
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
    return new Date(dateStr);
  }

  private isDateInRange(targetDate: Date, startStr: string, endStr: string): boolean {
    const startDate = this.parseDate(startStr);
    const endDate = endStr ? this.parseDate(endStr) : startDate;
    const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    return target >= start && target <= end;
  }

  private mapHorarioRow(row: any): ClaseSalon | null {
    const rawSalon = String(row.salon || '').trim();
    if (!rawSalon || rawSalon === '-' || rawSalon.toLowerCase() === 's/d' || rawSalon.toLowerCase() === 'sin salón') {
      return null;
    }

    const horaInicio = String(row.hora_inicio || (row.hora ? row.hora.split('-')[0] : '') || '').trim();
    const horaFin = String(row.hora_fin || (row.hora && row.hora.includes('-') ? row.hora.split('-')[1] : '') || '').trim();
    const startMin = this.parseMinutes(horaInicio);
    const endMin = this.parseMinutes(horaFin);
    if (startMin < 0 || endMin < 0) return null;

    const docente = String(row.docente || 'Sin docente asignado').trim();
    const causalAusencia = this.checkDocenteAusente(docente);

    return {
      id: row.id,
      especialidad: row.especialidad || '',
      grupo: row.grupo || '',
      semestre: (row.semestre === 'sem2' ? 'sem2' : 'sem1'),
      dia: parseInt(row.dia, 10) || 1,
      hora: horaInicio && horaFin ? `${horaInicio}-${horaFin}` : (row.hora || horaInicio),
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      startMin,
      endMin,
      materia: row.materia || 'Sin asignatura',
      docente,
      salon: rawSalon,
      docenteAusenteHoy: !!causalAusencia,
      causalInasistencia: causalAusencia || undefined
    };
  }

  private checkDocenteAusente(docente: string): string | null {
    if (!docente) return null;
    const normDoc = this.normalizeText(docente);
    if (!normDoc || normDoc.includes('sin docente')) return null;

    for (const [key, causal] of Object.entries(this.inasistenciasHoyMap)) {
      if (key && (normDoc.includes(key) || key.includes(normDoc))) {
        return causal;
      }
    }
    return null;
  }

  private buildUnifiedSalonesCatalog(configSalones: any, clases: ClaseSalon[]) {
    const mapByKey = new Map<string, SalonInfo>();

    // 1. Agregar salones desde Configuración
    const rawList = Array.isArray(configSalones)
      ? configSalones
      : typeof configSalones === 'string'
      ? configSalones.split('\n').filter(Boolean)
      : [];

    rawList.forEach((item: any) => {
      if (typeof item === 'object' && item !== null && item.nombre) {
        const nombre = String(item.nombre).trim();
        const key = this.canonicalSalonKey(nombre);
        mapByKey.set(key, {
          idSlug: encodeURIComponent(nombre),
          nombre,
          piso: item.piso || 'Sin piso asignado',
          capacidad: item.capacidad ? Number(item.capacidad) : null,
          recursos: item.recursos || ''
        });
      } else if (typeof item === 'string' && item.trim()) {
        const nombre = item.trim();
        const key = this.canonicalSalonKey(nombre);
        mapByKey.set(key, {
          idSlug: encodeURIComponent(nombre),
          nombre,
          piso: this.inferPisoFromName(nombre),
          capacidad: null,
          recursos: ''
        });
      }
    });

    // 2. Agregar salones detectados en Horarios que no estén aún en Configuración
    clases.forEach(c => {
      const key = this.canonicalSalonKey(c.salon);
      if (!key) return;
      if (!mapByKey.has(key)) {
        const display = /^\d+$/.test(c.salon.trim()) ? `Salón ${c.salon.trim()}` : c.salon.trim();
        mapByKey.set(key, {
          idSlug: encodeURIComponent(display),
          nombre: display,
          piso: this.inferPisoFromName(display),
          capacidad: null,
          recursos: ''
        });
      }
    });

    this.salonesCatalog = Array.from(mapByKey.values()).sort((a, b) =>
      a.nombre.localeCompare(b.nombre, 'es', { numeric: true })
    );
  }

  private inferPisoFromName(nombre: string): string {
    const match = nombre.match(/\b(\d+)\b/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num >= 1 && num <= 9) return 'Planta baja';
      if (num >= 10 && num <= 19) return 'Primer piso';
      if (num >= 20 && num <= 39) return 'Segundo piso';
    }
    return this.pisosConfig[0] || 'Planta baja';
  }

  private async resolveActiveSalonFromRoute() {
    if (!this.selectedSalonParam) {
      this.activeSalon = null;
      return;
    }

    const found = this.findSalonByIdentifier(this.selectedSalonParam);
    if (found) {
      this.activeSalon = found;
      await this.ensureSalonQrGenerated(this.activeSalon);
      this.a11y.announce(`Consultando estado en vivo de ${found.nombre}`, 'polite');
    } else {
      // Si escanearon un código QR de un salón válido aunque no tenga clases aún
      const cleanName = this.selectedSalonParam.trim();
      const fallback: SalonInfo = {
        idSlug: encodeURIComponent(cleanName),
        nombre: /^\d+$/.test(cleanName) ? `Salón ${cleanName}` : cleanName,
        piso: this.inferPisoFromName(cleanName),
        capacidad: null,
        recursos: ''
      };
      this.activeSalon = fallback;
      await this.ensureSalonQrGenerated(this.activeSalon);
    }
  }

  findSalonByIdentifier(ident: string): SalonInfo | null {
    const targetKey = this.canonicalSalonKey(ident);
    if (!targetKey) return null;
    return this.salonesCatalog.find(s => this.canonicalSalonKey(s.nombre) === targetKey) || null;
  }

  // Normaliza "Salón 10", "Salon 10", "Aula 10" y "10" a la misma clave canónica
  canonicalSalonKey(value: string): string {
    const norm = this.normalizeText(value);
    return norm
      .replace(/^(salon|aula|sala)\s+/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  isSameSalon(salonA: string, salonB: string): boolean {
    const keyA = this.canonicalSalonKey(salonA);
    const keyB = this.canonicalSalonKey(salonB);
    return !!keyA && keyA === keyB;
  }

  // Día y minuto activo (Reloj real o simulador)
  get activeDayIndex(): number {
    if (this.useCustomTime) {
      return Number(this.customDayIndex) || 1;
    }
    const d = this.now.getDay();
    return d === 0 ? 7 : d; // 1=Lun..5=Vie, 6=Sab, 7=Dom
  }

  get activeMinuteOfDay(): number {
    if (this.useCustomTime) {
      const m = this.parseMinutes(this.customTimeStr);
      return m >= 0 ? m : 600;
    }
    return this.now.getHours() * 60 + this.now.getMinutes();
  }

  get formattedActiveTime(): string {
    if (this.useCustomTime) {
      return `${this.getDayName(this.activeDayIndex)} • ${this.customTimeStr} hs (Simulación)`;
    }
    const hh = String(this.now.getHours()).padStart(2, '0');
    const mm = String(this.now.getMinutes()).padStart(2, '0');
    return `${this.getDayName(this.activeDayIndex)} • ${hh}:${mm} hs`;
  }

  getDayName(day: number): string {
    const names = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    return names[day] || 'Día';
  }

  // Cálculo del estado en tiempo real para un salón
  getSalonLiveStatus(salon: SalonInfo): SalonLiveStatus {
    const clasesSalonSemestre = this.allClases.filter(
      c => c.semestre === this.semestreActivo && this.isSameSalon(c.salon, salon.nombre)
    );

    const currentDay = this.activeDayIndex;
    const currentMin = this.activeMinuteOfDay;

    // 1. Clases en curso ahora mismo
    const clasesActuales: ClaseSalon[] = clasesSalonSemestre
      .filter(c => c.dia === currentDay && currentMin >= c.startMin && currentMin <= c.endMin)
      .map(c => {
        const duration = Math.max(1, c.endMin - c.startMin);
        const elapsed = Math.max(0, currentMin - c.startMin);
        const progressPercent = Math.min(100, Math.round((elapsed / duration) * 100));
        const remainingMinutes = Math.max(0, c.endMin - currentMin);
        return {
          ...c,
          status: 'en_curso' as const,
          progressPercent,
          remainingMinutes
        };
      });

    // 2. Próxima clase en ese salón (hoy más tarde o el próximo día hábil)
    const upcomingCandidates = clasesSalonSemestre
      .map(c => {
        let diffDays = c.dia - currentDay;
        if (diffDays < 0 || (diffDays === 0 && currentMin >= c.startMin)) {
          diffDays += 7;
        }
        const minutesUntilStart = diffDays === 0 ? c.startMin - currentMin : undefined;
        return {
          ...c,
          daysUntil: diffDays,
          minutesUntilStart
        };
      })
      .sort((a, b) => {
        if ((a.daysUntil || 0) !== (b.daysUntil || 0)) {
          return (a.daysUntil || 0) - (b.daysUntil || 0);
        }
        return a.startMin - b.startMin;
      });

    const proximaClase = upcomingCandidates.length > 0 ? upcomingCandidates[0] : null;
    const clasesHoyCount = clasesSalonSemestre.filter(c => c.dia === currentDay).length;

    return {
      salon,
      enUsoAhora: clasesActuales.length > 0,
      clasesActuales,
      proximaClase,
      clasesHoyCount,
      totalClasesSemestre: clasesSalonSemestre.length
    };
  }

  get activeSalonLiveStatus(): SalonLiveStatus | null {
    if (!this.activeSalon) return null;
    return this.getSalonLiveStatus(this.activeSalon);
  }

  // Lista cronológica de clases del salón activo en el día seleccionado (selectedDayTab)
  get clasesDelDiaSalonActivo(): ClaseSalon[] {
    if (!this.activeSalon) return [];
    const currentDay = this.activeDayIndex;
    const currentMin = this.activeMinuteOfDay;

    return this.allClases
      .filter(
        c =>
          c.semestre === this.semestreActivo &&
          c.dia === this.selectedDayTab &&
          this.isSameSalon(c.salon, this.activeSalon!.nombre)
      )
      .sort((a, b) => a.startMin - b.startMin)
      .map(c => {
        let status: 'pasada' | 'en_curso' | 'proxima' = 'proxima';
        let progressPercent = 0;
        let remainingMinutes = 0;

        if (this.selectedDayTab < currentDay) {
          status = 'pasada';
        } else if (this.selectedDayTab > currentDay) {
          status = 'proxima';
        } else {
          if (currentMin > c.endMin) {
            status = 'pasada';
          } else if (currentMin >= c.startMin && currentMin <= c.endMin) {
            status = 'en_curso';
            const duration = Math.max(1, c.endMin - c.startMin);
            progressPercent = Math.min(100, Math.round(((currentMin - c.startMin) / duration) * 100));
            remainingMinutes = Math.max(0, c.endMin - currentMin);
          } else {
            status = 'proxima';
          }
        }

        return {
          ...c,
          status,
          progressPercent,
          remainingMinutes
        };
      });
  }

  // Grilla semanal ampliada del salón activo (Lunes a Viernes)
  get horasSemanalSalonActivo(): string[] {
    if (!this.activeSalon) return [];
    const clases = this. getFilteredWeeklyClasesForActiveSalon();
    const set = new Set<string>();
    clases.forEach(c => {
      if (c.hora) set.add(c.hora);
    });
    return Array.from(set).sort((a, b) => this.parseMinutes(a.split('-')[0]) - this.parseMinutes(b.split('-')[0]));
  }

  getClasesEnGrillaSalon(hora: string, dia: number): ClaseSalon[] {
    if (!this.activeSalon) return [];
    return this.getFilteredWeeklyClasesForActiveSalon().filter(c => c.hora === hora && c.dia === dia);
  }

  getClasesPorDiaAmpliado(dia: number): ClaseSalon[] {
    if (!this.activeSalon) return [];
    return this.getFilteredWeeklyClasesForActiveSalon()
      .filter(c => c.dia === dia)
      .sort((a, b) => a.startMin - b.startMin);
  }

  private getFilteredWeeklyClasesForActiveSalon(): ClaseSalon[] {
    if (!this.activeSalon) return [];
    return this.allClases.filter(c => {
      if (c.semestre !== this.semestreActivo) return false;
      if (!this.isSameSalon(c.salon, this.activeSalon!.nombre)) return false;

      if (this.turnoFilter === 'manana') return c.startMin < 13 * 60;
      if (this.turnoFilter === 'tarde') return c.startMin >= 13 * 60 && c.startMin < 18 * 60;
      if (this.turnoFilter === 'noche') return c.startMin >= 18 * 60;
      return true;
    });
  }

  // Directorio general de Salones (/salones)
  get allSalonesLiveList(): SalonLiveStatus[] {
    return this.salonesCatalog.map(s => this.getSalonLiveStatus(s));
  }

  get filteredSalonesLiveList(): SalonLiveStatus[] {
    const term = this.normalizeText(this.searchTerm);
    return this.allSalonesLiveList.filter(item => {
      if (this.selectedPisoFilter !== 'Todos' && item.salon.piso !== this.selectedPisoFilter) {
        return false;
      }
      if (this.selectedEstadoFilter === 'ocupados' && !item.enUsoAhora) {
        return false;
      }
      if (this.selectedEstadoFilter === 'libres' && item.enUsoAhora) {
        return false;
      }
      if (!term) return true;

      const clasesActualesText = item.clasesActuales
        .map(c => `${c.materia} ${c.docente} ${c.especialidad} ${c.grupo}`)
        .join(' ');
      const proxText = item.proximaClase
        ? `${item.proximaClase.materia} ${item.proximaClase.docente} ${item.proximaClase.especialidad} ${item.proximaClase.grupo}`
        : '';

      const haystack = this.normalizeText(
        `${item.salon.nombre} ${item.salon.piso} ${item.salon.recursos} ${clasesActualesText} ${proxText}`
      );
      return haystack.includes(term);
    });
  }

  get pisosDisponibles(): string[] {
    const set = new Set<string>(this.pisosConfig);
    this.salonesCatalog.forEach(s => {
      if (s.piso) set.add(s.piso);
    });
    return Array.from(set);
  }

  get countOcupadosAhora(): number {
    return this.allSalonesLiveList.filter(s => s.enUsoAhora).length;
  }

  get countLibresAhora(): number {
    return this.allSalonesLiveList.filter(s => !s.enUsoAhora).length;
  }

  openSalonDetail(salon: SalonInfo) {
    this.router.navigate(['/salon', salon.nombre]);
  }

  backToSalonesDirectory() {
    this.router.navigate(['/salones']);
  }

  toggleExpandedSchedule() {
    this.showExpandedSchedule = !this.showExpandedSchedule;
    this.a11y.announce(
      this.showExpandedSchedule
        ? 'Horario semanal ampliado del salón desplegado'
        : 'Horario semanal ampliado oculto',
      'polite'
    );
  }

  // --- GENERACIÓN E IMPRESIÓN DE CÓDIGOS QR ---

  getSalonScanUrl(salon: SalonInfo): string {
    const base = (this.qrBaseUrl || 'http://localhost:4200').replace(/\/+$/, '');
    return `${base}/salon/${encodeURIComponent(salon.nombre)}`;
  }

  async ensureSalonQrGenerated(salon: SalonInfo): Promise<void> {
    const url = this.getSalonScanUrl(salon);
    if (salon.qrDataUrl && salon.scanUrl === url) return;
    salon.scanUrl = url;
    try {
      salon.qrDataUrl = await QRCode.toDataURL(url, {
        width: 420,
        margin: 1,
        color: {
          dark: '#003087',
          light: '#ffffff'
        }
      });
    } catch (e) {
      console.error('Error generando QR para salón:', salon.nombre, e);
    }
  }

  async openQrGeneratorModal(salon?: SalonInfo, defaultScope: 'single' | 'piso' | 'all' = 'single') {
    this.showQrModal = true;
    if (salon) {
      this.qrSingleSalon = salon;
      this.qrScope = defaultScope;
      this.qrSelectedPiso = salon.piso || 'Todos';
    } else {
      this.qrSingleSalon = this.activeSalon || this.salonesCatalog[0] || null;
      this.qrScope = defaultScope === 'single' && !this.activeSalon ? 'all' : defaultScope;
    }
    await this.rebuildQrPrintList();
  }

  closeQrModal() {
    this.showQrModal = false;
  }

  async rebuildQrPrintList() {
    this.isGeneratingQr = true;
    let targetList: SalonInfo[] = [];

    if (this.qrScope === 'single' && this.qrSingleSalon) {
      targetList = [this.qrSingleSalon];
    } else if (this.qrScope === 'piso') {
      targetList =
        this.qrSelectedPiso === 'Todos'
          ? [...this.salonesCatalog]
          : this.salonesCatalog.filter(s => s.piso === this.qrSelectedPiso);
    } else {
      targetList = [...this.salonesCatalog];
    }

    for (const s of targetList) {
      await this.ensureSalonQrGenerated(s);
    }

    this.qrItemsToPrint = targetList;
    this.isGeneratingQr = false;
  }

  printQrCards() {
    if (this.qrItemsToPrint.length === 0) {
      this.alertService.warning('No hay salones seleccionados para imprimir.', 3000, 'Atención');
      return;
    }
    this.a11y.announce(`Abriendo diálogo de impresión para ${this.qrItemsToPrint.length} códigos QR`, 'polite');
    setTimeout(() => {
      window.print();
    }, 150);
  }

  async downloadSingleQrPng(salon: SalonInfo) {
    await this.ensureSalonQrGenerated(salon);
    if (!salon.qrDataUrl) return;

    const link = document.createElement('a');
    const safeName = salon.nombre.replace(/[^a-zA-Z0-9_-]/g, '_');
    link.download = `QR_${safeName}_IPA.png`;
    link.href = salon.qrDataUrl;
    link.click();
    this.alertService.success(`Código QR de ${salon.nombre} descargado como PNG.`, 3000, 'Descarga lista');
  }

  async copySalonLink(salon: SalonInfo) {
    const url = this.getSalonScanUrl(salon);
    try {
      await navigator.clipboard.writeText(url);
      this.alertService.success(`Enlace del ${salon.nombre} copiado al portapapeles.`, 3000, 'Enlace copiado');
      this.a11y.announce(`Enlace de ${salon.nombre} copiado al portapapeles`, 'polite');
    } catch {
      this.alertService.error('No se pudo copiar el enlace.', 3500, 'Error');
    }
  }

  
  parseSalonDisplay(nombre: string): SalonParsedDisplay {
    const clean = (nombre || '').trim();
    if (/^\d+$/.test(clean)) {
      return { tipo: 'numero_puro', numeroPrincipal: clean };
    }
    if (/^\d+\s*[-/]?\s*[A-Za-z](\s+bis)?$/i.test(clean)) {
      return { tipo: 'numero_letra', numeroPrincipal: clean.toUpperCase() };
    }
    const sharedMatch = clean.match(/^(?:salon|salón|aula)\s+(\d+[a-z]?)\s*\/\s*(?:salon|salón|aula)\s+(\d+[a-z]?)$/i);
    if (sharedMatch) {
      return { tipo: 'prefijo_numero', kicker: 'SALONES COMPARTIDOS', numeroPrincipal: `${sharedMatch[1]} / ${sharedMatch[2]}` };
    }
    const prefixMatch = clean.match(/^(sal[oó]n|aula|laboratorio|lab)\s+(\d+[a-z]?(?:\s*bis)?)$/i);
    if (prefixMatch) {
      const rawPrefix = prefixMatch[1].toLowerCase();
      const kicker = rawPrefix.startsWith('lab') ? 'LABORATORIO' : rawPrefix.startsWith('aula') ? 'AULA' : 'SALÓN';
      return { tipo: 'prefijo_numero', kicker, numeroPrincipal: prefixMatch[2].toUpperCase() };
    }
    const labSpecMatch = clean.match(/^(lab(?:oratorio)?)\s+([a-záéíóú]+)\s*(\d+)?$/i);
    if (labSpecMatch) {
      const rama = labSpecMatch[2].toUpperCase();
      const num = labSpecMatch[3] ? ` ${labSpecMatch[3]}` : '';
      return { tipo: 'prefijo_numero', kicker: `LABORATORIO DE ${rama}`, numeroPrincipal: (num.trim() || rama) };
    }
    return { tipo: 'texto_largo', numeroPrincipal: clean };
  }

  private parseMinutes(hhmm: string): number {
    if (!hhmm || !hhmm.includes(':')) return -1;
    const parts = hhmm.trim().split(':');
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return -1;
    return h * 60 + m;
  }

  private normalizeText(val: string): string {
    return (val || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
}
