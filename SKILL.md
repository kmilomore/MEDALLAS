---
name: slep-colchagua-design
description: Use this skill to generate well-branded interfaces and assets for Servicio Local de Educación Pública (SLEP) Colchagua, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

Key files:
- `README.md` — full brand context, content fundamentals, visual foundations, iconography.
- `colors_and_type.css` — all design tokens as CSS custom properties (color, type, spacing, shadow, radius, motion).
- `fonts/` — Museo Sans 100 / 500 / 700 / 900 web fonts.
- `assets/` — the master institutional badge logo.
- `preview/` — token + component preview cards (one HTML file per concept).
- `ui_kits/sitio-publico/` — interactive recreation of the institutional public website with React components (Masthead, Hero, Cards, Footer).

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. Link `colors_and_type.css` (or copy its `:root` block) and reference the fonts in `fonts/`. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions (audience, length/scope, tone, formal vs. citizen-facing, etc.), and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

Hard rules to never break:
- Spanish (Chile), inclusive plural forms, sentence case for headlines, **no emoji** in institutional UI.
- Color hierarchy ≈ 60 % Soft White · 25 % Navy · 10 % Royal · 5 % Coral.
- Display headlines in **Museo Sans 900**, tight tracking (-0.02em), short leading.
- Lucide for icons (or a closest CDN substitute) — 2 px stroke, 24×24 grid.
- No bounce / spring motion. No bluish-purple gradients. No hand-drawn SVG illustrations.
- Never distort, recolor, or remove elements from the institutional badge.
