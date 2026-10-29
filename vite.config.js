import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Política de seguridad de la página publicada. GitHub Pages no permite cabeceras HTTP, así que va como <meta>.
// Solo se añade al compilar: en desarrollo Vite necesita scripts en línea.
// script.googleusercontent.com hace falta porque Apps Script redirige ahí sus respuestas.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  'connect-src https://script.google.com https://script.googleusercontent.com',
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const csp = {
  name: 'csp',
  apply: 'build',
  transformIndexHtml: () => [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' }],
};

export default defineConfig({
  // Rutas relativas para que funcione en GitHub Pages (usuario.github.io/repositorio/).
  base: './',
  plugins: [react(), tailwindcss(), csp],
});
