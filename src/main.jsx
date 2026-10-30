import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/plus-jakarta-sans/800.css';
import '@fontsource/montserrat/800.css';
import '@fontsource/montserrat/900.css';
import App from './App.jsx';
import './index.css';

const raiz = document.getElementById('root');

// GitHub Pages no deja enviar la cabecera que impide mostrar la web dentro de otra página (clickjacking):
// si está dentro de un marco, no se muestra y se ofrece abrirla normalmente.
if (window.top !== window.self) {
  const enlace = document.createElement('a');
  enlace.href = window.location.href;
  enlace.target = '_top';
  enlace.rel = 'noopener';
  enlace.textContent = 'Abrir BTBOX Reservas';
  enlace.style.cssText = 'display:block;padding:24px;color:#7cc4ff;font:600 16px sans-serif';
  raiz.append(enlace);
} else {
  createRoot(raiz).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
