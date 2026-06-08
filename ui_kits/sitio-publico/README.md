# UI Kit · Sitio Público SLEP Colchagua

A hi-fi recreation of the **institutional public website** for SLEP Colchagua. This is a *plausible interpretation* of what a Chilean Servicio Local public website looks like — built from the brand foundations, not reverse-engineered from a live product. Replace any of these screens once the actual codebase / Figma is shared.

## Screens

- **Home** — masthead, hero, news grid, services strip, footer.
- **News article** — masthead, breadcrumb, article body, related items.
- **About** — institutional description, leadership grid, territory map placeholder.
- **Services / trámites** — list of citizen-facing services with status pills.

Open `index.html` for the interactive click-through.

## Components

- `Masthead.jsx` — utility strip + gradient header + primary nav.
- `Hero.jsx` — gradient hero block with title, lead, CTAs, stat grid.
- `NewsCard.jsx` — featured + standard news card variants.
- `ServiceCard.jsx` — citizen service tile with status pill.
- `Footer.jsx` — navy footer with sitemap and institutional links.
- `Button.jsx`, `Badge.jsx` — small primitives.

All components consume the tokens in `../../colors_and_type.css`.
