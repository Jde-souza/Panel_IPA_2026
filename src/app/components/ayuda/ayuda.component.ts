import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AlertService } from '../../services/alert.service';
import { AccessibilityService } from '../../services/accessibility.service';

export type HelpCategory =
  | 'todas'
  | 'salones'
  | 'horarios'
  | 'inasistencias'
  | 'examenes'
  | 'agenda'
  | 'doe'
  | 'configuracion'
  | 'inicio'
  | 'accesibilidad';

export type HelpAudience = 'todos' | 'consulta' | 'gestion';

export interface HelpStep {
  titulo: string;
  detalle: string;
}

export interface HelpGuide {
  id: string;
  categoria: Exclude<HelpCategory, 'todas'>;
  audiencia: 'consulta' | 'gestion' | 'ambos';
  titulo: string;
  resumen: string;
  icono: string;
  tiempoLectura: string;
  rutaModulo?: string;
  textoBotonModulo?: string;
  pasos: HelpStep[];
  consejo?: string;
  tags: string[];
}

export interface HelpFaq {
  id: string;
  categoria: Exclude<HelpCategory, 'todas'>;
  audiencia: 'consulta' | 'gestion' | 'ambos';
  pregunta: string;
  respuesta: string;
  rutaRelacionada?: string;
  textoRuta?: string;
  tags: string[];
}

export interface CategoryMeta {
  id: HelpCategory;
  nombre: string;
  icono: string;
  descripcion: string;
}

@Component({
  selector: 'app-ayuda',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './ayuda.component.html',
  styleUrl: './ayuda.component.css'
})
export class AyudaComponent {
  private alertService = inject(AlertService);
  private a11y = inject(AccessibilityService);

  searchTerm = '';
  selectedCategory: HelpCategory = 'todas';
  selectedAudience: HelpAudience = 'todos';

  expandedFaqIds = new Set<string>(['faq-examenes-desplegables', 'faq-qr-1', 'faq-1', 'faq-2']);
  expandedGuideIds = new Set<string>();
  selectedGuideModal: HelpGuide | null = null;

  quickSearchTags: string[] = [
    'Desplegables Exámenes',
    'Códigos QR Salones',
    'Horario actual salón',
    'Imprimir carteles QR',
    'Autoguardado',
    'Próxima clase',
    'Materias por año',
    'Licencias hoy',
    'Tribunales'
  ];

  categorias: CategoryMeta[] = [
    {
      id: 'todas',
      nombre: 'Todas las áreas',
      icono: 'fa-solid fa-layer-group',
      descripcion: 'Vista completa de guías y preguntas frecuentes del sistema'
    },
    {
      id: 'salones',
      nombre: 'Salones y QR',
      icono: 'fa-solid fa-qrcode',
      descripcion: 'Códigos QR para puertas de aula, clase en curso ahora y grilla ampliada por salón'
    },
    {
      id: 'horarios',
      nombre: 'Horarios y Grupos',
      icono: 'fa-solid fa-calendar-days',
      descripcion: 'Grillas por especialidad, turno, semestre y asignación de clases'
    },
    {
      id: 'inasistencias',
      nombre: 'Inasistencias',
      icono: 'fa-solid fa-user-slash',
      descripcion: 'Registro y consulta de licencias docentes y causales'
    },
    {
      id: 'examenes',
      nombre: 'Exámenes',
      icono: 'fa-solid fa-calendar-check',
      descripcion: 'Calendario de mesas de examen, planes, años y tribunales'
    },
    {
      id: 'agenda',
      nombre: 'Agenda Docente',
      icono: 'fa-solid fa-address-book',
      descripcion: 'Directorio de docentes y detección en vivo de clase en curso'
    },
    {
      id: 'doe',
      nombre: 'DOE y Centros',
      icono: 'fa-solid fa-user-group',
      descripcion: 'Adscriptos por turno/especialidad y red nacional de centros CFE'
    },
    {
      id: 'configuracion',
      nombre: 'Configuración',
      icono: 'fa-solid fa-sliders',
      descripcion: 'Catálogo global de materias, especialidades, salones y parámetros'
    },
    {
      id: 'inicio',
      nombre: 'Inicio y Novedades',
      icono: 'fa-solid fa-house',
      descripcion: 'Accesos rápidos, noticias educativas y llamados de ANEP/CFE'
    },
    {
      id: 'accesibilidad',
      nombre: 'Uso y Accesibilidad',
      icono: 'fa-solid fa-universal-access',
      descripcion: 'Modo oscuro, navegación por teclado y lectores de pantalla'
    }
  ];

