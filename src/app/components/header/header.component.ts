import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="header" [class.scrolled]="isScrolled">
      <div class="logo-section">
        <h1 class="main-title">Panel IPA</h1>
      </div>
      <nav class="top-nav">
        <a routerLink="/doe" class="nav-item"><i class="fa-solid fa-user-group icon-margin" aria-hidden="true"></i> DOE</a>
        <a routerLink="/centros" class="nav-item"><i class="fa-solid fa-map-location-dot icon-margin" aria-hidden="true"></i> Centros</a>
        <a routerLink="/agenda" class="nav-item"><i class="fa-solid fa-calendar-check icon-margin" aria-hidden="true"></i> Agenda</a>

        <button class="theme-toggle" (click)="toggleTheme()" [attr.aria-label]="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'" id="theme-toggle-btn">
          <span class="toggle-icon" [class.dark]="isDark">
            <i [class]="isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon'" aria-hidden="true"></i>
          </span>
        </button>
      </nav>
    </header>
  `,
  styles: [`
    .theme-toggle {
      background: var(--toggle-bg);
      border: 1px solid var(--border-color);
      border-radius: 50%;
      width: 38px;
      height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.35s ease;
      margin-left: 10px;
    }

    .theme-toggle:hover {
      transform: scale(1.1);
      border-color: var(--primary-color);
      box-shadow: 0 0 12px rgba(0, 174, 239, 0.25);
    }

    .toggle-icon {
      color: var(--toggle-fg);
      font-size: 1rem;
      transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .toggle-icon.dark {
      transform: rotate(180deg);
      color: #fbbf24;
    }
  `]
})
export class HeaderComponent implements OnInit {
  isScrolled = false;
  isDark = false;

  constructor() {
    window.addEventListener('scroll', () => {
      this.isScrolled = window.scrollY > 20;
    });
  }

  ngOnInit() {
    const saved = localStorage.getItem('panel-ipa-theme');
    if (saved === 'dark') {
      this.isDark = true;
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      this.isDark = false;
      document.documentElement.removeAttribute('data-theme');
    }
  }

  toggleTheme() {
    this.isDark = !this.isDark;
    if (this.isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('panel-ipa-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('panel-ipa-theme', 'light');
    }
  }
}
