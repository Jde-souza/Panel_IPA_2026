import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface QuickLink {
  title: string;
  description: string;
  url: string;
  icon: string;
  category: string;
}

export interface DoeEntry {
  doe: string;
  turno: string;
  horario: string;
  titular: string;
  tareas: string;
  email?: string | string[];
}

export interface DoeShift {
  turno: string;
  horario: string;
  titular: string;
  tareas: string;
  email?: string | string[];
}

export interface UnifiedDoeEntry {
  doe: string;
  shifts: DoeShift[];
}

export interface CentroContacto {
  nombre: string;
  departamento: string;
  direccion: string;
  telefono: string;
  email: string;
  tipo: string; // IFD, CERP, IPES, etc.
}

export interface AgendaHorario {
  dia: number;
  hora: string;
  salon: string;
  grupo: string;
  asignatura: string;
}

export interface AgendaItem {
  nombre: string;
  telefono1: string;
  telefono2: string;
  email: string;
  especialidades?: string[];
  asignaturas?: string[];
  caracter?: string;
  grupos?: string[];
  isTachado?: boolean;
  observacion?: string;
  horarios?: AgendaHorario[];
}

export interface NewsItem {
  title: string;
  url: string;
  source: string;
  date: string;
  summary?: string;
  imageUrl?: string;
}

export interface HorarioClase {
  dia: number;
  hora: string;
  info: string;
}

export interface HorarioGrupo {
  sem1: HorarioClase[];
  sem2: HorarioClase[];
}

export interface HorariosEspecialidad {
  [grupo: string]: HorarioGrupo;
}

export interface HorariosRoot {
  [especialidad: string]: HorariosEspecialidad;
}

export interface InasistenciaDocente {
  timestamp: string;
  nombre: string;
  apellido: string;
  inicio: string;
  fin: string;
  grupos: string;
  asignaturas: string[];
}

