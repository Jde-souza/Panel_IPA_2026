import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { DataService, NewsItem, LlamadoItem } from '../../data.service';
import { CommonModule } from '@angular/common';
import { AccessibilityService } from '../../services/accessibility.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  private dataService = inject(DataService);
  private cdr = inject(ChangeDetectorRef);
  private a11y = inject(AccessibilityService);
  
  newsItems: NewsItem[] = [];
  institutionalNews: NewsItem[] = [];
  ceibalNews: NewsItem[] = [];
  
  llamadosDocentes: LlamadoItem[] = [];
  llamadosNoDocentes: LlamadoItem[] = [];
  
  isLoading = true;

  ngOnInit() {
    this.loadNews();
    this.loadLlamados();
  }

  loadNews() {
    this.isLoading = true;
    this.a11y.announce('Consultando portales institucionales...', 'polite');
    this.dataService.getNewsData().subscribe({
      next: (data) => {
        this.newsItems = data || [];
        this.institutionalNews = this.newsItems.filter(item => item.source !== 'CEIBAL');
        this.ceibalNews = this.newsItems.filter(item => item.source === 'CEIBAL');
        this.isLoading = false;
        this.a11y.announce(`Se han cargado ${this.newsItems.length} noticias.`, 'polite');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.a11y.announce('Error al cargar las noticias. Por favor reintente.', 'assertive');
        this.cdr.detectChanges();
      }
    });
  }

  loadLlamados() {
    this.dataService.getLlamadosData().subscribe({
      next: (data) => {
        const todosLlamados = data || [];
        this.llamadosDocentes = todosLlamados.filter(l => l.category === 'docente').slice(0, 10);
        this.llamadosNoDocentes = todosLlamados.filter(l => l.category === 'no-docente').slice(0, 10);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando llamados:', err);
      }
    });
  }

  goToNews(url: string) {
    window.open(url, '_blank');
  }
}
