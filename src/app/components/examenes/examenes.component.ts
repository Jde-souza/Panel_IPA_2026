import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Examen {
  dia: string;
  hora: string;
  examen: string;
  anio: string;
  plan: string;
  tribunal: string[];
  salones: string;
}

@Component({
  selector: 'app-examenes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './examenes.component.html',
  styleUrl: './examenes.component.css'
})
export class ExamenesComponent implements OnInit {
  examenes: Examen[] = [];
  filteredExamenes: Examen[] = [];
  
  // Dashboard stats
  totalExamenes = 0;
  planesCount: { [key: string]: number } = {};
  aniosCount: { [key: string]: number } = {};
  examenesHoy = 0;

  // Filters
  searchTerm = '';
  selectedPlan = '';
  selectedAnio = '';
  
  isLoading = true;
  error = '';

  ngOnInit() {
    this.loadExamenes();
  }

  async loadExamenes() {
    try {
      this.isLoading = true;
      const response = await fetch('/data/examenes.json');
      if (!response.ok) throw new Error('No se pudo cargar la información de exámenes');
      
      const data = await response.json();
      this.examenes = data;
      this.filteredExamenes = data;
      
      this.calculateStats();
      this.isLoading = false;
    } catch (err: any) {
      this.error = err.message;
      this.isLoading = false;
    }
  }

  calculateStats() {
    this.totalExamenes = this.examenes.length;
    this.planesCount = {};
    this.aniosCount = {};
    
    this.examenes.forEach(ex => {
      // Plan count
      const plan = ex.plan || 'Sin plan';
      this.planesCount[plan] = (this.planesCount[plan] || 0) + 1;
      
      // Año count
      const anio = ex.anio || 'Sin año';
      this.aniosCount[anio] = (this.aniosCount[anio] || 0) + 1;
      
      // Exámenes de hoy (Aproximación simple: tomamos el primer día que aparece como "hoy" para el demo, 
      // ya que las fechas en la planilla pueden no coincidir con el día actual real)
    });
    
    // Para dar un efecto wow en el dashboard, si hay exámenes, asumimos que "hoy/próximos" son los del primer día listado
    if (this.examenes.length > 0) {
      const primerDia = this.examenes[0].dia;
      this.examenesHoy = this.examenes.filter(ex => ex.dia === primerDia).length;
    }
  }

  filterExamenes() {
    this.filteredExamenes = this.examenes.filter(ex => {
      const matchesSearch = this.searchTerm === '' || 
        ex.examen.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        ex.tribunal.some(t => t.toLowerCase().includes(this.searchTerm.toLowerCase()));
        
      const matchesPlan = this.selectedPlan === '' || ex.plan === this.selectedPlan;
      const matchesAnio = this.selectedAnio === '' || ex.anio === this.selectedAnio;
      
      return matchesSearch && matchesPlan && matchesAnio;
    });
  }
  
  get groupedExamenes() {
    const groups: { [key: string]: Examen[] } = {};
    this.filteredExamenes.forEach(ex => {
      const key = ex.dia || 'Sin fecha';
      if (!groups[key]) groups[key] = [];
      groups[key].push(ex);
    });
    return groups;
  }
  
  // Utility for template
  objectKeys(obj: any) {
    return Object.keys(obj);
  }
}
