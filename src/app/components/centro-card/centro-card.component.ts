import { Component, Input, inject } from '@angular/core';
import { CentroContacto } from '../../data.service';
import { CommonModule } from '@angular/common';
import { AccessibilityService } from '../../services/accessibility.service';

@Component({
  selector: 'app-centro-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './centro-card.component.html',
  styleUrl: './centro-card.component.css'
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