  guias: HelpGuide[] = [
    {
      id: 'guia-salones-qr-consulta',
      categoria: 'salones',
      audiencia: 'consulta',
      titulo: 'Cómo escanear el QR de la puerta de un salón y ver su horario en vivo',
      resumen: 'Conocé al instante qué clase se está dictando ahora mismo en un aula, el cronograma del día y el acceso a su grilla semanal ampliada.',
      icono: 'fa-solid fa-mobile-screen-button',
      tiempoLectura: '2 min',
      rutaModulo: '/salones',
      textoBotonModulo: 'Ver Salones en Vivo',
      tags: ['codigos qr salones', 'qr', 'puerta', 'escanear', 'horario actual salon', 'en clase ahora', 'salon libre', 'informacion ampliada'],
      pasos: [
        {
          titulo: 'Escaneá el código QR pegado en la puerta del salón',
          detalle: 'Apuntá con la cámara de tu celular al código QR del aula (o ingresá desde el menú lateral a "Salones y QR" y seleccioná el salón).'
        },
        {
          titulo: 'Consultá en primer plano el Horario Actual del Salón',
          detalle: 'Lo primero que muestra la pantalla es el estado en tiempo real: si hay una clase dictándose en ese momento, verás el cartel "En clase ahora" con la Materia, Especialidad, Grupo, Docente, rango horario y barra de progreso. Si el aula está vacía, indicará "Salón disponible" junto con los datos de la Próxima clase.'
        },
        {
          titulo: 'Verificá alertas de Inasistencia y el Cronograma de Hoy',
          detalle: 'Si el docente de la clase actual registra una licencia activa hoy, el sistema muestra un aviso automático. Debajo encontrarás la lista ordenada con todas las clases de ese salón durante el día (finalizadas, en curso y próximas).'
        },
        {
          titulo: 'Accedé a la Información Ampliada de Horario del Salón',
          detalle: 'Tocando el botón "Ver Información Ampliada de Horario (Grilla Semanal Lunes a Viernes)" al pie del cronograma diario, se despliega la ocupación completa del salón en todos los turnos (Mañana, Tarde y Noche) y semestres.'
        }
      ],
      consejo: 'Desde cada clase listada en el salón podés tocar el botón "Horario del grupo" para saltar directamente al horario completo de esa carrera y grupo.'
    },
    {
      id: 'guia-salones-qr-gestion',
      categoria: 'salones',
      audiencia: 'gestion',
      titulo: 'Cómo generar e imprimir los Carteles QR para las puertas de los salones',
      resumen: 'Guía para adscriptos y administración sobre cómo imprimir carteles individuales A4 o grillas recortables por piso y usar el simulador horario.',
      icono: 'fa-solid fa-qrcode',
      tiempoLectura: '3 min',
      rutaModulo: '/salones',
      textoBotonModulo: 'Abrir Generador QR',
      tags: ['imprimir carteles qr', 'codigos qr salones', 'poster puerta', 'grilla recortable', 'descargar png', 'simulador', 'url base'],
      pasos: [
        {
          titulo: 'Ingresá al Generador QR desde Salones o Configuración',
          detalle: 'Podés abrir el generador haciendo clic en "Imprimir Carteles QR de Salones" dentro de la sección "Salones y QR" (/salones), o directamente desde Configuración > Salones usando el botón "Código QR" de cada tarjeta.'
        },
        {
          titulo: 'Seleccioná qué salones querés imprimir',
          detalle: 'En el paso 1 del modal elegí si querés imprimir "Un salón específico", "Todos los salones de un piso" (ej. Primer piso) o "Todos los salones" del instituto.'
        },
        {
          titulo: 'Elegí el Formato de Papel A4',
          detalle: 'Seleccioná "Cartel Grande de Puerta" para obtener 1 póster institucional completo por hoja A4 (con encabezado ANEP/CFE/IPA, número de salón gigante, piso, capacidad y recursos) o "Grilla Compacta (Recortable)" para imprimir varios códigos QR por hoja con líneas punteadas de corte.'
        },
        {
          titulo: 'Verificá la Dirección Web Base e imprimí o descargá en PNG',
          detalle: 'Revisá el campo "Dirección web base del QR" (por defecto toma el dominio actual del sistema) y presioná "Imprimir" para enviar a la impresora o guardar como PDF. También podés descargar cada QR individualmente en formato imagen PNG.'
        }
      ],
      consejo: 'Usá el botón "Simular otro día u hora" dentro de la vista de cualquier salón para comprobar de antemano cómo se verá la pantalla cuando los estudiantes escaneen el QR en el turno matutino, vespertino o nocturno.'
    },
    {
      id: 'guia-horarios-consulta',
      categoria: 'horarios',
      audiencia: 'consulta',
      titulo: 'Cómo consultar horarios por Especialidad, Turno y Semestre',
      resumen: 'Aprendé a navegar la grilla semanal en escritorio o la vista por día en celulares para ubicar aulas y docentes.',
      icono: 'fa-solid fa-table-cells',
      tiempoLectura: '2 min',
      rutaModulo: '/horarios',
      textoBotonModulo: 'Ir a Horarios',
      tags: ['horarios', 'grupos', 'turno', 'mañana', 'tarde', 'noche', 'semestre', 'grilla', 'salón'],
      pasos: [
        {
          titulo: 'Seleccioná la Especialidad',
          detalle: 'En el selector superior de la sección Horarios, elegí el profesorado o carrera correspondiente (por ejemplo: Historia, Matemática, Literatura).'
        },
        {
          titulo: 'Elegí el Grupo según su Turno',
          detalle: 'Los grupos se muestran organizados por turno (Mañana, Tarde y Noche). Hacé clic en el grupo deseado (ej. 1º A, 2º B) para cargar su grilla.'
        },
        {
          titulo: 'Alterná entre Primer y Segundo Semestre',
          detalle: 'Utilizá los botones "Semestre 1" y "Semestre 2" para visualizar las unidades curriculares anuales o semestrales correspondientes a cada período.'
        },
        {
          titulo: 'Identificá Materia, Docente y Salón',
          detalle: 'Cada bloque horario indica el nombre de la asignatura, el docente asignado y un distintivo con el número o nombre del salón.'
        }
      ],
      consejo: 'En pantallas móviles o tablets, la grilla semanal se transforma automáticamente en una lista vertical ordenada por día (Lunes a Viernes) para facilitar la lectura.'
    },
    {
      id: 'guia-horarios-gestion',
      categoria: 'horarios',
      audiencia: 'gestion',
      titulo: 'Cómo crear y editar grupos y bloques horarios',
      resumen: 'Guía para adscriptos y bedelía sobre cómo administrar grupos y asignar materias, docentes y salones.',
      icono: 'fa-solid fa-pen-to-square',
      tiempoLectura: '3 min',
      rutaModulo: '/horarios',
      textoBotonModulo: 'Gestionar Horarios',
      tags: ['administrar horarios', 'nuevo grupo', 'asignar salón', 'editar clase', 'sem1', 'sem2'],
      pasos: [
        {
          titulo: 'Abrí el panel de edición del horario',
          detalle: 'Dentro de la vista de Horarios, seleccioná la especialidad y presioná el botón de edición o creación de grupo para abrir el modal de gestión.'
        },
        {
          titulo: 'Definí los datos del grupo y semestre',
          detalle: 'Indicá el nombre del grupo, el turno y asegurate de estar editando el semestre correcto (Primer o Segundo Semestre).'
        },
        {
          titulo: 'Seleccioná Materia y Salón desde los catálogos dinámicos',
          detalle: 'Los desplegables de materias y salones se alimentan automáticamente de la Configuración del Sistema, mostrando solo las materias vinculadas a esa especialidad y los salones agrupados por piso.'
        },
        {
          titulo: 'Guardá los cambios',
          detalle: 'Al confirmar, el horario se actualiza inmediatamente en la base de datos y se refleja tanto en el código QR del salón como en el cálculo de "Próxima clase" de la Agenda Docente.'
        }
      ],
      consejo: 'Si una materia o un salón nuevo no aparece en el selector al armar un horario, agregalo primero desde Configuración > Materias o Configuración > Salones.'
    },
    {
      id: 'guia-inasistencias',
      categoria: 'inasistencias',
      audiencia: 'ambos',
      titulo: 'Consulta y registro de Inasistencias Docentes',
      resumen: 'Cómo verificar qué docentes están ausentes hoy, filtrar licencias por varios días y registrar nuevas inasistencias.',
      icono: 'fa-solid fa-user-clock',
      tiempoLectura: '2 min',
      rutaModulo: '/inasistencias',
      textoBotonModulo: 'Ir a Inasistencias',
      tags: ['inasistencias', 'licencias hoy', 'ausentes', 'causales', 'artículo', 'docentes'],
      pasos: [
        {
          titulo: 'Revisá los indicadores rápidos (KPIs)',
          detalle: 'En la parte superior verás tarjetas con el total de licencias activas, los docentes ausentes en la fecha de hoy y las licencias que abarcan múltiples días.'
        },
        {
          titulo: 'Filtrá por docente, grupo o estado',
          detalle: 'Usá el buscador de texto para encontrar rápidamente un apellido o materia, o aplicá los filtros rápidos ("Todas", "Ausentes hoy", "Múltiples días").'
        },
        {
          titulo: 'Registrá una nueva licencia (Gestión)',
          detalle: 'Hacé clic en "Nueva Inasistencia", completá el nombre del docente, el período (desde/hasta), los grupos afectados y seleccioná la causal normativa correspondiente.'
        },
        {
          titulo: 'Actualizá o eliminá registros vencidos',
          detalle: 'Cada tarjeta o fila permite editar los datos o eliminar el registro mediante el diálogo de confirmación institucional.'
        }
      ],
      consejo: 'Las inasistencias activas hoy se cruzan automáticamente con las pantallas de Salones QR para alertar si el docente del bloque actual está ausente.'
    },
    {
      id: 'guia-examenes',
      categoria: 'examenes',
      audiencia: 'consulta',
      titulo: 'Calendario de Exámenes y Tribunales',
      resumen: 'Búsqueda de fechas de examen por plan de estudios y año, consulta de tribunales y salones asignados.',
      icono: 'fa-solid fa-graduation-cap',
      tiempoLectura: '2 min',
      rutaModulo: '/examenes',
      textoBotonModulo: 'Ir a Exámenes',
      tags: ['exámenes', 'mesas', 'tribunales', 'plan 2023', 'fechas', 'salones'],
      pasos: [
        {
          titulo: 'Filtrá por Plan de Estudios y Año',
          detalle: 'Combiná el buscador con los selectores de Plan (ej. Plan 2023, Plan 2008) y Año (1º a 4º Año) para acotar el calendario a tu carrera.'
        },
        {
          titulo: 'Consultá los detalles agrupados por fecha',
          detalle: 'Las mesas se ordenan cronológicamente por día, mostrando la hora exacta, el salón asignado y los tres integrantes del tribunal examinador.'
        },
        {
          titulo: 'Buscá por Asignatura o por Docente',
          detalle: 'Escribí el nombre de la materia o el apellido de un docente en la barra de búsqueda para localizar de inmediato el día, la hora y el aula donde se rinde la prueba.'
        }
      ],
      consejo: 'También podés buscar por el apellido de un docente en el buscador de Exámenes para ver todas las mesas donde integra tribunal.'
    },
    {
      id: 'guia-examenes-gestion',
      categoria: 'examenes',
      audiencia: 'gestion',
      titulo: 'Cómo programar Mesas de Examen usando los Desplegables de Catálogo',
      resumen: 'Guía paso a paso sobre el nuevo formulario con menús desplegables para materias, planes, horarios, salones por piso y tribunales docentes.',
      icono: 'fa-solid fa-file-pen',
      tiempoLectura: '3 min',
      rutaModulo: '/examenes',
      textoBotonModulo: 'Programar Examen',
      tags: ['agregar examen', 'desplegables examenes', 'catalogos de examen', 'tribunales', 'materias', 'salones por piso', 'modo manual', 'nuevo examen'],
      pasos: [
        {
          titulo: 'Abrí el modal con "+ Nuevo Examen" o el botón de edición',
          detalle: 'Hacé clic en el botón "+ Nuevo Examen" de la cabecera del módulo o en el ícono de lápiz de cualquier tarjeta de examen existente.'
        },
        {
          titulo: 'Seleccioná la Asignatura con auto-completado de año',
          detalle: 'El desplegable lista las 369 materias registradas en el catálogo oficial en orden alfabético. Al seleccionar una asignatura con nivel asignado, el sistema auto-completa el Año Académico sugerido.'
        },
        {
          titulo: 'Elegí Año Académico y Plan de Estudios',
          detalle: 'Seleccioná el año (1º a 4º Año o combinaciones) y el Plan de Estudios oficial (Plan 2023, Plan 2023 Reformulación 2025, Plan 2008 o Plan 1986).'
        },
        {
          titulo: 'Programá Fecha, Horario de Inicio y Salón',
          detalle: 'Podés seleccionar una fecha de examen ya agendada o usar el selector de calendario nativo para autocompletar el día en formato natural (ej: "Lunes 15 de Diciembre"). En Hora elegí el turno sugerido (08:00, 13:30, 18:00, etc.) y en Salón seleccioná el aula agrupada según su piso en el edificio.'
        },
        {
          titulo: 'Designá a los 3 integrantes del Tribunal Examinador',
          detalle: 'Disponés de 3 selectores dedicados: Presidente (T1), Vocal 1 (T2) y Vocal 2 (T3), vinculados al directorio institucional de 154 docentes de la Agenda IPA.'
        },
        {
          titulo: 'Alterná al modo manual libre cuando lo necesites',
          detalle: 'Si necesitás ingresar una mesa especial, un docente invitado de otro centro o múltiples salones combinados (ej: "201, 202"), tocá el botón "Escribir manual" en la cabecera de cada campo o elegí "✏️ Personalizado..." del menú.'
        }
      ],
      consejo: 'Al editar un examen que ya tenía nombres especiales o fechas no convencionales, el sistema activa automáticamente el modo de texto libre sin alterar tus datos.'
    },
    {
      id: 'guia-agenda-proxima-clase',
      categoria: 'agenda',
      audiencia: 'ambos',
      titulo: 'Agenda Docente y cálculo en vivo de "Próxima Clase"',
      resumen: 'Cómo buscar datos de contacto de profesores y conocer en tiempo real en qué salón están dictando clase.',
      icono: 'fa-solid fa-stopwatch',
      tiempoLectura: '3 min',
      rutaModulo: '/agenda',
      textoBotonModulo: 'Ir a Agenda',
      tags: ['agenda', 'próxima clase', 'en clase ahora', 'teléfono', 'correo', 'docente', 'ubicar docente'],
      pasos: [
        {
          titulo: 'Buscá al docente por nombre, apellido o especialidad',
          detalle: 'Escribí en la barra de búsqueda de Agenda para filtrar instantáneamente el directorio de profesores del instituto.'
        },
        {
          titulo: 'Copiá correo o teléfono con un clic',
          detalle: 'Usá los botones rápidos en cada tarjeta para copiar la dirección de correo o el teléfono al portapapeles con confirmación visual.'
        },
        {
          titulo: 'Abrí la ficha detallada para ver su estado horario en vivo',
          detalle: 'Al hacer clic sobre un docente, el sistema cruza su nombre con todos los horarios cargados del semestre actual y te informa si está "En clase ahora" (indicando grupo, materia y salón) o cuál es su "Próxima clase" de la semana.'
        }
      ],
      consejo: 'Para que el detector de "Próxima clase" funcione con precisión, procurá escribir el nombre del docente de forma consistente tanto en la Agenda como en los bloques de Horarios.'
    },
    {
      id: 'guia-configuracion-catalogos',
      categoria: 'configuracion',
      audiencia: 'gestion',
      titulo: 'Configuración del Sistema: Autoguardado, Materias, Especialidades y Salones',
      resumen: 'Administrá los catálogos maestros que alimentan todos los formularios del panel con guardado automático.',
      icono: 'fa-solid fa-gears',
      tiempoLectura: '4 min',
      rutaModulo: '/configuracion',
      textoBotonModulo: 'Ir a Configuración',
      tags: ['configuración', 'autoguardado', 'materias por año', 'salones por piso', 'especialidades', 'planes'],
      pasos: [
        {
          titulo: 'Parámetros Generales con Autoguardado',
          detalle: 'En la pestaña "General" podés definir el Año Lectivo, Semestre Actual, Planes de Estudio, Causales de Inasistencia y Pisos del edificio. Cualquier cambio se guarda automáticamente tras unos instantes (verás el indicador "Autoguardado" arriba a la derecha).'
        },
        {
          titulo: 'Catálogo Global de Materias por Año',
          detalle: 'En la pestaña "Materias" creás las asignaturas una sola vez y podés asignarlas a un año específico (ej. 1º Año), a una combinación de años (ej. 2º, 3º y 4º Año) o a "Todos los años".'
        },
        {
          titulo: 'Vinculación con Especialidades',
          detalle: 'En la pestaña "Especialidades" administrás cada carrera y seleccionás qué materias del catálogo global le corresponden, filtrando cómodamente por año.'
        },
        {
          titulo: 'Salones organizados por Piso y acceso directo a QR',
          detalle: 'En la pestaña "Salones" registrás cada aula indicando su piso (Sub suelo, Planta baja, Primer piso, Segundo piso), capacidad y recursos. Desde cada tarjeta podés abrir directamente su Código QR o su estado en vivo.'
        }
      ],
      consejo: 'No necesitás presionar "Guardar Cambios" cada vez que agregás un salón o materia: el sistema sincroniza automáticamente con la base de datos local en cada acción.'
    },
    {
      id: 'guia-doe-centros',
      categoria: 'doe',
      audiencia: 'consulta',
      titulo: 'Directorio DOE (Adscriptos) y Red Nacional de Centros CFE',
      resumen: 'Encontrá qué adscripto atiende cada especialidad y turno, o consultá los datos de los 33 centros del CFE en el país.',
      icono: 'fa-solid fa-map-location-dot',
      tiempoLectura: '2 min',
      rutaModulo: '/doe',
      textoBotonModulo: 'Ir a Directorio DOE',
      tags: ['doe', 'adscriptos', 'bedelía', 'turnos', 'centros', 'cerp', 'ifd', 'departamentos'],
      pasos: [
        {
          titulo: 'Consultá tu Adscripto (DOE) por Turno o Especialidad',
          detalle: 'En la sección DOE podés filtrar por turno (Matutino, Vespertino, Nocturno) o buscar el nombre de tu especialidad para saber qué funcionario está asignado y en qué horario atiende.'
        },
        {
          titulo: 'Correos institucionales de Bedelía y DOE',
          detalle: 'En la misma pantalla tenés acceso directo a los correos oficiales de contacto según la carrera o sección.'
        },
        {
          titulo: 'Explorá el Directorio Nacional de Centros CFE',
          detalle: 'Desde la barra superior ("Centros"), filtrá por departamento o buscá por nombre para obtener dirección, teléfono, correo y sitio web de cualquier IFD, CeRP o Instituto del CFE.'
        }
      ],
      consejo: 'Usá el buscador de DOE escribiendo directamente el nombre de tu profesorado (ej. "Biología" o "Inglés") para ver al instante todos los adscriptos vinculados.'
    },
    {
      id: 'guia-accesibilidad-tema',
      categoria: 'accesibilidad',
      audiencia: 'ambos',
      titulo: 'Modo Oscuro, Teclado y Accesibilidad Institucional',
      resumen: 'Opciones visuales y atajos de navegación pensados para una experiencia cómoda e inclusiva.',
      icono: 'fa-solid fa-universal-access',
      tiempoLectura: '2 min',
      tags: ['modo oscuro', 'tema claro', 'accesibilidad', 'teclado', 'escape', 'lector de pantalla'],
      pasos: [
        {
          titulo: 'Alterná entre Modo Claro y Modo Oscuro',
          detalle: 'Desde el botón con ícono de sol/luna en el encabezado superior podés cambiar el tema visual en cualquier momento. Tu preferencia queda guardada en tu navegador.'
        },
        {
          titulo: 'Navegación rápida por teclado',
          detalle: 'Todos los modales de creación, edición y confirmación pueden cerrarse presionando la tecla Escape. Además, existe un enlace "Saltar al contenido principal" al presionar Tab al inicio de la página.'
        },
        {
          titulo: 'Soporte para Lectores de Pantalla (ARIA Live)',
          detalle: 'El sistema anuncia automáticamente los cambios de sección, resultados de filtrado y confirmaciones de copiado al portapapeles para usuarios de tecnologías asistivas.'
        }
      ],
      consejo: 'El Modo Oscuro mantiene los colores de acento institucionales de ANEP con contraste optimizado para reducir la fatiga visual en turnos nocturnos.'
    }
  ];

