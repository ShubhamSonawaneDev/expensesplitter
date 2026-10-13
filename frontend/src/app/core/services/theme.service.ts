import { Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

/** The app currently uses a fixed light theme; dark mode is intentionally disabled. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'app_theme';
  theme = signal<Theme>('light');

  constructor() {
    this.applyLightTheme();
    try {
      localStorage.setItem(this.STORAGE_KEY, 'light');
    } catch {
      // Storage may be unavailable in private browsing; the UI still stays light.
    }
  }

  private applyLightTheme(): void {
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
    document.documentElement.setAttribute('data-theme', 'light');
  }

  toggleTheme(): void {
    this.setTheme('light');
  }

  setTheme(_theme: Theme): void {
    this.theme.set('light');
    this.applyLightTheme();
  }

  isDarkMode(): boolean {
    return false;
  }
}