export interface LlamadoItem {
  title: string;
  url: string;
  origen: string;
  info: string;
  category: 'docente' | 'no-docente';
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private http = inject(HttpClient);
  private centrosData: CentroContacto[] = [
    {
      nombre: 'IFD de Artigas',
      departamento: 'Artigas',
      direccion: 'Rivera y Lavalleja',
      telefono: '4772 4444',
      email: 'ifdartigas@cfe.edu.uy',
      tipo: 'IFD'
    },
    {
      nombre: 'IFD Bella Unión (Sede)',
      departamento: 'Artigas',
      direccion: 'Local Anexo (Bella Unión)',
      telefono: '-',
      email: 'ifdbellaunion@cfe.edu.uy',
      tipo: 'IFD'
    },
    {
      nombre: 'CeRP del Sur',
      departamento: 'Canelones',
      direccion: 'Pastori e/ García Lorca y Goya',
      telefono: '4372 1212',
      email: 'cerpsur@cfe.edu.uy',
      tipo: 'CERP'
    },
    {
      nombre: 'IFD de Canelones',
      departamento: 'Canelones',
      direccion: 'Treinta y Tres 470',
      telefono: '4332 2769',
      email: 'comeniocanelones@cfe.edu.uy',
      tipo: 'IFD'
    },
    {
      nombre: 'IFD de la Costa',
      departamento: 'Canelones',
      direccion: 'Ombúes esq. "F" (Solymar)',
      telefono: '2696 7822',
      email: 'ifddelacosta@cfe.edu.uy',
      tipo: 'IFD'
    },
    {
      nombre: 'IFD de Pando',
      departamento: 'Canelones',
      direccion: 'Iturria 1245',
      telefono: '2292 1183',
      email: 'ifdpando@cfe.edu.uy',
      tipo: 'IFD'
    },
    {
      nombre: 'IFD de San Ramón',
      departamento: 'Canelones',
      direccion: 'Batlle y Ordóñez 1628',
      telefono: '4312 4312',
      email: 'ifdsanramon@cfe.edu.uy',
      tipo: 'IFD'
    },
    {
      nombre: 'IFD de Melo',
      departamento: 'Cerro Largo',
      direccion: 'Aparicio Saravia 441',
      telefono: '4642 6982',
      email: 'ifdmelo@gmail.com',
      tipo: 'IFD'
    },
    {
      nombre: 'CeRP del Suroeste',
      departamento: 'Colonia',
      direccion: 'Domingo Maddalena 160',
      telefono: '4522 7749',
      email: 'cerpsw@cfe.edu.uy',
      tipo: 'CERP'
    },
    {
      nombre: 'IFD de Colonia',
      departamento: 'Colonia',
      direccion: 'Rivadavia 477',
      telefono: '4522 2384',
      email: 'ifdcolonia@cfe.edu.uy',
      tipo: 'IFD'
    },
    {
      nombre: 'IFD de Carmelo',
      departamento: 'Colonia',
      direccion: 'Uruguay 336',
      telefono: '4542 2368',
      email: 'ifdcarmelo@cfe.edu.uy',
      tipo: 'IFD'
    },
    {
      nombre: 'IFD de Rosario',
      departamento: 'Colonia',
      direccion: 'Gral. Artigas 332',
      telefono: '4552 1579',
      email: 'direccionifdrosario@gmail.com',
      tipo: 'IFD'
    },
    {
      nombre: 'IFD de Durazno',
      departamento: 'Durazno',
      direccion: '18 de Julio esq. Larrañaga',
      telefono: '4362 3920',
      email: 'iifddurazno@cfe.edu.uy',
      tipo: 'IFD'
    },
    {
      nombre: 'IFD de Trinidad',
      departamento: 'Flores',
      direccion: 'Alfredo Puig 520',
      telefono: '4364 4210',
      email: 'ifdtrinidad@cfe.edu.uy',
      tipo: 'IFD'
    },
    {
      nombre: 'CeRP del Centro',
      departamento: 'Florida',
      direccion: 'Independencia y 24 de Abril',
      telefono: '4352 9672',
      email: 'cerpcentro@gmail.com',
      tipo: 'CERP'
    },
    {
      nombre: 'IFD de Florida',
      departamento: 'Florida',
      direccion: 'Pocho Fernández 444',
      telefono: '4352 2597',
      email: 'ifdflorida@cfe.edu.uy',
      tipo: 'IFD'
    },
    {
      nombre: 'IFD de Minas',
      departamento: 'Lavalleja',
      direccion: '18 de Julio 719',
      telefono: '4442 7272',
      email: 'ifdminas@cfe.edu.uy',
      tipo: 'IFD'
    },
    {
      nombre: 'CeRP del Este',
      departamento: 'Maldonado',
      direccion: 'La Virgen y Alférez Cámpora',
      telefono: '4225 4422',
      email: 'cerpdeleste@cfe.edu.uy',
      tipo: 'CERP'
    },
    {
      nombre: 'IFD de Maldonado',
      departamento: 'Maldonado',
      direccion: 'Sarandí 757',
      telefono: '4222 2278',
      email: 'ifdmaldonado@gmail.com',
      tipo: 'IFD'
    },
    {
      nombre: 'IFD de San Carlos',
      departamento: 'Maldonado',
      direccion: 'Ituzaingó 979',
      telefono: '4426 5431',
      email: 'ifdsancarlos@cfe.edu.uy',
      tipo: 'IFD'
    },
    {
      nombre: 'IPA',
      departamento: 'Montevideo',
      direccion: 'Av. del Libertador 2025',
      telefono: '2924 4334',
      email: 'ipa@cfe.edu.uy',
      tipo: 'Instituto'
    },
    {
      nombre: 'INET',
      departamento: 'Montevideo',
      direccion: 'Guatemala 1172',
      telefono: '2929 0905',
      email: 'inet@cfe.edu.uy',
      tipo: 'Instituto'
    },
    {
      nombre: 'IPES',
      departamento: 'Montevideo',
      direccion: 'Asilo 3255',
      telefono: '2481 2220',
      email: 'ipes@cfe.edu.uy',
      tipo: 'Instituto'
    },
    {
      nombre: 'IINN (Normales)',
      departamento: 'Montevideo',
      direccion: 'Soriano 1658',
      telefono: '2410 4669',
      email: 'direccioniinn@gmail.com',
      tipo: 'Instituto'
    },
    {
      nombre: 'IFES',
      departamento: 'Montevideo',
      direccion: 'Av. 18 de Julio 2128',
      telefono: '2400 3391',
      email: 'ifeducacionsocial@gmail.com',
      tipo: 'IFD'
    },
    {
      nombre: 'IFD de Paysandú',
      departamento: 'Paysandú',
      direccion: 'Florida 1181',
      telefono: '4722 9068',
      email: 'ifdpaysandu@cfe.edu.uy',
      tipo: 'IFD'
    },
    {
      nombre: 'IFD de Fray Bentos',
      departamento: 'Río Negro',
      direccion: '25 de Mayo 3335',
      telefono: '4562 2081',
      email: 'ifdfraybentos@cfe.edu.uy',
      tipo: 'IFD'
    },
    {
      nombre: 'CeRP del Norte',
      departamento: 'Rivera',
      direccion: 'Ruta 5 km 495.500',
      telefono: '4622 3053',
      email: 'cerpdelnorte@cfe.edu.uy',
      tipo: 'CERP'
    },
    {
      nombre: 'IFD de Rivera',
      departamento: 'Rivera',
      direccion: 'Agraciada 892',
      telefono: '4622 3053',
      email: 'ifdrivera@cfe.edu.uy',
      tipo: 'IFD'
    },
    {
      nombre: 'IFD de Rocha',
      departamento: 'Rocha',
      direccion: '25 de Agosto 133',
      telefono: '4472 2925',
      email: 'rochaifd@gmail.com',
      tipo: 'IFD'
    },
    {
      nombre: 'CeRP del Litoral',
      departamento: 'Salto',
      direccion: 'Fl. Sánchez esq. Cervantes',
      telefono: '4732 4011',
      email: 'cerplitoral@gmail.com',
      tipo: 'CERP'
    },
    {
      nombre: 'IFD de Salto',
      departamento: 'Salto',
      direccion: 'Uruguay 335',
      telefono: '4733 3490',
      email: 'ifdsalto@cfe.edu.uy',
      tipo: 'IFD'
    },
    {
      nombre: 'IFD de San José',
      departamento: 'San José',
      direccion: 'Batlle y Ordóñez 810',
      telefono: '4342 3650',
      email: 'ifdsanjose@cfe.edu.uy',
      tipo: 'IFD'
    },
    {
      nombre: 'IFD de Mercedes',
      departamento: 'Soriano',
      direccion: 'M. Castro y Careaga 513',
      telefono: '4532 4774',
      email: 'ifdmercedes@cfe.edu.uy',
      tipo: 'IFD'
    },
    {
      nombre: 'IFD de Dolores',
      departamento: 'Soriano',
      direccion: 'Grito de Asencio y Puig',
      telefono: '4534 2561',
      email: 'ifddolores@cfe.edu.uy',
      tipo: 'IFD'
    },
    {
      nombre: 'IFD Tacuarembó',
      departamento: 'Tacuarembó',
      direccion: '25 de Mayo 124',
      telefono: '4632 2965',
      email: 'ifdtacuarembo@cfe.edu.uy',
      tipo: 'IFD'
    },
    {
      nombre: 'IFD 33',
      departamento: 'Treinta y Tres',
      direccion: 'M. Lavalleja esq. S. Gadea',
      telefono: '4452 2437',
      email: 'ifd33@cfe.edu.uy',
      tipo: 'IFD'
    }
  ];

