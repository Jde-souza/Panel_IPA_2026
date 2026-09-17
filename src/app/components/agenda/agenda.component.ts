import { Component, inject, OnInit, signal, HostListener, ViewChild, ElementRef } from '@angular/core';
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
  selectedTeacher: AgendaItem | null = null;
  nextClassInfo: any = null;

  @ViewChild('modalContainer') modalContainer!: ElementRef;

  @HostListener('document:keydown.escape', ['$event'])
  onKeydownHandler(event: Event) {
    if (this.selectedTeacher) {
      this.closeModal();
    }
  }

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

  openModal(item: AgendaItem) {
    this.selectedTeacher = item;
    this.nextClassInfo = this.calculateNextClass(item);
    this.a11y.announce(`Detalles de ${item.nombre} abiertos. Pulsa Escape para cerrar.`, 'polite');
    
    // Enfocar el modal para Screen Readers después de que Angular renderice
    setTimeout(() => {
      if (this.modalContainer && this.modalContainer.nativeElement) {
        this.modalContainer.nativeElement.focus();
      }
    }, 100);
  }

  closeModal() {
    this.selectedTeacher = null;
    this.nextClassInfo = null;
    this.a11y.announce('Modal de detalles cerrado.', 'polite');
  }

  private calculateNextClass(item: AgendaItem): any {
    if (!item.horarios || item.horarios.length === 0) return null;
    
    const now = new Date();
    // En Date(), 0=Dom, 1=Lun...6=Sab. En nuestro JSON, los días suelen ser numéricos.
    // Asumimos 1=Lun, 2=Mar, 3=Mie, 4=Jue, 5=Vie basado en el extractor
    let currentDayIndex = now.getDay(); 
    if (currentDayIndex === 0) currentDayIndex = 7; // Convertir Domingo a fin de la semana

    const currentMinuteOfDay = now.getHours() * 60 + now.getMinutes();

    let upcomingClasses = item.horarios.map(h => {
      // "18:20-19:00"
      const times = h.hora.split('-');
      if (times.length !== 2) return null;
      
      const startParts = times[0].split(':');
      const endParts = times[1].split(':');
      const startMin = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
      const endMin = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);

      let diffDays = h.dia - currentDayIndex;
      // Si el día ya pasó o (es hoy y ya terminó la clase), calcular para la semana que viene
      if (diffDays < 0 || (diffDays === 0 && currentMinuteOfDay > endMin)) {
          diffDays += 7;
      }

      return {
          ...h,
          startMin,
          endMin,
          daysUntil: diffDays,
          isCurrent: diffDays === 0 && currentMinuteOfDay >= startMin && currentMinuteOfDay <= endMin
      };
    }).filter(h => h !== null);

    if (upcomingClasses.length === 0) return null;

    // Ordenar primero por si está en curso, luego por los días faltantes y luego por hora de inicio
    upcomingClasses.sort((a, b) => {
        if (a!.isCurrent) return -1;
        if (b!.isCurrent) return 1;
        
        if (a!.daysUntil !== b!.daysUntil) {
            return a!.daysUntil - b!.daysUntil;
        }
        return a!.startMin - b!.startMin;
    });

    return upcomingClasses[0];
  }

  getDayName(day: number): string {
    // 1=Lun, 2=Mar...
    const days = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    return days[day] || '';
  }
}
