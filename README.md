# BTBOX · Página de reservas

Página de reservas por horas de BTBOX Training Center (React + Vite). Es una web estática pensada para GitHub Pages y se conecta al Google Apps Script `btbox-reservas.gs`, que gestiona la disponibilidad, el pago con Stripe y el acceso con Akiles.

## Conectarla al Apps Script

Abre `src/config.js` y pega la URL de la aplicación web (termina en `/exec`) en `API_URL`.
Mientras no la pongas, la página funciona en **modo demostración**: datos inventados y sin pagos reales.

## Probarla en tu ordenador

```bash
npm install
npm run dev
```

Abre la dirección que aparece (normalmente http://localhost:5173).

## Publicarla

El archivo `.github/workflows/deploy.yml` publica la página en GitHub Pages cada vez que subes cambios a la rama `main`.
En GitHub, ve a *Settings → Pages* y en *Source* elige **GitHub Actions**.
La dirección de la página publicada es la que tienes que poner en `URL_PAGINA_RESERVAS` del Apps Script.