  getCentrosData() {
    return this.centrosData;
  }
  private rawDoeData: DoeEntry[] = [
    { doe: 'BRACCO, Gastón', turno: 'Nocturno', horario: '18:00 a 22:00', titular: 'NAYA, Adriana (T)', tareas: 'Física / Astronomía', email: ['fisica.ipa.bedelia@gmail.com', 'astronomia.ipa.bedelia@gmail.com'] },
    { doe: 'COLMAN, Gabriela', turno: 'Matutino', horario: '8:00 a 12:00', titular: 'COLMAN Gabriela 1er cargo', tareas: 'Didáctica / Ed. Musical', email: ['didacticaipa@gmail.com', 'educacionmusical.ipa.bedelia@gmail.com'] },
    { doe: 'COLMAN, Gabriela', turno: 'Intermedio-Nocturno', horario: 'Lun, miérc., viernes 12:00 a 16:00 - Martes y jueves 18:30 a 22:30', titular: 'COLMAN Gabriela 2do cargo', tareas: 'Matemática', email: 'matematica.ipa.bedelia@gmail.com' },
    { doe: 'TORRES, Carla', turno: 'Nocturno', horario: '18:00 a 22:00', titular: 'TORRES Carla', tareas: 'Español - Filosofía', email: ['espanol.ipa.bedelia@gmail.com', 'filosofia.ipa.bedelia@gmail.com'] },
    { doe: 'VACANTE', turno: 'Nocturno / Matutino', horario: 'Martes a viernes: 19:45 a 23:45 | Sábados: 08:00 a 12:00', titular: 'SARAIBE, Esteban', tareas: '-' },
    { doe: 'CARABAJAL, Pierángeli', turno: 'Matutino', horario: '09:00 a 13:00', titular: '-', tareas: 'Didáctica / Inglés', email: ['didacticaipa@gmail.com', 'ingles.ipa.bedelia@gmail.com'] },
    { doe: 'MACHADO, Nicolás', turno: 'Intermedio / Matutino', horario: 'Martes a viernes 19:00 a 23:00 | Sábado: 08:00 a 12:00', titular: 'DE LEMA, Solange', tareas: 'Literatura', email: 'literatura.ipa.bedelia@gmail.com' },
    { doe: 'BASTIDA, Carolina', turno: 'Vespertino', horario: '17:00 a 21:00', titular: 'BASTIDA, Carolina', tareas: 'Historia', email: 'historia.ipa.bedelia@gmail.com' },
    { doe: 'NIELLI, Rosana', turno: 'Intermedio', horario: '14:00 a 18:00', titular: 'IRIGOYEN, Marta (T)', tareas: 'Danza + Cs. Geográficas + BECAS', email: ['danza.ipa.bedelia@gmail.com', 'geografia.ipa.bedelia@gmail.com', 'ipabecasestudiantiles@gmail.com'] },
    { doe: 'DE LEÓN, Valeria', turno: 'Matutino-Vespertino', horario: 'Lunes a miércoles 18:00 a 22:00 / Jueves y viernes 8 a 12', titular: 'DE LEÓN, Valeria', tareas: 'Com. Visual / Derecho y Sociología', email: ['comunicacionvisual.ipa.bedelia@gmail.com', 'derecho.sociologia.ipa@gmail.com'] },
    { doe: 'OLANO, Eugenia', turno: 'Nocturno', horario: '19:30 a 23:30', titular: 'OLANO, Eugenia', tareas: 'Cs. Biológicas / Química', email: ['biologia.ipa.bedelia@gmail.com', 'quimica.ipa.bedelia@gmail.com'] },
    { doe: 'OVIEDO, Tabaré', turno: 'Nocturno', horario: '14:00 a 18:00', titular: 'OVIEDO, Tabaré', tareas: 'Italiano-Francés-Portugués-Alemán', email: 'lenguasextranjeras.ipa.bedelia@gmail.com' }
  ];

