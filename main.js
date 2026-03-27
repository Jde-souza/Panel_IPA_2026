import './style.css';

const quickLinks = [
    {
        title: 'SGE',
        description: 'Sistema de Gestión Estudiantil - Inscripciones y notas.',
        url: 'https://sge.cfe.edu.uy/',
        icon: '📊',
        category: 'Gestión'
    },
    {
        title: 'Moodle CFE',
        description: 'Entorno virtual de aprendizaje para cursos y materiales.',
        url: 'https://moodle.cfe.edu.uy/',
        icon: '🎓',
        category: 'Educación'
    },
    {
        title: 'Bedelía IPA',
        description: 'Información sobre horarios, trámites y atención pública.',
        url: 'https://ipa.cfe.edu.uy/index.php/bedelia',
        icon: '🏢',
        category: 'Institucional'
    },
    {
        title: 'DOE IPA',
        description: 'Departamento de Orientación Estudiantil.',
        url: 'https://ipa.cfe.edu.uy/index.php/doe',
        icon: '🤝',
        category: 'Apoyo'
    },
    {
        title: 'Resoluciones',
        description: 'Acceso a las últimas circulares y resoluciones de ANEP.',
        url: 'https://www.anep.edu.uy/resoluciones',
        icon: '📜',
        category: 'Administración'
    },
    {
        title: 'Llamados ANEP',
        description: 'Concursos y llamados vigentes para pasantías y cargos.',
        url: 'https://www.anep.edu.uy/llamados',
        icon: '📢',
        category: 'Oportunidades'
    },
    {
        title: 'Certificados',
        description: 'Solicitud de certificados de estudio y escolaridades.',
        url: 'https://sge.cfe.edu.uy/p_certificados.php',
        icon: '📄',
        category: 'Trámites'
    },
    {
        title: 'Calendario',
        description: 'Fechas de exámenes, parciales y recesos académicos.',
        url: 'https://ipa.cfe.edu.uy/index.php/calendario',
        icon: '📅',
        category: 'Académico'
    }
];

const doeData = [
    { doe: 'BRACCO, Gastón', turno: 'Nocturno', horario: '18:00 a 22:00', titular: 'NAYA, Adriana (T)', tareas: 'Física / Astronomía' },
    { doe: 'COLMAN, Gabriela', turno: 'Matutino', horario: '8:00 a 12:00', titular: 'COLMAN Gabriela 1er cargo', tareas: 'Didáctica / Ed. Musical' },
    { doe: 'COLMAN, Gabriela', turno: 'Intermedio-Nocturno', horario: 'Lun, miérc., viernes 12:00 a 16:00 - Martes y jueves 18:30 a 22:30', titular: 'COLMAN Gabriela 2do cargo', tareas: 'Matemática' },
    { doe: 'TORRES, Carla', turno: 'Nocturno', horario: '18:00 a 22:00', titular: 'TORRES Carla', tareas: 'Español - Filosofía' },
    { doe: 'VACANTE', turno: 'Nocturno / Matutino', horario: 'Martes a viernes: 19:45 a 23:45 | Sábados: 08:00 a 12:00', titular: 'SARAIBE, Esteban', tareas: '-' },
    { doe: 'CARABAJAL, Pierángeli', turno: 'Matutino', horario: '09:00 a 13:00', titular: '-', tareas: 'Didáctica / Inglés' },
    { doe: 'MACHADO, Nicolás', turno: 'Intermedio / Matutino', horario: 'Martes a viernes 19:00 a 23:00 | Sábado: 08:00 a 12:00', titular: 'DE LEMA, Solange', tareas: 'Literatura' },
    { doe: 'BASTIDA, Carolina', turno: 'Vespertino', horario: '17:00 a 21:00', titular: 'BASTIDA, Carolina', tareas: 'Historia' },
    { doe: 'NIELLI, Rosana', turno: 'Intermedio', horario: '14:00 a 18:00', titular: 'IRIGOYEN, Marta (T)', tareas: 'Danza + Cs. Geográficas + BECAS' },
    { doe: 'DE LEÓN, Valeria', turno: 'Matutino-Vespertino', horario: 'Lunes a miércoles 18:00 a 22:00 / Jueves y viernes 8 a 12', titular: 'DE LEÓN, Valeria', tareas: 'Com. Visual / Derecho y Sociología' },
    { doe: 'OLANO, Eugenia', turno: 'Nocturno', horario: '19:30 a 23:30', titular: 'OLANO, Eugenia', tareas: 'Cs. Biológicas / Química' },
    { doe: 'OVIEDO, Tabaré', turno: 'Nocturno', horario: '14:00 a 18:00', titular: 'OVIEDO, Tabaré', tareas: 'Italiano-Francés-Portugués-Alemán' }
];

