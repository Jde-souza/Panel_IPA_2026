import { Injectable, signal } from '@angular/core';

export interface Alert {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  timeout?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  alerts = signal<Alert[]>([]);

  constructor() {}

  show(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', timeout = 5000) {
    const id = Math.random().toString(36).substring(2, 9);
    const alert: Alert = { id, message, type, timeout };
    
    this.alerts.update(current => [...current, alert]);

    if (timeout > 0) {
      setTimeout(() => {
        this.remove(id);
      }, timeout);
    }
  }

  success(message: string, timeout = 3000) {
    this.show(message, 'success', timeout);
  }

  error(message: string, timeout = 5000) {
    this.show(message, 'error', timeout);
  }

  info(message: string, timeout = 3000) {
    this.show(message, 'info', timeout);
  }

  warning(message: string, timeout = 4000) {
    this.show(message, 'warning', timeout);
  }

  remove(id: string) {
    this.alerts.update(current => current.filter(a => a.id !== id));
  }
}
