# SCyber — AI Cyber Threat Detection & Incident Response

This is the exact SCyber prototype (landing page + full security console)
wrapped in a minimal, runnable Vite + React project. The design,
functionality, animations, and content are unchanged from the working
version — this only adds the project scaffolding needed to run it locally.

## Run it

```bash
npm install
npm run dev
```

Then open the URL Vite prints (defaults to http://localhost:5173). It
should open automatically.

```bash
npm run build      # production build to dist/
npm run preview    # preview the production build locally
```

## What's here

```
index.html          Vite entry HTML
vite.config.js       Vite + React plugin config
tailwind.config.js    Tailwind CSS config (the app is styled with Tailwind utility classes)
postcss.config.js    Required for Tailwind
src/
  main.jsx            Mounts the app to #root
  index.css           Tailwind directives + minimal global reset
  App.jsx             The entire SCyber application — landing page, security
                       console, all 13 console pages, live demo data,
                       animations. This is the same file you already had;
                       nothing inside it was changed for this packaging.
```

## Notes

- The app is a single component file (`src/App.jsx`) using internal state
  for navigation (no react-router) — that's how it was originally built,
  so it's kept as-is per your request not to rewrite anything.
- Fonts (Manrope, IBM Plex Mono) are loaded at runtime via a Google Fonts
  `<link>` tag the app injects itself — no extra font files needed, but it
  does require an internet connection on first load to fetch them.
- Dependencies: `react`, `react-dom`, `lucide-react` (icons), `recharts`
  (charts). All installed via `npm install`.
- All data (threats, transactions, incidents, risk scores) is simulated
  client-side — there is no backend in this project.
