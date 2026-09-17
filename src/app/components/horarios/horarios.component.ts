import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-horarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './horarios.component.html'
})
export class HorariosComponent implements OnInit {
  isLoading = true;
  error = '';
  
  rawData: any = {};
  
  especialidades: string[] = [];
  selectedEsp: string = '';
  
  gruposAgrupados: { turno: string, grupos: string[] }[] = [];
  selectedGrupo: string = '';
  
  semestre: 'sem1' | 'sem2' = 'sem1';
  
  dias = [1, 2, 3, 4, 5];
  diasNombres = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  horas: string[] = [];
  
  // grilla[hora][dia] = Array of class objects
  grilla: { [hora: string]: { [dia: number]: any[] } } = {};
  
  clasesList: any[] = []; // Para vista móvil

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    try {
      this.isLoading = true;
      const res = await fetch('/data/horarios.json');
      if (!res.ok) throw new Error('Error al cargar datos');
      this.rawData = await res.json();
      
      this.especialidades = Object.keys(this.rawData).sort();
    } catch (e: any) {
      this.error = e.message;
    } finally {
      this.isLoading = false;
    }
  }

  onEspChange() {
    this.selectedGrupo = '';
    if (this.selectedEsp) {
      const allGroups = Object.keys(this.rawData[this.selectedEsp]).sort();
      
      const turnosMap: { [key: string]: string[] } = {
        'Mañana': [],
        'Tarde': [],
        'Noche': [],
        'Otros': []
      };

      allGroups.forEach(g => {
        const groupData = this.rawData[this.selectedEsp][g];
        // Collect all hours to determine shift
        const clases = [...(groupData.sem1 || []), ...(groupData.sem2 || [])];
        if (clases.length === 0) {
           turnosMap['Otros'].push(g);
           return;
        }
        
        // Find earliest hour
        let earliest = '23:59';
        clases.forEach((c: any) => {
          // Extraer la primera parte de la hora (ej: "08:00" de "08:00-08:45")
          const horaInicio = c.hora ? c.hora.split('-')[0] : null;
          if (horaInicio && horaInicio.localeCompare(earliest) < 0) {
            earliest = horaInicio;
          }
        });
        
        const hourPrefix = parseInt(earliest.split(':')[0], 10);
        
        if (hourPrefix < 13) {
          turnosMap['Mañana'].push(g);
        } else if (hourPrefix < 18) {
          turnosMap['Tarde'].push(g);
        } else {
          turnosMap['Noche'].push(g);
        }
      });
      
      this.gruposAgrupados = [
        { turno: 'Mañana', grupos: turnosMap['Mañana'] },
        { turno: 'Tarde', grupos: turnosMap['Tarde'] },
        { turno: 'Noche', grupos: turnosMap['Noche'] },
        { turno: 'Otros', grupos: turnosMap['Otros'] }
      ].filter(t => t.grupos.length > 0);
      
    } else {
      this.gruposAgrupados = [];
    }
    this.updateGrilla();
  }
  
  onGrupoChange() {
    this.updateGrilla();
  }
  
  onSemestreChange(sem: 'sem1' | 'sem2') {
    this.semestre = sem;
    this.updateGrilla();
  }
  
  updateGrilla() {
    this.horas = [];
    this.grilla = {};
    this.clasesList = [];
    
    if (!this.selectedEsp || !this.selectedGrupo) return;
    
    const groupData = this.rawData[this.selectedEsp][this.selectedGrupo];
    if (!groupData) return;

    const clases = groupData[this.semestre] || [];
    
    // Lista ordenada para vista móvil
    this.clasesList = [...clases].sort((a: any, b: any) => {
      if (a.dia !== b.dia) return a.dia - b.dia;
      return (a.hora || '').localeCompare(b.hora || '');
    });

    const horasSet = new Set<string>();
    clases.forEach((c: any) => {
      if (c.hora) horasSet.add(c.hora);
    });
    
    this.horas = Array.from(horasSet).sort();
    
    this.horas.forEach(h => {
      this.grilla[h] = {};
      this.dias.forEach(d => {
        this.grilla[h][d] = clases.filter((c: any) => c.hora === h && c.dia === d);
      });
    });
  }
  
  formatInfo(info: string): string[] {
    return info ? info.split('\n').filter(l => l.trim() !== '') : [];
  }

  getClasesForDay(dia: number): any[] {
    return this.clasesList.filter(c => c.dia === dia);
  }
}
