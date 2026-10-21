import { Component, inject, OnInit, HostListener } from '@angular/core';
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

      <!-- Modal Global de Confirmación (Eliminación / Acciones Críticas) -->
      <div *ngIf="alertService.confirmDialog() as dialog"
           class="fixed inset-0 z-[10000] flex items-center justify-center p-4 fade-in"
           style="background: rgba(5, 10, 24, 0.65); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);"
           (click)="alertService.resolveConfirm(false)"
           role="dialog"
           aria-modal="true"
           aria-labelledby="confirm-dialog-title">
        <div class="w-full max-w-md rounded-3xl p-6 md:p-7 shadow-2xl border relative overflow-hidden transition-all"
             style="background: var(--surface); border-color: var(--border-color); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);"
             (click)="$event.stopPropagation()">
          
          <!-- Barra superior de acento -->
          <div class="absolute top-0 left-0 right-0 h-1.5"
               [ngStyle]="{
                 'background': dialog.type === 'danger' ? 'linear-gradient(90deg, #ef4444, #f97316)' :
                               dialog.type === 'warning' ? 'linear-gradient(90deg, #f59e0b, #eab308)' :
                               'linear-gradient(90deg, var(--anep-blue), var(--primary-color))'
               }"></div>

          <div class="flex items-start gap-4">
            <!-- Ícono circular -->
            <div class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border"
                 [ngStyle]="{
                   'background': dialog.type === 'danger' ? 'rgba(239, 68, 68, 0.12)' :
                                 dialog.type === 'warning' ? 'rgba(245, 158, 11, 0.12)' :
                                 'rgba(var(--primary-color-rgb), 0.12)',
                   'border-color': dialog.type === 'danger' ? 'rgba(239, 68, 68, 0.25)' :
                                   dialog.type === 'warning' ? 'rgba(245, 158, 11, 0.25)' :
                                   'rgba(var(--primary-color-rgb), 0.25)',
                   'color': dialog.type === 'danger' ? '#ef4444' :
                            dialog.type === 'warning' ? '#f59e0b' :
                            'var(--primary-color)'
                 }">
              <i class="fa-solid text-xl"
                 [ngClass]="{
                   'fa-trash-can': dialog.type === 'danger',
                   'fa-triangle-exclamation': dialog.type === 'warning',
                   'fa-circle-question': dialog.type === 'info'
                 }"></i>
            </div>

            <!-- Contenido de texto -->
            <div class="flex-grow min-w-0 pt-0.5">
              <h3 id="confirm-dialog-title" class="text-lg font-extrabold leading-snug" style="color: var(--text-heading)">
                {{ dialog.title }}
              </h3>
              <p class="text-sm mt-2 leading-relaxed" style="color: var(--text-muted)">
                {{ dialog.message }}
              </p>
            </div>

            <!-- Botón X -->
            <button type="button"
                    (click)="alertService.resolveConfirm(false)"
                    class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors hover:bg-black/10"
                    style="color: var(--text-muted)"
                    aria-label="Cerrar">
              <i class="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>

          <!-- Botones de acción -->
          <div class="mt-7 pt-4 border-t flex items-center justify-end gap-3" style="border-color: var(--border-color)">
            <button type="button"
                    (click)="alertService.resolveConfirm(false)"
                    class="px-5 py-2.5 rounded-xl font-bold text-sm transition-all border hover:opacity-85"
                    style="background: var(--bg-body); color: var(--text-main); border-color: var(--border-color);">
              {{ dialog.cancelText }}
            </button>
            <button type="button"
                    (click)="alertService.resolveConfirm(true)"
                    class="px-5 py-2.5 rounded-xl font-bold text-sm text-white flex items-center gap-2 transition-all hover:-translate-y-0.5 shadow-lg"
                    [ngStyle]="{
                      'background': dialog.type === 'danger' ? '#ef4444' :
                                    dialog.type === 'warning' ? '#f59e0b' :
                                    'var(--primary-color)',
                      'box-shadow': dialog.type === 'danger' ? '0 8px 20px -4px rgba(239, 68, 68, 0.45)' :
                                    dialog.type === 'warning' ? '0 8px 20px -4px rgba(245, 158, 11, 0.45)' :
                                    '0 8px 20px -4px rgba(var(--primary-color-rgb), 0.45)'
                    }">
              <i class="fa-solid text-xs"
                 [ngClass]="{
                   'fa-trash-can': dialog.type === 'danger',
                   'fa-check': dialog.type !== 'danger'
                 }"></i>
              <span>{{ dialog.confirmText }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Toast Alerts Container -->
      <div class="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-sm px-4 sm:px-0 pointer-events-none">
        <div *ngFor="let alert of alertService.alerts()" 
             class="pointer-events-auto rounded-2xl p-4 flex items-start gap-3.5 fade-in relative overflow-hidden border transition-all"
             style="background: var(--surface); border-color: var(--border-color); box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.4); backdrop-filter: blur(16px);"
             role="alert">
          
          <!-- Barra lateral izquierda según tipo -->
          <div class="absolute top-0 bottom-0 left-0 w-1.5"
               [ngStyle]="{
                 'background': alert.type === 'success' ? '#10b981' :
                               alert.type === 'error' ? '#ef4444' :
                               alert.type === 'warning' ? '#f59e0b' :
                               'var(--primary-color)'
               }"></div>

          <!-- Ícono circular -->
          <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ml-1"
               [ngStyle]="{
                 'background': alert.type === 'success' ? 'rgba(16, 185, 129, 0.14)' :
                               alert.type === 'error' ? 'rgba(239, 68, 68, 0.14)' :
                               alert.type === 'warning' ? 'rgba(245, 158, 11, 0.14)' :
                               'rgba(var(--primary-color-rgb), 0.14)',
                 'color': alert.type === 'success' ? '#10b981' :
                          alert.type === 'error' ? '#ef4444' :
                          alert.type === 'warning' ? '#f59e0b' :
                          'var(--primary-color)'
               }">
            <i class="fa-solid text-base" [ngClass]="{
              'fa-circle-check': alert.type === 'success',
              'fa-circle-exclamation': alert.type === 'error',
              'fa-circle-info': alert.type === 'info',
              'fa-triangle-exclamation': alert.type === 'warning'
            }"></i>
          </div>

          <!-- Texto de la alerta -->
          <div class="flex-grow min-w-0 pr-2">
            <p class="text-xs font-extrabold uppercase tracking-wider" style="color: var(--text-heading)">
              {{ alert.title }}
            </p>
            <p class="text-sm font-medium mt-0.5 leading-snug" style="color: var(--text-muted)">
              {{ alert.message }}
            </p>
          </div>

          <!-- Botón cerrar -->
          <button type="button"
                  (click)="alertService.remove(alert.id)"
                  class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                  style="color: var(--text-muted)"
                  aria-label="Cerrar notificación">
            <i class="fa-solid fa-xmark text-xs"></i>
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

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.alertService.confirmDialog()) {
      this.alertService.resolveConfirm(false);
    }
  }

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
