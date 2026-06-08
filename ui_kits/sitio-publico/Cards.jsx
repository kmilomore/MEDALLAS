/* global React */

function NewsCard({ category, date, title, summary, featured, onOpen }) {
  return (
    <article className={"news-card" + (featured ? " featured" : "")} onClick={onOpen}>
      <div className="news-thumb">
        <span className="placeholder-label">Imagen institucional</span>
      </div>
      <div className="news-body">
        <div className="news-meta">
          <span className={"chip chip-" + (category?.tone || "info")}>{category?.label || "Noticias"}</span>
          <span className="news-date">{date}</span>
        </div>
        <h3 className="news-title">{title}</h3>
        <p className="news-summary">{summary}</p>
        <a className="news-link" href="#" onClick={(e) => e.preventDefault()}>
          Leer comunicado
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
        </a>
      </div>
    </article>
  );
}

function ServiceCard({ icon, title, description, status, onOpen }) {
  return (
    <a className="service-card" href="#" onClick={(e) => { e.preventDefault(); onOpen && onOpen(); }}>
      <div className="service-icon">{icon}</div>
      <div className="service-body">
        <h4>{title}</h4>
        <p>{description}</p>
      </div>
      {status && <span className={"chip chip-" + status.tone}>{status.label}</span>}
      <svg className="service-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
    </a>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="badge"><img src="../../assets/logo-slep-colchagua.webp" alt="SLEP Colchagua" /></div>
          <div className="footer-wm">
            <div className="ovr">Servicio Local de Educación Pública</div>
            <div className="nm">Colchagua</div>
            <div className="addr">Av. Presidente Salvador Allende 123, San Fernando<br />Región del Libertador Bernardo O'Higgins</div>
          </div>
        </div>
        <div className="footer-col">
          <h5>El Servicio</h5>
          <ul>
            <li><a href="#">Sobre nosotros</a></li>
            <li><a href="#">Equipo directivo</a></li>
            <li><a href="#">Plan estratégico</a></li>
            <li><a href="#">Establecimientos</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h5>Comunidades</h5>
          <ul>
            <li><a href="#">Familias</a></li>
            <li><a href="#">Docentes</a></li>
            <li><a href="#">Estudiantes</a></li>
            <li><a href="#">Convivencia escolar</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h5>Trámites</h5>
          <ul>
            <li><a href="#">Postulación SAE</a></li>
            <li><a href="#">Certificados</a></li>
            <li><a href="#">Denuncias</a></li>
            <li><a href="#">Solicitud de información</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h5>Transparencia</h5>
          <ul>
            <li><a href="#">Activa</a></li>
            <li><a href="#">Pasiva</a></li>
            <li><a href="#">Ley del Lobby</a></li>
            <li><a href="#">Compras públicas</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <div>© 2026 SLEP Colchagua · Ley 21.040 de Nueva Educación Pública</div>
        <div className="bottom-links">
          <a href="#">Mapa del sitio</a>
          <a href="#">Accesibilidad</a>
          <a href="#">Política de privacidad</a>
        </div>
      </div>
    </footer>
  );
}

window.NewsCard = NewsCard;
window.ServiceCard = ServiceCard;
window.Footer = Footer;
