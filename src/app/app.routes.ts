import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { DoeComponent } from './components/doe/doe.component';
import { CentrosComponent } from './components/centros/centros.component';
import { AgendaComponent } from './components/agenda/agenda.component';
import { InasistenciasComponent } from './components/inasistencias/inasistencias.component';
import { HorariosComponent } from './components/horarios/horarios.component';
import { ExamenesComponent } from './components/examenes/examenes.component';
import { SettingsComponent } from './components/settings/settings.component';
import { AyudaComponent } from './components/ayuda/ayuda.component';
import { SalonesComponent } from './components/salones/salones.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'doe', component: DoeComponent },
  { path: 'centros', component: CentrosComponent },
  { path: 'agenda', component: AgendaComponent },
  { path: 'inasistencias', component: InasistenciasComponent },
  { path: 'horarios', component: HorariosComponent },
  { path: 'salones', component: SalonesComponent },
  { path: 'salon/:nombre', component: SalonesComponent },
  { path: 'examenes', component: ExamenesComponent },
  { path: 'configuracion', component: SettingsComponent },
  { path: 'ayuda', component: AyudaComponent },
  { path: '**', redirectTo: 'home' }
];
