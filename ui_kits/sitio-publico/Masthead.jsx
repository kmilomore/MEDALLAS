/* global React */
const { useState } = React;

function Masthead({ active = "Inicio", onNav }) {
  const items = ["Inicio", "Sobre el Servicio", "Comunidades educativas", "Noticias", "Trámites", "Transparencia"];
  return (
    <header className="masthead-root">
      <div className="utility">
        <div>Gobierno de Chile · Ministerio de Educación</div>
        <ul>
          <li><a href="#">Contacto</a></li>
          <li><a href="#">Transparencia</a></li>
          <li><a href="#">Ley del Lobby</a></li>
          <li><a href="#">Denuncias</a></li>
        </ul>
      </div>
      <div className="brand-bar">
        <div className="brand-bar-inner">
          <div className="badge"><img src="../../assets/logo-slep-colchagua.webp" alt="SLEP Colchagua" /></div>
          <div className="wm">
            <div className="ovr">Servicio Local de Educación Pública</div>
            <div className="nm">Colchagua</div>
          </div>
          <div className="ministerial">
            <div className="ovr light">Región del Libertador</div>
            <div className="ovr-strong">Bernardo O'Higgins</div>
          </div>
        </div>
      </div>
      <nav className="primary">
        <div className="primary-inner">
          <ul>
            {items.map((it) => (
              <li key={it}>
                <a
                  href="#"
                  className={active === it ? "active" : ""}
                  onClick={(e) => { e.preventDefault(); onNav && onNav(it); }}
                >{it}</a>
              </li>
            ))}
          </ul>
          <div className="search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
            <input placeholder="Buscar en el sitio…" />
          </div>
        </div>
      </nav>
    </header>
  );
}

window.Masthead = Masthead;
