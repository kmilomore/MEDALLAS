/* global React */
function Hero({ eyebrow, title, lead, primaryCta, secondaryCta, stats, onPrimary }) {
  return (
    <section className="hero">
      <div className="hero-inner">
        <div className="hero-left">
          {eyebrow && <div className="eyebrow on-dark">{eyebrow}</div>}
          <h1>{title}</h1>
          {lead && <p>{lead}</p>}
          <div className="ctas">
            {primaryCta && (
              <a className="btn primary-on-dark" href="#" onClick={(e) => { e.preventDefault(); onPrimary && onPrimary(); }}>
                {primaryCta}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
              </a>
            )}
            {secondaryCta && (
              <a className="btn outline-on-dark" href="#">{secondaryCta}</a>
            )}
          </div>
        </div>
        {stats && (
          <div className="hero-right">
            <div className="stat-grid">
              {stats.map((s, i) => (
                <div className="stat" key={i}>
                  <div className="stat-n">{s.n}</div>
                  <div className="stat-l">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

window.Hero = Hero;