  quickLinks: QuickLink[] = [
    {
      title: 'SGE',
      description: 'Sistema de Gestión Estudiantil - Inscripciones y notas.',
      url: 'https://sge.cfe.edu.uy/',
      icon: 'fa-solid fa-chart-column',
      category: 'Gestión'
    },
    {
      title: 'Moodle CFE',
      description: 'Entorno virtual de aprendizaje para cursos y materiales.',
      url: 'https://moodle.cfe.edu.uy/',
      icon: 'fa-solid fa-graduation-cap',
      category: 'Educación'
    },
    {
      title: 'Bedelía IPA',
      description: 'Información sobre horarios, trámites y atención pública.',
      url: 'https://ipa.cfe.edu.uy/index.php/bedelia',
      icon: 'fa-solid fa-building-columns',
      category: 'Institucional'
    },
    {
      title: 'DOE IPA',
      description: 'Departamento de Orientación Estudiantil.',
      url: 'https://ipa.cfe.edu.uy/index.php/doe',
      icon: 'fa-solid fa-handshake-angle',
      category: 'Apoyo'
    },
    {
      title: 'Resoluciones',
      description: 'Acceso a las últimas circulares y resoluciones de ANEP.',
      url: 'https://www.anep.edu.uy/resoluciones',
      icon: 'fa-solid fa-file-contract',
      category: 'Administración'
    },
    {
      title: 'Llamados ANEP',
      description: 'Concursos y llamados vigentes para pasantías y cargos.',
      url: 'https://www.anep.edu.uy/llamados',
      icon: 'fa-solid fa-bullhorn',
      category: 'Oportunidades'
    },
    {
      title: 'Certificados',
      description: 'Solicitud de certificados de estudio y escolaridades.',
      url: 'https://sge.cfe.edu.uy/p_certificados.php',
      icon: 'fa-solid fa-file-signature',
      category: 'Trámites'
    },
    {
      title: 'Calendario',
      description: 'Fechas de exámenes, parciales y recesos académicos.',
      url: 'https://ipa.cfe.edu.uy/index.php/calendario',
      icon: 'fa-solid fa-calendar-days',
      category: 'Académico'
    }
  ];

  getQuickLinks() {
    return this.quickLinks;
  }

  getUnifiedDoeData(): UnifiedDoeEntry[] {
    const grouped = this.rawDoeData.reduce((acc, current) => {
      const existing = acc.find(item => item.doe === current.doe);
      const shift: DoeShift = {
        turno: current.turno,
        horario: current.horario,
        titular: current.titular,
        tareas: current.tareas,
        email: current.email
      };

      if (existing) {
        existing.shifts.push(shift);
      } else {
        acc.push({
          doe: current.doe,
          shifts: [shift]
        });
      }
      return acc;
    }, [] as UnifiedDoeEntry[]);

    return grouped;
  }

  getAgendaData(): Observable<AgendaItem[]> {
    return this.http.get<AgendaItem[]>('data/agenda.json');
  }

  getNewsData(): Observable<NewsItem[]> {
    return this.http.get<NewsItem[]>('data/news.json');
  }

  getLlamadosData(): Observable<LlamadoItem[]> {
    return this.http.get<LlamadoItem[]>('data/llamados.json');
  }

  getInasistenciasData(): Observable<InasistenciaDocente[]> {
    return this.http.get<InasistenciaDocente[]>('data/inasistencias.json');
  }

  getHorariosData(): Observable<HorariosRoot> {
    return this.http.get<HorariosRoot>('data/horarios.json');
  }
}
