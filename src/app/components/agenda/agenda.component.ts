import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService, AgendaItem } from '../../data.service';
import { AccessibilityService } from '../../services/accessibility.service';

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agenda.component.html',
  styleUrl: './agenda.component.css'
})
export class AgendaComponent implements OnInit {
  private dataService = inject(DataService);
  private a11y = inject(AccessibilityService);
  
  allData: AgendaItem[] = [];
  filteredData: AgendaItem[] = [];
  searchText: string = '';
  activeCopyName = signal<string | null>(null);

  ngOnInit() {
    this.dataService.getAgendaData().subscribe({
      next: (data) => {
        this.allData = data;
        this.filteredData = data;
      },
      error: (err) => console.error('Error loading agenda data:', err)
    });
  }

  filterData() {
    const search = this.searchText.toLowerCase().trim();
    if (!search) {
      this.filteredData = this.allData;
      return;
    }
    this.filteredData = this.allData.filter(item => 
      item.nombre.toLowerCase().includes(search) ||
      (item.email && item.email.toLowerCase().includes(search))
    );

    // Announce results
    this.a11y.announce(`Encontrados ${this.filteredData.length} docentes para "${search}"`, 'polite');
  }

  async copyInfo(item: AgendaItem) {
    const phones = [item.telefono1, item.telefono2].filter(p => !!p).join(' / ');
    const textToCopy = `${item.nombre}${phones ? '\nTel: ' + phones : ''}${item.email ? '\nEmail: ' + item.email : ''}`;
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      this.activeCopyName.set(item.nombre);
      this.a11y.announce(`Información de ${item.nombre} copiada al portapapeles.`, 'polite');
      setTimeout(() => this.activeCopyName.set(null), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
      this.a11y.announce('Error al intentar copiar la información.', 'assertive');
    }
  }
}
