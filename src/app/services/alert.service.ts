import { Injectable, signal } from '@angular/core';

export interface Alert {
  id: string;
  title?: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  timeout?: number;
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  alerts = signal<Alert[]>([]);
  confirmDialog = signal<ConfirmOptions | null>(null);
  private confirmResolver: ((result: boolean) => void) | null = null;

  constructor() {}

  show(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', timeout = 5000, title?: string) {
    const id = Math.random().toString(36).substring(2, 9);
    const defaultTitles: Record<Alert['type'], string> = {
      success: 'Operación exitosa',
      error: 'Ocurrió un error',
      warning: 'Atención',
      info: 'Información'
    };
    const alert: Alert = {
      id,
      title: title || defaultTitles[type],
      message,
      type,
      timeout
    };
    
    this.alerts.update(current => [...current, alert]);

    if (timeout > 0) {
      setTimeout(() => {
        this.remove(id);
      }, timeout);
    }
  }

  success(message: string, timeout = 3000, title?: string) {
    this.show(message, 'success', timeout, title);
  }

  error(message: string, timeout = 5000, title?: string) {
    this.show(message, 'error', timeout, title);
  }

  info(message: string, timeout = 3000, title?: string) {
    this.show(message, 'info', timeout, title);
  }

  warning(message: string, timeout = 4000, title?: string) {
    this.show(message, 'warning', timeout, title);
  }

  remove(id: string) {
    this.alerts.update(current => current.filter(a => a.id !== id));
  }

  confirm(options: string | ConfirmOptions): Promise<boolean> {
    if (this.confirmResolver) {
      this.confirmResolver(false);
      this.confirmResolver = null;
    }

    const opts: ConfirmOptions = typeof options === 'string'
      ? {
          title: 'Confirmar eliminación',
          message: options,
          confirmText: 'Eliminar',
          cancelText: 'Cancelar',
          type: 'danger'
        }
      : {
          title: options.title || 'Confirmar eliminación',
          message: options.message,
          confirmText: options.confirmText || 'Eliminar',
          cancelText: options.cancelText || 'Cancelar',
          type: options.type || 'danger'
        };

    this.confirmDialog.set(opts);

    return new Promise<boolean>((resolve) => {
      this.confirmResolver = resolve;
    });
  }

  resolveConfirm(result: boolean) {
    this.confirmDialog.set(null);
    if (this.confirmResolver) {
      const resolve = this.confirmResolver;
      this.confirmResolver = null;
      resolve(result);
    }
  }
}