function renderHome() {
    const mainContent = document.querySelector('.main-content');
    mainContent.innerHTML = `
        <section class="welcome-banner">
            <h2>Bienvenido a Bedelía del IPA</h2>
            <p>Acceso rápido a la información elemental del instituto y ANEP.</p>
        </section>
        <div class="quick-access-grid" id="quick-links"></div>
    `;
    renderQuickLinks();
}

function renderDOESection(filter = 'Todos') {
    const mainContent = document.querySelector('.main-content');
    const filteredData = filter === 'Todos' ? doeData : doeData.filter(d => d.turno.toLowerCase().includes(filter.toLowerCase()));

    mainContent.innerHTML = `
        <section class="section-header">
            <h2>Horarios DOE</h2>
            <p>Departamento de Orientación Estudiantil - Planificación de Turnos</p>
            <div class="filter-bar">
                <button class="filter-btn ${filter === 'Todos' ? 'active' : ''}" data-filter="Todos">Todos</button>
                <button class="filter-btn ${filter === 'Matutino' ? 'active' : ''}" data-filter="Matutino">Matutino</button>
                <button class="filter-btn ${filter === 'Intermedio' ? 'active' : ''}" data-filter="Intermedio">Intermedio</button>
                <button class="filter-btn ${filter === 'Vespertino' ? 'active' : ''}" data-filter="Vespertino">Vespertino</button>
                <button class="filter-btn ${filter === 'Nocturno' ? 'active' : ''}" data-filter="Nocturno">Nocturno</button>
            </div>
        </section>
        
        <div class="table-container fade-in">
            <table class="doe-table">
                <thead>
                    <tr>
                        <th>Orientador (DOE)</th>
                        <th>Turno</th>
                        <th>Horario</th>
                        <th>Titular</th>
                        <th>Bedelías/Tareas</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredData.map(item => `
                        <tr>
                            <td class="bold">${item.doe}</td>
                            <td><span class="badge ${item.turno.toLowerCase().includes('nocturno') ? 'nocturno' : 'diurno'}">${item.turno}</span></td>
                            <td class="horario-text">${item.horario}</td>
                            <td>${item.titular}</td>
                            <td class="info-text">${item.tareas}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    // Re-attach filter events
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.onclick = () => renderDOESection(btn.dataset.filter);
    });
}

function renderQuickLinks() {
    const grid = document.getElementById('quick-links');
    if (!grid) return;

    grid.innerHTML = quickLinks.map(link => `
        <article class="glass-card link-card" onclick="${link.title === 'DOE IPA' ? 'renderDOESection()' : `window.open('${link.url}', '_blank')`}">
            <div class="card-icon">${link.icon}</div>
            <div class="card-content">
                <span class="category-tag">${link.category}</span>
                <h3>${link.title}</h3>
                <p>${link.description}</p>
            </div>
            <div class="card-arrow">→</div>
        </article>
    `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    renderHome();

    // Global Navigation
    document.querySelectorAll('.nav-item, .side-item').forEach(link => {
        link.onclick = (e) => {
            const text = link.innerText.trim();
            if (text === 'DOE') {
                e.preventDefault();
                renderDOESection();
                updateActiveLink(link);
            } else if (text === 'Inicio') {
                e.preventDefault();
                renderHome();
                updateActiveLink(link);
            }
        };
    });

    function updateActiveLink(activeEl) {
        document.querySelectorAll('.side-item').forEach(l => l.classList.remove('active'));
        if (activeEl.classList.contains('side-item')) {
            activeEl.classList.add('active');
        }
    }

    // Add scroll effect for header
    window.addEventListener('scroll', () => {
        const header = document.querySelector('.header');
        if (header && window.scrollY > 20) {
            header.classList.add('scrolled');
        } else if (header) {
            header.classList.remove('scrolled');
        }
    });
});
