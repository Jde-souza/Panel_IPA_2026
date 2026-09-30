import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../data.service';
import { firstValueFrom } from 'rxjs';
import { AlertService } from '../../services/alert.service';

interface Examen {
  id?: number;
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
  private dataService = inject(DataService);

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
      const dbData = await firstValueFrom(this.dataService.getExamenesData());
      
      this.examenes = dbData.map((row: any) => ({
        id: row.id,
        dia: row.dia,
        hora: row.hora,
        examen: row.examen,
        anio: row.anio,
        plan: row.plan,
        tribunal: [row.tribunal1, row.tribunal2, row.tribunal3].filter(Boolean),
        salones: row.salones
      }));
      this.filteredExamenes = this.examenes;
      
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

  // --- Modal Logic ---
  showModal = false;
  isSaving = false;
  editingId: number | null = null;
  newRecord: any = {
    dia: '',
    hora: '',
    examen: '',
    anio: '',
    plan: '',
    tribunalesStr: '',
    salones: ''
  };

  openModal(examenToEdit?: Examen) {
    this.showModal = true;
    if (examenToEdit && examenToEdit.id) {
      this.editingId = examenToEdit.id;
      this.newRecord = {
        dia: examenToEdit.dia || '',
        hora: examenToEdit.hora || '',
        examen: examenToEdit.examen || '',
        anio: examenToEdit.anio || '',
        plan: examenToEdit.plan || '',
        tribunalesStr: (examenToEdit.tribunal || []).join(', '),
        salones: examenToEdit.salones || ''
      };
    } else {
      this.editingId = null;
      this.newRecord = {
        dia: '', hora: '', examen: '', anio: '', plan: '', tribunalesStr: '', salones: ''
      };
    }
  }

  closeModal() {
    this.showModal = false;
  }

  private alertService = inject(AlertService);

  async saveRecord() {
    try {
      this.isSaving = true;
      const trib = this.newRecord.tribunalesStr.split(',').map((s: string) => s.trim()).filter(Boolean);
      
      const payload = {
        dia: this.newRecord.dia,
        hora: this.newRecord.hora,
        examen: this.newRecord.examen,
        anio: this.newRecord.anio,
        plan: this.newRecord.plan,
        tribunal1: trib[0] || '',
        tribunal2: trib[1] || '',
        tribunal3: trib[2] || '',
        salones: this.newRecord.salones
      };

      if (this.editingId) {
        await firstValueFrom(this.dataService.updateExamen(this.editingId, payload));
        this.alertService.success('Examen actualizado exitosamente');
      } else {
        await firstValueFrom(this.dataService.saveExamen(payload));
        this.alertService.success('Examen guardado exitosamente');
      }
      
      this.closeModal();
      await this.loadExamenes(); 
    } catch (e: any) {
      console.error(e);
      this.alertService.error('Error al guardar: ' + e.message);
    } finally {
      this.isSaving = false;
    }
  }
}
