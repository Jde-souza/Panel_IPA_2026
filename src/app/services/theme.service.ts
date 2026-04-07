import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'panel-ipa-theme';
  isDark = signal<boolean>(false);

  constructor() {
    // Inicializar el tema desde localStorage
    const savedTheme = localStorage.getItem(this.THEME_KEY);
    if (savedTheme === 'dark') {
      this.isDark.set(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    // Efecto para aplicar cambios al DOM y localStorage
    effect(() => {
      const dark = this.isDark();
      if (dark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem(this.THEME_KEY, 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem(this.THEME_KEY, 'light');
      }
    });
  }

  toggleTheme() {
    this.isDark.set(!this.isDark());
  }
}
