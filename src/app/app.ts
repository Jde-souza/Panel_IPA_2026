import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { FooterComponent } from './components/footer/footer.component';
import { AccessibilityService } from './services/accessibility.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent, FooterComponent],
  template: `
    <div class="grid-container">
      <a href="#main-content" class="skip-link">Saltar al contenido principal</a>
      <app-header />
      <app-sidebar />
      <main class="main-content" id="main-content">
        <router-outlet />
      </main>
      <app-footer />

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
