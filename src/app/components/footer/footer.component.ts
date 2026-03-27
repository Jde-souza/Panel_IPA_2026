import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  template: `
    <footer class="main-footer">
      <div class="footer-container">
        <!-- Panel 1: Logos de Dependencias (Fila Superior) -->
        <div class="footer-logos-row primary">
          <a href="https://www.dgeip.edu.uy/" target="_blank" class="footer-logo-link">
            <img src="https://www.anep.edu.uy/sites/default/files/images/logos/svg/2025/v2/Logo%20EIP%20Horizontal%20DIAPO.svg" alt="ANEP Primaria" width="180">
          </a>
          <a href="https://www.dges.edu.uy/" target="_blank" class="footer-logo-link">
            <img src="https://www.anep.edu.uy/sites/default/files/images/logos/svg/2025/v2/Logo%20Secundaria%20Horizontal%20DIAPO.svg" alt="ANEP Secundaria" width="180">
          </a>
          <a href="https://www.utu.edu.uy/" target="_blank" class="footer-logo-link">
            <img src="https://www.anep.edu.uy/sites/default/files/images/logos/svg/2025/v2/Logo%20UTU%20Horizontal%20DIAPO%20v2.svg" alt="ANEP UTU" width="180">
          </a>
          <a href="https://www.cfe.edu.uy/" target="_blank" class="footer-logo-link">
            <img src="https://www.anep.edu.uy/sites/default/files/images/logos/svg/2025/v2/Logo%20CFE%20Horizontal%20DIAPO.svg" alt="ANEP CFE" width="180">
          </a>
        </div>

        <!-- Panel 1.5: Logos de Socios (Fila Inferior) -->
        <div class="footer-logos-row secondary">
          <a href="https://www.mec.gub.uy/" target="_blank" class="footer-logo-link mini">
            <img src="https://www.anep.edu.uy/sites/default/files/2025-09/MEC%2050.svg" alt="MEC" width="140">
          </a>
          <a href="https://udelar.edu.uy/" target="_blank" class="footer-logo-link mini">
            <img src="https://www.anep.edu.uy/sites/default/files/2025-09/Logo%20UDELAR%2050.svg" alt="UDELAR" width="140">
          </a>
          <a href="https://utec.edu.uy/" target="_blank" class="footer-logo-link mini">
            <img src="https://www.anep.edu.uy/sites/default/files/2025-09/Logo%20ANEP%20UTEC%2050.svg" alt="UTEC" width="140">
          </a>
          <a href="https://ineed.edu.uy/" target="_blank" class="footer-logo-link mini">
            <img src="https://www.anep.edu.uy/sites/default/files/2025-09/Logo%20INEED%2050.svg" alt="INEEd" width="140">
          </a>
        </div>

        <div class="footer-separator top"></div>

        <!-- Panel 2: Enlaces e Información -->
        <div class="footer-links-columns">
          <div class="footer-column">
            <h3>Institucional</h3>
            <ul>
              <li><a href="https://ipa.cfe.edu.uy/index.php/2016-04-14-14-25-43/historia-ipa"><i class="fa-solid fa-landmark icon-margin" aria-hidden="true"></i> Historia de IPA</a></li>
              <li><a href="https://ipa.cfe.edu.uy/index.php/2016-04-14-14-25-43/equipo-de-direccion"><i class="fa-solid fa-users-gear icon-margin" aria-hidden="true"></i> Autoridades</a></li>
              <li><a href="https://www.cfe.edu.uy/index.php/funcionarios/general/normativa-info-general"><i class="fa-solid fa-gavel icon-margin" aria-hidden="true"></i> Normativa</a></li>
              <li><a href="https://www.anep.edu.uy/llamados"><i class="fa-solid fa-bullhorn icon-margin" aria-hidden="true"></i> Llamados</a></li>
            </ul>
          </div>
          <div class="footer-column">
            <h3>Contacto</h3>
            <ul class="contact-list">
              <li>
                <i class="fa-solid fa-location-dot" aria-hidden="true"></i>
                <span>Av. Libertador Brig. Gral. Lavalleja 2025</span>
              </li>
              <li>
                <i class="fa-solid fa-phone" aria-hidden="true"></i>
                <span>(+598) 2924 7239</span>
              </li>
              <li>
                <i class="fa-solid fa-envelope" aria-hidden="true"></i>
                <a href="mailto:ipa@cfe.edu.uy">ipa@cfe.edu.uy</a>
              </li>
            </ul>
            <div class="social-icons-wrapper">
              <span class="social-title">SEGUINOS EN</span>
              <div class="social-icons">
                
                
                <a href="https://x.com/ipaenred" target="_blank" aria-label="X (Twitter) (abre en nueva pestaña)"><i class="fa-brands fa-x-twitter" aria-hidden="true"></i></a>
                
                <a href="https://www.youtube.com/channel/UCAXfKJDI2akHf0Kn6ceuyIg" target="_blank" aria-label="YouTube (abre en nueva pestaña)"><i class="fa-brands fa-youtube" aria-hidden="true"></i></a>
              </div>
            </div>
          </div>
          <div class="footer-column">
            <h3>Internos</h3>
            <ul class="internos-list">
              <li><span class="ext-no">200</span> Central</li>
              <li><span class="ext-no">204</span> Dirección</li>
              <li><span class="ext-no">205</span> Bedelía</li>
              <li><span class="ext-no">217</span> Biblioteca</li>
              <li><span class="ext-no">219</span> Astronomía</li>
            </ul>
          </div>
        </div>

        <div class="footer-separator bottom"></div>

        <!-- Panel 3: Copyright -->
        <div class="footer-bottom-bar">
          <div class="copyright-info">
            <span>&copy; 2026 IPA Instituto de Profesores Artigas | Uruguay</span>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .main-footer {
      background-color: #1B2126;
      color: white;
      padding: 60px 0 30px 0;
      font-family: 'Inter', sans-serif;
      overflow-x: hidden;
    }

    .footer-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    /* Filas de Logos */
    .footer-logos-row {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      gap: 50px;
      margin-bottom: 40px;
    }

    .footer-logos-row.secondary {
      gap: 40px;
      margin-top: 10px;
      margin-bottom: 20px;
    }

    .footer-logo-link {
      display: block;
      transition: transform 0.3s ease, filter 0.3s ease;
      filter: brightness(1) contrast(1.1);
    }

    .footer-logo-link:hover {
      transform: scale(1.05);
      filter: brightness(1.2);
    }

    .footer-logo-link img {
      max-width: 220px;
      height: auto;
    }

    .footer-logo-link.mini img {
      max-width: 130px;
      opacity: 0.8;
    }

    .main-footer {
      background-color: #1B2126;
      color: white;
      padding: 60px 0 30px 0;
      font-family: 'Inter', sans-serif;
      overflow-x: hidden;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .footer-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    /* Columnas de Enlaces */
    .footer-links-columns {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 60px;
      padding: 50px 0;
    }

    .footer-column h3 {
      font-family: 'Outfit', sans-serif;
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 25px;
      color: var(--primary-color);
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .footer-column ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .footer-column ul li {
      margin-bottom: 15px;
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.95rem;
      line-height: 1.6;
    }

    .footer-column ul li a {
      color: rgba(255, 255, 255, 0.7);
      text-decoration: none;
      transition: all 0.25s ease;
      display: inline-flex;
      align-items: center;
    }

    .footer-column ul li a:hover {
      color: white;
      transform: translateX(5px);
    }

    .icon-margin {
      margin-right: 10px;
      width: 18px;
      text-align: center;
      color: var(--primary-color);
    }

    /* Contact List */
    .contact-list li {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .contact-list i {
      color: var(--primary-color);
      margin-top: 4px;
      width: 16px;
    }

    .social-icons-wrapper {
      margin-top: 30px;
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .social-title {
      font-size: 0.75rem;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.4);
      letter-spacing: 1.5px;
    }

    .social-icons {
      display: flex;
      gap: 15px;
    }

    .social-icons a {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.05);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.1rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .social-icons a:hover {
      background: var(--primary-color);
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(0, 174, 239, 0.3);
    }

    /* Internos */
    .internos-list li {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .ext-no {
      font-weight: 800;
      color: var(--primary-color);
      font-family: 'Outfit', sans-serif;
      min-width: 40px;
    }

    /* Separadores */
    .footer-separator {
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
      width: 100%;
    }

    /* Barra Inferior */
    .footer-bottom-bar {
      padding: 30px 0;
      text-align: center;
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.4);
      font-weight: 500;
    }

    /* Responsividad */
    @media (max-width: 900px) {
      .footer-links-columns { grid-template-columns: 1fr 1fr; gap: 40px; }
    }

    @media (max-width: 600px) {
      .footer-links-columns { grid-template-columns: 1fr; }
      .main-footer { padding-top: 40px; }
    }
  `]
})
export class FooterComponent { }
