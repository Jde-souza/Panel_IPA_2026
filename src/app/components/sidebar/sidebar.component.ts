import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DataService, QuickLink } from '../../data.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <aside class="sidebar">
      <nav class="side-nav">
        <div class="nav-group">
          <h3>Acceso rapido</h3>
          <a routerLink="/home" routerLinkActive="active" class="side-item">
            <i class="fa-solid fa-house-chimney icon-margin" aria-hidden="true"></i> Inicio
          </a>
          <a href="https://sge.cfe.edu.uy/" target="_blank" class="side-item" aria-label="SGE (abre en nueva pestaña)">
            <i class="fa-solid fa-chart-column icon-margin" aria-hidden="true"></i> SGE
          </a>
          <a href="https://ipa.cfe.edu.uy/" target="_blank" class="side-item" aria-label="IPA (abre en nueva pestaña)">
            <i class="fa-solid fa-school icon-margin" aria-hidden="true"></i> IPA
          </a>
          <a href="https://www.cfe.edu.uy/" target="_blank" class="side-item" aria-label="CFE (abre en nueva pestaña)">
            <i class="fa-solid fa-building-columns icon-margin" aria-hidden="true"></i> CFE
          </a>
        </div>
        <div class="nav-group">
          <h3>IPA estudiantes</h3>
          <a routerLink="/horarios" routerLinkActive="active" class="side-item">
            <i class="fa-solid fa-calendar-alt icon-margin" aria-hidden="true"></i> Horarios 2026
          </a>
          <a routerLink="/inasistencias" routerLinkActive="active" class="side-item">
            <i class="fa-solid fa-clipboard-user icon-margin" aria-hidden="true"></i> Inasistencias Docentes
          </a>
          <a href="https://ipa.cfe.edu.uy/images/pdf/2023/AE7_R003_E_62-23_Complem_Res_Presid_43-23_Tablas_equivalencias_2do_ao_Planes_anteriores_con_Plan_2023_carreras_CFE_1.pdf" target="_blank" class="side-item" aria-label="Tabla de Equivalencias (abre en nueva pestaña)">
            <i class="fa-solid fa-table-list icon-margin" aria-hidden="true"></i> Tabla de Equivalencias
          </a>
          <a href="https://www.cfe.edu.uy/index.php/estudiantes/estudiantes-2/planes-y-programas" target="_blank" class="side-item" aria-label="Planes y Programas (abre en nueva pestaña)">
            <i class="fa-solid fa-book-open icon-margin" aria-hidden="true"></i> Planes y Programas
          </a>
          <a href="https://ipa.cfe.edu.uy/index.php/2017-05-05-12-53-04/revalidas-formularios" target="_blank" class="side-item" aria-label="Reválidas (abre en nueva pestaña)">
            <i class="fa-solid fa-file-export icon-margin" aria-hidden="true"></i> Reválidas
          </a>
          <a href="https://ipa.cfe.edu.uy/index.php/431-examenes#" target="_blank" class="side-item" aria-label="Exámenes (abre en nueva pestaña)">
            <i class="fa-solid fa-file-lines icon-margin" aria-hidden="true"></i> Exámenes
          </a>
        </div>

        <div class="nav-group">
          <h3>IPA DOCENTES</h3>
          <a href="https://ipa.cfe.edu.uy/index.php/docentes/elecciones-de-horas-2" target="_blank" class="side-item" aria-label="Elección de horas (abre en nueva pestaña)">
            <i class="fa-solid fa-clock-rotate-left icon-margin" aria-hidden="true"></i> Elección de horas
          </a>
          <a href="https://ipa.cfe.edu.uy/index.php/docentes/listas-de-habilitados-para-2023" target="_blank" class="side-item" aria-label="Lista de habilitados (abre en nueva pestaña)">
            <i class="fa-solid fa-list-check icon-margin" aria-hidden="true"></i> Lista de habilitados
          </a>
          <a href="https://ipa.cfe.edu.uy/index.php/docentes/llamados-abreviados" target="_blank" class="side-item" aria-label="Llamados abreviados (abre en nueva pestaña)">
            <i class="fa-solid fa-bullhorn icon-margin" aria-hidden="true"></i> Llamados abreviados
          </a>
          <a href="https://ipa.cfe.edu.uy/index.php/docentes/didactica-practica-docente" target="_blank" class="side-item" aria-label="Didáctica práctica (abre en nueva pestaña)">
            <i class="fa-solid fa-chalkboard-user icon-margin" aria-hidden="true"></i> Didáctica práctica
          </a>
        </div>
      </nav>
    </aside>
  `,
  styles: [`
    .side-item {
      cursor: pointer;
    }
  `]
})
export class SidebarComponent {
  private router = inject(Router);

  handleLinkClick(link: any) {
    if (link.title === 'DOE IPA') {
      this.router.navigate(['/doe']);
    } else {
      window.open(link.url, '_blank');
    }
  }
}
