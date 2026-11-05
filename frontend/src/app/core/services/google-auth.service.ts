import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

declare const google: any;

@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  private scriptPromise?: Promise<void>;

  private load(): Promise<void> {
    if (!this.scriptPromise) {
      this.scriptPromise = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://accounts.google.com/gsi/client';
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('Failed to load Google script'));
        document.head.appendChild(s);
      });
    }
    return this.scriptPromise;
  }

  async renderButton(el: HTMLElement, onCredential: (idToken: string) => void): Promise<void> {
    await this.load();
    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (resp: any) => onCredential(resp.credential),
    });
    google.accounts.id.renderButton(el, {
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      width: Math.min(el.offsetWidth || 360, 400),
    });
  }
}