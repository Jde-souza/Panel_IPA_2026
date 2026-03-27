import { Component, Input, inject } from '@angular/core';
import { CentroContacto } from '../../data.service';
import { CommonModule } from '@angular/common';
import { AccessibilityService } from '../../services/accessibility.service';

@Component({
  selector: 'app-centro-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article 
      class="glass-card fade-in card-clickable" 
      style="padding: 20px; position: relative;"
      (click)="copyInfo($event)"
      (keydown.enter)="copyInfo($event)"
      (keydown.space)="copyInfo($event)"
      role="button"
      tabindex="0"
      [attr.aria-label]="'Centro: ' + data.nombre + '. Haz clic para copiar su información de contacto.'">
      
      <div *ngIf="showCopyFeedback" class="copy-badge fade-in" aria-hidden="true">
        <i class="fa-solid fa-check-double" aria-hidden="true"></i> ¡Copiado!
      </div>
      <div class="category-tag">{{data.tipo}}</div>
      <h3 style="margin-bottom: 15px; color: var(--text-heading);">{{data.nombre}}</h3>
      
      <div class="doe-card-body">
        <div class="doe-info-item">
          <span class="doe-info-label" style="color: var(--text-muted);"><i class="fa-solid fa-location-dot icon-margin" aria-hidden="true"></i> Depto:</span>
          <span class="doe-info-value" style="color: var(--text-main);">{{data.departamento}}</span>
        </div>
        <div class="doe-info-item">
          <span class="doe-info-label" style="color: var(--text-muted);"><i class="fa-solid fa-map-pin icon-margin" aria-hidden="true"></i> Dirección:</span>
          <span class="doe-info-value" style="color: var(--text-main);">{{data.direccion}}</span>
        </div>
        <div class="doe-info-item">
          <span class="doe-info-label" style="color: var(--text-muted);"><i class="fa-solid fa-phone icon-margin" aria-hidden="true"></i> Tel:</span>
          <span class="doe-info-value" style="color: var(--text-main);">{{data.telefono}}</span>
        </div>
        <div class="doe-info-item">
          <span class="doe-info-label" style="color: var(--text-muted);"><i class="fa-solid fa-envelope icon-margin" aria-hidden="true"></i> Email:</span>
          <a [href]="'mailto:' + data.email" class="doe-info-value info-text" style="color: var(--primary-color); text-decoration: none; font-weight: 600;" (click)="$event.stopPropagation()" [attr.aria-label]="'Enviar correo a ' + data.email">
            {{data.email}}
          </a>
        </div>
      </div>
    </article>
  `,
  styles: [`
    .card-clickable {
      cursor: pointer;
      transition: all 0.3s ease;
      border: 1px solid transparent;
    }
    .card-clickable:hover {
      transform: translateY(-5px);
      border-color: var(--primary-color);
      box-shadow: 0 8px 24px rgba(0, 174, 239, 0.15);
    }
    .copy-badge {
      position: absolute;
      top: 15px;
      right: 15px;
      background: #10b981;
      color: white;
      font-size: 0.7rem;
      padding: 4px 10px;
      border-radius: 20px;
      font-weight: 700;
      z-index: 10;
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
    }
  `]
})
export class CentroCardComponent {
  @Input({ required: true }) data!: CentroContacto;
  private a11y = inject(AccessibilityService);
  
  showCopyFeedback = false;

  async copyInfo(event: Event) {
    // Si el clic fue en el enlace de email, dejamos que actúe el navegador
    if ((event.target as HTMLElement).tagName.toLowerCase() === 'a') return;
    
    // Evitar scroll al presionar espacio
    if (event instanceof KeyboardEvent && (event.key === ' ' || event.key === 'Enter')) {
      event.preventDefault();
    }

    const textToCopy = `${this.data.nombre}\nDepto: ${this.data.departamento}\nDirección: ${this.data.direccion}\nTel: ${this.data.telefono}\nEmail: ${this.data.email}`;
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      this.showCopyFeedback = true;
      this.a11y.announce(`Información de ${this.data.nombre} copiada al portapapeles.`, 'polite');
      setTimeout(() => this.showCopyFeedback = false, 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
      this.a11y.announce('Error al intentar copiar la información.', 'assertive');
    }
  }
}
