import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { FooterComponent } from './components/footer/footer.component';
import { AccessibilityService } from './services/accessibility.service';
import { AlertService } from './services/alert.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, HeaderComponent, SidebarComponent, FooterComponent],
  template: `
    <div class="grid-container">
      <a href="#main-content" class="skip-link">Saltar al contenido principal</a>
      <app-header />
      <app-sidebar />
      <main class="main-content" id="main-content">
        <router-outlet />
      </main>
      <app-footer />

      <!-- Bottom Navigation Bar (solo móvil/tablet) -->
      <nav class="mobile-bottom-nav" aria-label="Navegación principal móvil">
        <a routerLink="/home" routerLinkActive="active" aria-label="Inicio">
          <i class="fa-solid fa-house" aria-hidden="true"></i>
          <span>Inicio</span>
        </a>
        <a routerLink="/horarios" routerLinkActive="active" aria-label="Horarios">
          <i class="fa-solid fa-calendar-days" aria-hidden="true"></i>
          <span>Horarios</span>
        </a>
        <a routerLink="/inasistencias" routerLinkActive="active" aria-label="Inasistencias">
          <i class="fa-solid fa-user-slash" aria-hidden="true"></i>
          <span>Inasist.</span>
        </a>
        <a routerLink="/doe" routerLinkActive="active" aria-label="DOE">
          <i class="fa-solid fa-user-group" aria-hidden="true"></i>
          <span>DOE</span>
        </a>
        <a routerLink="/agenda" routerLinkActive="active" aria-label="Agenda">
          <i class="fa-solid fa-address-book" aria-hidden="true"></i>
          <span>Agenda</span>
        </a>
      </nav>

      <!-- Toast Alerts Container -->
      <div class="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm pointer-events-none">
        <div *ngFor="let alert of alertService.alerts()" 
             class="pointer-events-auto shadow-2xl rounded-xl p-4 flex items-start gap-3 fade-in translate-y-0"
             [ngClass]="{
               'bg-green-100 border-l-4 border-green-500 text-green-800': alert.type === 'success',
               'bg-red-100 border-l-4 border-red-500 text-red-800': alert.type === 'error',
               'bg-blue-100 border-l-4 border-blue-500 text-blue-800': alert.type === 'info',
               'bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800': alert.type === 'warning'
             }"
             role="alert">
          <div class="shrink-0 mt-0.5">
            <i class="fa-solid" [ngClass]="{
              'fa-circle-check text-green-600': alert.type === 'success',
              'fa-circle-exclamation text-red-600': alert.type === 'error',
              'fa-circle-info text-blue-600': alert.type === 'info',
              'fa-triangle-exclamation text-yellow-600': alert.type === 'warning'
            }"></i>
          </div>
          <div class="flex-grow text-sm font-medium pr-4">{{ alert.message }}</div>
          <button (click)="alertService.remove(alert.id)" class="shrink-0 opacity-50 hover:opacity-100 transition-opacity">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>

      <!-- Centralized ARIA Live Region -->
      <div class="sr-only" 
           role="status" 
           [attr.aria-live]="a11y.currentPriority()" 
           aria-atomic="true">
        {{ a11y.currentAnnouncement() }}
      </div>
    </div>
  `,
  styles: []
})
export class App implements OnInit {
  public a11y = inject(AccessibilityService);
  public alertService = inject(AlertService);
  private router = inject(Router);

  ngOnInit() {
    // Handle focus and title on navigation
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      // Small delay to let the component render
      const currentRoute = this.router.url.split('/')[1] || 'Inicio';
      const capitalizedTitle = currentRoute.charAt(0).toUpperCase() + currentRoute.slice(1);
      
      this.a11y.announce(`Cargada la página de ${capitalizedTitle}`, 'polite');
      this.a11y.focusElement('#main-content');
    });
  }
}