  faqs: HelpFaq[] = [
    {
      id: 'faq-qr-1',
      categoria: 'salones',
      audiencia: 'ambos',
      pregunta: '¿Qué información muestra en el celular el código QR pegado en la puerta de un salón?',
      respuesta: 'Al escanear el código QR de un salón se abre su pantalla en tiempo real (/salon/[Nombre]). En primer lugar destaca el Horario Actual: si se está dictando una clase ahora mismo muestra la materia, especialidad, grupo, docente, horario de inicio/fin y tiempo restante; si el salón está libre informa que está disponible y cuál es la próxima clase. Debajo muestra el cronograma completo de ese salón en el día y un botón para desplegar la Información Ampliada de Horario (grilla semanal de Lunes a Viernes).',
      rutaRelacionada: '/salones',
      textoRuta: 'Explorar Salones y QR',
      tags: ['qr', 'escanear', 'puerta', 'horario actual salon', 'informacion ampliada', 'salones']
    },
    {
      id: 'faq-qr-2',
      categoria: 'salones',
      audiencia: 'gestion',
      pregunta: '¿Qué diferencia hay entre "Cartel Grande de Puerta" y "Grilla Compacta" al imprimir los códigos QR?',
      respuesta: 'El formato "Cartel Grande de Puerta" imprime un póster institucional por cada hoja A4 con tipografía de alta visibilidad, ideal para colocar directamente en la puerta o cartelera de cada aula. El formato "Grilla Compacta (Recortable)" agrupa varias tarjetas QR por hoja A4 con bordes punteados de corte, pensado para imprimir un piso entero o todos los salones ahorrando papel.',
      rutaRelacionada: '/salones',
      textoRuta: 'Abrir Impresor QR',
      tags: ['imprimir carteles qr', 'poster', 'grilla', 'a4', 'puerta', 'recortar']
    },
    {
      id: 'faq-qr-3',
      categoria: 'salones',
      audiencia: 'gestion',
      pregunta: '¿Hay que volver a imprimir el código QR de la puerta cuando cambia el horario o el semestre?',
      respuesta: 'No. El código QR codifica el enlace permanente de ese salón (por ejemplo /salon/Salón%2010). Cada vez que se modifica una clase en Horarios o se cambia del Primer al Segundo Semestre en Configuración, la información que ven quienes escanean el QR en la puerta se actualiza automáticamente en tiempo real sin necesidad de reemplazar el cartel impreso.',
      rutaRelacionada: '/salones',
      textoRuta: 'Ir a Salones y QR',
      tags: ['qr', 'cambiar horario', 'semestre', 'reimprimir', 'actualizar']
    },
    {
      id: 'faq-qr-4',
      categoria: 'salones',
      audiencia: 'ambos',
      pregunta: '¿Cómo avisa la pantalla del salón si el docente de la clase actual no asistió hoy?',
      respuesta: 'La vista en vivo del salón cruza automáticamente el nombre del docente de cada bloque horario con las licencias activas del día en el módulo de Inasistencias. Si el profesor registra una inasistencia que incluye la fecha de hoy, aparece una alerta destacada indicando la ausencia y su causal.',
      rutaRelacionada: '/inasistencias',
      textoRuta: 'Ver Inasistencias',
      tags: ['qr', 'inasistencia', 'ausente', 'docente', 'alerta', 'salón']
    },
    {
      id: 'faq-1',
      categoria: 'configuracion',
      audiencia: 'gestion',
      pregunta: '¿Por qué no aparece una materia o un salón cuando intento cargar un horario?',
      respuesta: 'Los selectores del módulo de Horarios están sincronizados con la Configuración del Sistema. Para que una materia aparezca al editar el horario de una especialidad, primero debe existir en el Catálogo Global de Materias y estar vinculada a dicha Especialidad en la sección Configuración. Del mismo modo, los salones se administran desde Configuración > Salones.',
      rutaRelacionada: '/configuracion',
      textoRuta: 'Ir a Configuración',
      tags: ['horarios', 'materia no aparece', 'salón', 'configuración', 'especialidades']
    },
    {
      id: 'faq-2',
      categoria: 'agenda',
      audiencia: 'ambos',
      pregunta: '¿Cómo sabe la Agenda en qué salón está un docente en este momento?',
      respuesta: 'Al abrir la ficha de un docente en la Agenda, el sistema consulta automáticamente los horarios del semestre activo (definido en Configuración > General) y compara el día y la hora actual del reloj con los bloques horarios donde figura ese docente. Así determina si tiene una clase en curso o cuál es su próxima clase programada.',
      rutaRelacionada: '/agenda',
      textoRuta: 'Probar en Agenda',
      tags: ['agenda', 'próxima clase', 'en vivo', 'horarios', 'docente']
    },
    {
      id: 'faq-3',
      categoria: 'configuracion',
      audiencia: 'gestion',
      pregunta: '¿Cómo asigno una materia que se dicta en más de un año (por ejemplo 2º y 3º Año)?',
      respuesta: 'En Configuración > Materias, al crear o editar una materia podés marcar múltiples casillas de año (1º, 2º, 3º, 4º Año) o usar el botón "Todos los años". El sistema mostrará una etiqueta resumida (por ejemplo "2º y 3º Año") y permitirá filtrarla en cualquiera de esos niveles.',
      rutaRelacionada: '/configuracion',
      textoRuta: 'Administrar Materias',
      tags: ['materias', 'años', 'multiaño', 'catálogo global', 'configuración']
    },
    {
      id: 'faq-4',
      categoria: 'horarios',
      audiencia: 'ambos',
      pregunta: '¿Cómo cambio el semestre que se muestra por defecto en Horarios y Salones QR?',
      respuesta: 'Cualquier usuario puede alternar manualmente entre "Semestre 1" y "Semestre 2" dentro de Horarios o de la vista de un Salón. Si sos administrador o adscripto y querés cambiar cuál es el semestre activo general del instituto para todo el sistema, podés cambiarlo en Configuración > General > Semestre Actual.',
      rutaRelacionada: '/horarios',
      textoRuta: 'Ver Horarios',
      tags: ['semestre', 'sem1', 'sem2', 'horarios', 'por defecto']
    },
    {
      id: 'faq-5',
      categoria: 'inasistencias',
      audiencia: 'ambos',
      pregunta: '¿Qué significa el indicador "Ausentes Hoy" en la sección de Inasistencias?',
      respuesta: 'Contabiliza todas las licencias docentes cuya fecha de inicio es igual o anterior al día de la fecha y cuya fecha de finalización es igual o posterior a hoy, permitiendo a estudiantes y bedelía identificar de un vistazo qué clases del día están afectadas.',
      rutaRelacionada: '/inasistencias',
      textoRuta: 'Ver Inasistencias',
      tags: ['inasistencias', 'ausentes hoy', 'licencias', 'fechas']
    },
    {
      id: 'faq-6',
      categoria: 'inicio',
      audiencia: 'consulta',
      pregunta: '¿Con qué frecuencia se actualizan las Noticias y los Llamados de ANEP en el Inicio?',
      respuesta: 'El panel cuenta con extractores automatizados que sincronizan periódicamente las últimas novedades de los portales oficiales (CFE, ANEP, DGEIP, DGES, UTU) y los llamados a aspiraciones y concursos docentes y no docentes.',
      rutaRelacionada: '/home',
      textoRuta: 'Ir al Inicio',
      tags: ['noticias', 'llamados', 'concursos', 'anep', 'cfe', 'inicio']
    },
        {
      id: 'faq-examenes-desplegables',
      categoria: 'examenes',
      audiencia: 'gestion',
      pregunta: '¿Cómo funciona el nuevo formulario con menús desplegables para cargar o editar exámenes?',
      respuesta: 'El modal de creación/edición de mesas de examen incorpora menús desplegables conectados directamente a la base de datos institucional: catálogo de 369 materias con auto-completado del año lectivo, planes de estudio oficiales, fechas agendadas con selector de calendario, franjas horarias estándar, salones ordenados por piso con capacidad y 3 selectores dedicados para Presidente, Vocal 1 y Vocal 2 conectados al directorio de 154 docentes del instituto.',
      rutaRelacionada: '/examenes',
      textoRuta: 'Ver Módulo de Exámenes',
      tags: ['examenes', 'desplegables', 'catalogos', 'tribunal', 'materias', 'salones', 'agregar examen', 'desplegables examenes']
    },
    {
      id: 'faq-examenes-modo-manual',
      categoria: 'examenes',
      audiencia: 'gestion',
      pregunta: '¿Qué hago si un docente, materia o salón no figura en la lista desplegable del examen?',
      respuesta: 'Cada campo del modal cuenta con un botón en la esquina superior derecha ("Escribir manual" / "Elegir de lista") y una opción "✏️ Ingresar texto personalizado..." dentro del propio menú. Podés alternar en cualquier momento para escribir nombres libres (por ejemplo, tribunales con profesores invitados de otros centros, exámenes compartidos en varios salones o asignaturas especiales no catalogadas).',
      rutaRelacionada: '/examenes',
      textoRuta: 'Gestionar Exámenes',
      tags: ['modo manual', 'personalizado', 'docente no aparece', 'escribir manual', 'custom', 'examenes']
    },
    {
      id: 'faq-examenes-autocompletado-anio',
      categoria: 'examenes',
      audiencia: 'gestion',
      pregunta: '¿Por qué al elegir una materia en el examen se completa automáticamente el año académico?',
      respuesta: 'El sistema aprovecha la información del Catálogo Global de Materias cargado en Configuración. Si la asignatura seleccionada tiene un año definido (por ejemplo "3º Año"), el formulario lo sugiere y pre-completa de inmediato para acelerar la carga y evitar inconsistencias en el calendario.',
      rutaRelacionada: '/examenes',
      textoRuta: 'Probar en Exámenes',
      tags: ['autocompletado', 'año', 'materia', 'catalogo global', 'examenes']
    },
    {
      id: 'faq-7',
      categoria: 'examenes',
      audiencia: 'consulta',
      pregunta: '¿Cómo puedo buscar únicamente los exámenes donde un docente específico integra tribunal?',
      respuesta: 'En el Calendario de Exámenes, escribí el nombre o apellido del docente en el campo de búsqueda principal. El filtro busca coincidencias tanto en el nombre de la asignatura como en los tres miembros del tribunal examinador.',
      rutaRelacionada: '/examenes',
      textoRuta: 'Buscar en Exámenes',
      tags: ['exámenes', 'tribunal', 'docente', 'buscador']
    },
    {
      id: 'faq-8',
      categoria: 'configuracion',
      audiencia: 'gestion',
      pregunta: '¿Se pierden mis cambios en Configuración si cierro la pestaña sin tocar "Guardar Cambios"?',
      respuesta: 'No. El módulo de Configuración cuenta con autoguardado inteligente: cada vez que creás, editás o eliminás una materia, especialidad o salón se persiste al instante, y los campos de texto general se guardan automáticamente tras 700 ms o al salir de la pantalla.',
      rutaRelacionada: '/configuracion',
      textoRuta: 'Ir a Configuración',
      tags: ['autoguardado', 'guardar', 'configuración', 'perder cambios']
    }
  ];

