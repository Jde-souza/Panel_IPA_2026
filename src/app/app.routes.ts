import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { DoeComponent } from './components/doe/doe.component';
import { CentrosComponent } from './components/centros/centros.component';
import { AgendaComponent } from './components/agenda/agenda.component';
import { InasistenciasComponent } from './components/inasistencias/inasistencias.component';
import { HorariosComponent } from './components/horarios/horarios.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'doe', component: DoeComponent },
  { path: 'centros', component: CentrosComponent },
  { path: 'agenda', component: AgendaComponent },
  { path: 'inasistencias', component: InasistenciasComponent },
  { path: 'horarios', component: HorariosComponent },
  { path: '**', redirectTo: 'home' }
];
