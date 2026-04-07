import { Component, inject, signal, computed } from '@angular/core';
import { DataService, CentroContacto } from '../../data.service';
import { CommonModule } from '@angular/common';
import { CentroCardComponent } from '../centro-card/centro-card.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-centros',
  standalone: true,
  imports: [CommonModule, CentroCardComponent, FormsModule],
  templateUrl: './centros.component.html',
  styleUrl: './centros.component.css'
})
export class CentrosComponent {
  private dataService = inject(DataService);
  
  searchTerm = signal('');
  centros = this.dataService.getCentrosData();
  
  filteredCentros = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.centros;
    
    return this.centros.filter(c => 
      c.nombre.toLowerCase().includes(term) ||
      c.departamento.toLowerCase().includes(term) ||
      c.tipo.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term)
    );
  });
}
