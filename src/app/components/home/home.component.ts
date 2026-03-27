import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { DataService, NewsItem, LlamadoItem } from '../../data.service';
import { CommonModule } from '@angular/common';
import { AccessibilityService } from '../../services/accessibility.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="portal-header">
      <div class="container">
        <h1 class="portal-title">Actualidad Educativa</h1>
        <p class="portal-subtitle">Novedades de los portales institucionales de ANEP y Plan Ceibal</p>
      </div>
    </section>

    <div class="container mt-8">
      <!-- Hero News -->
      <button *ngIf="newsItems.length > 0" 
              class="hero-news glass-card group" 
              (click)="goToNews(newsItems[0].url)" 
              [attr.aria-label]="'Noticia destacada: ' + newsItems[0].title + '. Fuente: ' + newsItems[0].source">
        <div class="hero-image-container">
           <img *ngIf="newsItems[0].imageUrl" [src]="newsItems[0].imageUrl" class="hero-image" [alt]="newsItems[0].title">
           <div *ngIf="!newsItems[0].imageUrl" class="hero-image-placeholder" aria-hidden="true">
              <i class="fa-solid fa-newspaper text-6xl text-white/20"></i>
           </div>
        </div>
        <div class="hero-content text-left">
          <div class="news-source-tag secondary" aria-hidden="true">NOTICIA DESTACADA</div>
          <h2 class="hero-title group-hover:underline decoration-white/30 underline-offset-4">
            {{ newsItems[0].title }}
          </h2>
          <div class="news-meta mt-4 text-white/80">
            <span class="font-bold">{{ newsItems[0].source }}</span> — {{ newsItems[0].date }}
          </div>
          <div class="mt-6">
            <span class="btn-read-more">LEER MÁS <i class="fa-solid fa-chevron-right ml-2" aria-hidden="true"></i></span>
          </div>
        </div>
      </button>

      <!-- News Grid -->
      <div class="news-grid mt-12">
        <article *ngFor="let item of institutionalNews.slice(1)" class="news-card group">
          <button class="w-full text-left" (click)="goToNews(item.url)" [attr.aria-label]="'Noticia: ' + item.title + '. Fuente: ' + item.source">
            <div class="card-image-container">
               <img *ngIf="item.imageUrl" [src]="item.imageUrl" (error)="item.imageUrl = undefined" class="card-image" [alt]="item.title">
               <div *ngIf="!item.imageUrl" class="card-image-placeholder" aria-hidden="true">
                  <i class="fa-solid fa-image text-3xl text-slate-200"></i>
               </div>
            </div>
            <div class="card-body">
              <div class="news-meta mb-2">
                <span class="source-label" [ngClass]="item.source.toLowerCase()" aria-hidden="true">{{ item.source }}</span>
                <span class="date-label">{{ item.date }}</span>
              </div>
              <h3 class="card-title group-hover:text-cyan-600 transition-colors">
                {{ item.title }}
              </h3>
            </div>
          </button>
        </article>
      </div>

      <!-- Plan Ceibal Section -->
      <div *ngIf="ceibalNews.length > 0" class="mt-20 mb-12">
        <h2 class="section-title">Plan Ceibal</h2>
        <div class="news-grid mt-8">
          <article *ngFor="let item of ceibalNews" class="news-card group">
            <button class="w-full text-left" (click)="goToNews(item.url)" [attr.aria-label]="'Noticia Ceibal: ' + item.title">
              <div class="card-image-container">
                 <img *ngIf="item.imageUrl" [src]="item.imageUrl" (error)="item.imageUrl = undefined" class="card-image" [alt]="item.title">
                 <div *ngIf="!item.imageUrl" class="card-image-placeholder" aria-hidden="true">
                    <i class="fa-solid fa-microchip text-3xl text-slate-200"></i>
                 </div>
              </div>
              <div class="card-body">
                <div class="news-meta mb-2">
                  <span class="source-label ceibal" aria-hidden="true">CEIBAL</span>
                  <span class="date-label">{{ item.date }}</span>
                </div>
                <h3 class="card-title group-hover:text-[#00B2E3] transition-colors">
                  {{ item.title }}
                </h3>
              </div>
            </button>
          </article>
        </div>
      </div>

      <!-- Llamados Section -->
      <div *ngIf="llamadosDocentes.length > 0 || llamadosNoDocentes.length > 0" class="mt-20 mb-20 section-llamados-container">
        <h2 class="section-title">Concursos y Llamados (ANEP)</h2>
        <div class="llamados-columns-grid mt-8">
          
          <!-- Columna Docentes -->
          <div class="llamados-column">
            <div class="column-header">
              <i class="fa-solid fa-chalkboard-user"></i>
              <h3>Llamados Docentes</h3>
            </div>
            <div class="llamados-list">
              <div *ngFor="let item of llamadosDocentes" class="llamado-item" (click)="goToNews(item.url)">
                <div class="llamado-content">
                  <span class="llamado-origen">{{ item.origen }}</span>
                  <h4 class="llamado-title">{{ item.title }}</h4>
                  <div class="llamado-footer">
                    <span class="llamado-info" *ngIf="item.info">{{ item.info }}</span>
                    <i class="fa-solid fa-arrow-up-right-from-square text-cyan-500/50"></i>
                  </div>
                </div>
              </div>
              <div *ngIf="llamadosDocentes.length === 0" class="empty-column">No hay llamados docentes vigentes en la portada.</div>
            </div>
          </div>

          <!-- Columna No Docentes -->
          <div class="llamados-column">
            <div class="column-header">
              <i class="fa-solid fa-gears"></i>
              <h3>Llamados No Docentes (Gestión)</h3>
            </div>
            <div class="llamados-list">
              <div *ngFor="let item of llamadosNoDocentes" class="llamado-item" (click)="goToNews(item.url)">
                <div class="llamado-content">
                  <span class="llamado-origen">{{ item.origen }}</span>
                  <h4 class="llamado-title">{{ item.title }}</h4>
                  <div class="llamado-footer">
                    <span class="llamado-info" *ngIf="item.info">{{ item.info }}</span>
                    <i class="fa-solid fa-arrow-up-right-from-square text-cyan-500/50"></i>
                  </div>
                </div>
              </div>
              <div *ngIf="llamadosNoDocentes.length === 0" class="empty-column">No hay llamados de gestión vigentes en la portada.</div>
            </div>
          </div>

        </div>
      </div>

      <!-- Loading & Empty States -->
      <div *ngIf="newsItems.length === 0 && !isLoading" class="loading-state" role="status">
         <i class="fa-solid fa-cloud-moon text-4xl mb-4" aria-hidden="true"></i>
         <p>No se encontraron noticias recientes.</p>
         <button class="btn-read-more mt-4" (click)="loadNews()">REINTENTAR</button>
      </div>

      <div *ngIf="isLoading" class="loading-state" role="status" aria-live="polite" aria-label="Cargando noticias">
         <div class="spinner"></div>
         <p>Consultando portales institucionales...</p>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    .portal-header {
      border-bottom: 2px solid var(--border-light);
      padding: 20px 0;
    }
    
    .portal-title {
      font-size: 2.25rem;
      font-weight: 300;
      color: #0097D7;
      letter-spacing: -0.5px;
    }

    .portal-subtitle {
      color: var(--text-muted);
      font-size: 0.95rem;
      margin-top: 4px;
    }

    .section-title {
      font-size: 1.75rem;
      font-weight: 300;
      color: var(--text-heading);
      padding-bottom: 10px;
      border-bottom: 2px solid var(--border-light);
      margin-bottom: 30px;
    }

    /* Hero News Styling */
    .hero-news {
      display: grid;
      grid-template-columns: 1fr 1fr;
      min-height: 400px;
      padding: 0;
      overflow: hidden;
      cursor: pointer;
      background: #0097D7; /* ANEP Cyan */
      border: none;
    }

    .hero-image-container {
      background: #0076a8;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }

    .hero-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
    }

    .hero-news:hover .hero-image {
      transform: scale(1.05);
    }

    .hero-image-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .hero-content {
      padding: 50px;
      color: white;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .hero-title {
      font-size: 2.5rem;
      font-weight: 400;
      line-height: 1.1;
      margin-top: 15px;
    }

    .btn-read-more {
      display: inline-flex;
      align-items: center;
      padding: 10px 24px;
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 1px;
      transition: all 0.3s;
    }

    .hero-news:hover .btn-read-more {
      background: white;
      color: #0097D7;
    }

    /* Grid Styling */
    .news-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 40px;
      margin-bottom: 80px;
    }

    .news-card {
      cursor: pointer;
    }

    .card-image-container {
      width: 100%;
      aspect-ratio: 16/9;
      background: var(--surface-alt);
      overflow: hidden;
      margin-bottom: 20px;
      transition: all 0.4s;
      position: relative;
    }

    .card-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s;
    }

    .news-card:hover .card-image {
      transform: scale(1.05);
    }

    .card-image-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .news-card:hover .card-image-placeholder {
      background: var(--placeholder-hover-bg);
      transform: scale(1.02);
    }

    .card-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-heading);
      line-height: 1.4;
    }

    .news-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.75rem;
    }

    .source-label {
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 800;
      text-transform: uppercase;
    }
    
    .source-label.anep { color: #0097D7; background: rgba(0, 151, 215, 0.12); }
    .source-label.cfe { color: #d97706; background: rgba(217, 119, 6, 0.12); }
    .source-label.utu { color: #db2777; background: rgba(219, 39, 119, 0.12); }
    .source-label.dgeip { color: #16a34a; background: rgba(22, 163, 74, 0.12); }
    .source-label.dges { color: #9333ea; background: rgba(147, 51, 234, 0.12); }
    .source-label.ceibal { color: #00B2E3; background: rgba(0, 178, 227, 0.12); }

    .date-label {
      color: var(--text-muted);
    }

    .news-source-tag.secondary {
      font-size: 0.7rem;
      font-weight: 900;
      letter-spacing: 2px;
      color: #FECB2F; /* ANEP Yellow */
    }

    /* Llamados Section Styling */
    .llamados-columns-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
    }

    .llamados-column {
      background: var(--surface-alt);
      border-radius: 12px;
      padding: 25px;
      border: 1px solid var(--border-color);
    }

    .column-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      color: var(--primary-color);
    }

    .column-header i {
      font-size: 1.5rem;
    }

    .column-header h3 {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0;
    }

    .llamados-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .llamado-item {
      background: var(--card-bg);
      padding: 16px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      cursor: pointer;
      transition: all 0.3s;
    }

    .llamado-item:hover {
      border-color: #0097D7;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    .llamado-origen {
      font-size: 0.65rem;
      font-weight: 800;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .llamado-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-heading);
      margin: 4px 0 8px 0;
      line-height: 1.4;
    }

    .llamado-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .llamado-info {
      font-size: 0.75rem;
      color: #0EA5E9;
      background: rgba(14, 165, 233, 0.12);
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
    }

    .empty-column {
      padding: 40px 0;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.9rem;
      font-style: italic;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 100px 0;
      color: var(--text-muted);
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--border-light);
      border-top-color: #0097D7;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 1024px) {
      .hero-news { grid-template-columns: 1fr; }
      .news-grid { grid-template-columns: repeat(2, 1fr); }
      .llamados-columns-grid { grid-template-columns: 1fr; }
    }

    @media (max-width: 640px) {
      .news-grid { grid-template-columns: 1fr; }
      .hero-title { font-size: 1.75rem; }
    }
  `]
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
