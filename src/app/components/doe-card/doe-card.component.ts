import { Component, Input } from '@angular/core';
import { UnifiedDoeEntry } from '../../data.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-doe-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="doe-card fade-in">
      <div class="doe-card-header">
        <span class="doe-name">{{data.doe}}</span>
      </div>
      <div class="doe-card-body">
        <div *ngFor="let shift of data.shifts" class="doe-shift-block">
          <div class="doe-shift-badge-row">
            <span class="badge" [ngClass]="shift.turno.toLowerCase().includes('nocturno') ? 'nocturno' : 'diurno'">
              {{shift.turno}}
            </span>
          </div>
          <div class="doe-info-item">
            <span class="doe-info-label">Horario:</span>
            <span class="doe-info-value horario-text">{{shift.horario}}</span>
          </div>
          <div class="doe-info-item">
             <span class="doe-info-label">Titular:</span>
             <span class="doe-info-value">{{shift.titular}}</span>
          </div>
          <div class="doe-info-item">
            <span class="doe-info-label">Tareas:</span>
            <span class="doe-info-value info-text">{{shift.tareas}}</span>
          </div>
          <div class="doe-info-item" *ngIf="shift.email">
            <span class="doe-info-label">Contacto:</span>
            <div class="doe-info-value email-container">
              <ng-container *ngIf="!isArray(shift.email); else emailArray">
                <a [href]="'mailto:' + shift.email" class="email-link" [attr.aria-label]="'Enviar correo a ' + shift.email">
                  <i class="fa-solid fa-envelope" aria-hidden="true"></i> {{shift.email}}
                </a>
              </ng-container>
              <ng-template #emailArray>
                <div *ngFor="let email of asArray(shift.email)" class="email-item">
                  <a [href]="'mailto:' + email" class="email-link" [attr.aria-label]="'Enviar correo a ' + email">
                    <i class="fa-solid fa-envelope" aria-hidden="true"></i> {{email}}
                  </a>
                </div>
              </ng-template>
            </div>
          </div>
        </div>
      </div>
    </article>
  `,
  styles: [`
    .doe-shift-block {
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    .doe-shift-block:last-child {
      border-bottom: none;
    }
    .doe-shift-badge-row {
      margin-bottom: 8px;
    }
    .email-container {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .email-link {
      color: var(--primary-color, #004a8e);
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      transition: color 0.2s;
      word-break: break-all;
      overflow-wrap: anywhere;
    }
    .email-link:hover {
      text-decoration: underline;
      color: var(--primary-dark, #003366);
    }
    .email-link i {
      margin-right: 4px;
      font-size: 0.8rem;
    }
    .email-item {
      display: block;
    }
  `]
})
export class DoeCardComponent {
  @Input({ required: true }) data!: UnifiedDoeEntry;

  isArray(val: any): boolean {
    return Array.isArray(val);
  }

  asArray(val: string | string[] | undefined): string[] {
    if (!val) return [];
    return Array.isArray(val) ? val : [val];
  }
}