  internosIpa = [
    { interno: '200', sector: 'Mesa Central / Informes', icono: 'fa-solid fa-phone-volume' },
    { interno: '204', sector: 'Dirección del Instituto', icono: 'fa-solid fa-building-columns' },
    { interno: '205', sector: 'Bedelía Estudiantil y Docente', icono: 'fa-solid fa-clipboard-user' },
    { interno: '217', sector: 'Biblioteca Central', icono: 'fa-solid fa-book-bookmark' },
    { interno: '219', sector: 'Departamento Docente / DOE', icono: 'fa-solid fa-users-rectangle' }
  ];

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.selectedGuideModal) {
      this.closeGuideModal();
    }
  }

  get filteredGuias(): HelpGuide[] {
    const term = this.normalizeText(this.searchTerm);
    return this.guias.filter(g => {
      const matchesCategory = this.selectedCategory === 'todas' || g.categoria === this.selectedCategory;
      const matchesAudience =
        this.selectedAudience === 'todos' ||
        g.audiencia === 'ambos' ||
        g.audiencia === this.selectedAudience;

      if (!matchesCategory || !matchesAudience) return false;
      if (!term) return true;

      const haystack = this.normalizeText(
        `${g.titulo} ${g.resumen} ${g.tags.join(' ')} ${g.pasos.map(p => p.titulo + ' ' + p.detalle).join(' ')} ${g.consejo || ''}`
      );
      return haystack.includes(term);
    });
  }

  get filteredFaqs(): HelpFaq[] {
    const term = this.normalizeText(this.searchTerm);
    return this.faqs.filter(f => {
      const matchesCategory = this.selectedCategory === 'todas' || f.categoria === this.selectedCategory;
      const matchesAudience =
        this.selectedAudience === 'todos' ||
        f.audiencia === 'ambos' ||
        f.audiencia === this.selectedAudience;

      if (!matchesCategory || !matchesAudience) return false;
      if (!term) return true;

      const haystack = this.normalizeText(`${f.pregunta} ${f.respuesta} ${f.tags.join(' ')}`);
      return haystack.includes(term);
    });
  }

  get totalResultsCount(): number {
    return this.filteredGuias.length + this.filteredFaqs.length;
  }

  getCategoryCount(catId: HelpCategory): number {
    const term = this.normalizeText(this.searchTerm);
    const matchesGuide = (g: HelpGuide) => {
      const audOk = this.selectedAudience === 'todos' || g.audiencia === 'ambos' || g.audiencia === this.selectedAudience;
      if (!audOk) return false;
      if (catId !== 'todas' && g.categoria !== catId) return false;
      if (!term) return true;
      const haystack = this.normalizeText(
        `${g.titulo} ${g.resumen} ${g.tags.join(' ')} ${g.pasos.map(p => p.titulo + ' ' + p.detalle).join(' ')}`
      );
      return haystack.includes(term);
    };

    const matchesFaq = (f: HelpFaq) => {
      const audOk = this.selectedAudience === 'todos' || f.audiencia === 'ambos' || f.audiencia === this.selectedAudience;
      if (!audOk) return false;
      if (catId !== 'todas' && f.categoria !== catId) return false;
      if (!term) return true;
      const haystack = this.normalizeText(`${f.pregunta} ${f.respuesta} ${f.tags.join(' ')}`);
      return haystack.includes(term);
    };

    return this.guias.filter(matchesGuide).length + this.faqs.filter(matchesFaq).length;
  }

  getCategoryName(catId: Exclude<HelpCategory, 'todas'>): string {
    return this.categorias.find(c => c.id === catId)?.nombre || catId;
  }

  setCategory(catId: HelpCategory) {
    this.selectedCategory = catId;
    const catName = this.categorias.find(c => c.id === catId)?.nombre || catId;
    this.a11y.announce(`Categoría seleccionada: ${catName}. ${this.totalResultsCount} resultados disponibles.`, 'polite');
  }

  setAudience(aud: HelpAudience) {
    this.selectedAudience = aud;
    const labels: Record<HelpAudience, string> = {
      todos: 'Todos los perfiles',
      consulta: 'Consultas generales',
      gestion: 'Gestión y administración'
    };
    this.a11y.announce(`Filtro de perfil: ${labels[aud]}. ${this.totalResultsCount} resultados.`, 'polite');
  }

  applyQuickTag(tag: string) {
    if (this.searchTerm.toLowerCase() === tag.toLowerCase()) {
      this.clearSearch();
      return;
    }
    this.searchTerm = tag;
    this.selectedCategory = 'todas';
    this.a11y.announce(`Buscando ${tag}: ${this.totalResultsCount} resultados encontrados.`, 'polite');
  }

  clearSearch() {
    this.searchTerm = '';
    this.a11y.announce('Búsqueda limpiada.', 'polite');
  }

  resetAllFilters() {
    this.searchTerm = '';
    this.selectedCategory = 'todas';
    this.selectedAudience = 'todos';
    this.a11y.announce('Todos los filtros fueron restablecidos.', 'polite');
  }

  toggleFaq(id: string) {
    if (this.expandedFaqIds.has(id)) {
      this.expandedFaqIds.delete(id);
    } else {
      this.expandedFaqIds.add(id);
    }
  }

  isFaqExpanded(id: string): boolean {
    return this.expandedFaqIds.has(id);
  }

  expandAllFaqs() {
    if (this.areAllFilteredFaqsExpanded) {
      this.filteredFaqs.forEach(f => this.expandedFaqIds.delete(f.id));
      this.a11y.announce('Preguntas frecuentes contraídas', 'polite');
    } else {
      this.filteredFaqs.forEach(f => this.expandedFaqIds.add(f.id));
      this.a11y.announce('Todas las preguntas frecuentes expandidas', 'polite');
    }
  }

  get areAllFilteredFaqsExpanded(): boolean {
    const list = this.filteredFaqs;
    return list.length > 0 && list.every(f => this.expandedFaqIds.has(f.id));
  }

  toggleGuideInline(id: string) {
    if (this.expandedGuideIds.has(id)) {
      this.expandedGuideIds.delete(id);
    } else {
      this.expandedGuideIds.add(id);
    }
  }

  isGuideExpanded(id: string): boolean {
    return this.expandedGuideIds.has(id);
  }

  openGuideModal(guia: HelpGuide) {
    this.selectedGuideModal = guia;
    this.a11y.announce(`Abierta la guía paso a paso: ${guia.titulo}`, 'polite');
  }

  closeGuideModal() {
    this.selectedGuideModal = null;
    this.a11y.announce('Guía cerrada', 'polite');
  }

  async copyToClipboard(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      this.alertService.success(`${label} copiado al portapapeles: ${text}`, 3000, 'Copiado');
      this.a11y.announce(`${label} ${text} copiado al portapapeles`, 'polite');
    } catch {
      this.alertService.error('No se pudo copiar al portapapeles', 4000, 'Error');
    }
  }

  private normalizeText(value: string): string {
    return (value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
}
