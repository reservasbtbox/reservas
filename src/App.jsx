import { useEffect, useState } from 'react';
import logo from './assets/logo.png';
import Cancelar from './components/Cancelar.jsx';
import Confirmacion from './components/Confirmacion.jsx';
import Inicio from './components/Inicio.jsx';
import Proximamente from './components/Proximamente.jsx';
import Reserva from './components/Reserva.jsx';
import { MODO_DEMO, PROXIMAMENTE } from './config.js';
import { recordarPago } from './utils.js';

// Stripe devuelve aquí con ?pago=ok&reserva=…&session_id=…  o  ?pago=cancelado&reserva=…
// y el email de confirmación enlaza aquí con ?cancelar=…&token=…
// La reserva y el session_id (o el token) permiten ver el PIN o cancelar: se quitan de la URL al momento para que
// no queden en el historial ni en enlaces compartidos, y se guardan solo en esta pestaña por si el cliente recarga.
const CLAVE_RETORNO = 'btbox-retorno';

function leerRetorno() {
  const params = new URLSearchParams(window.location.search);
  const pago = params.get('pago');
  const cancelar = params.get('cancelar');
  if (cancelar) {
    window.history.replaceState(null, '', window.location.pathname);
    const retorno = { cancelar, token: params.get('token') };
    guardarRetorno(retorno);
    return retorno;
  }
  if (pago) {
    window.history.replaceState(null, '', window.location.pathname);
    const retorno = { pago, reserva: params.get('reserva'), sessionId: params.get('session_id') };
    if (pago === 'ok') {
      guardarRetorno(retorno);
      recordarPago(null);
    } else if (retorno.reserva && params.get('token')) {
      // Ha vuelto con "atrás" desde Stripe: Reserva.jsx libera la hora al cargar.
      recordarPago({ id: retorno.reserva, token: params.get('token') });
    }
    return retorno;
  }
  try {
    return JSON.parse(sessionStorage.getItem(CLAVE_RETORNO)) || {};
  } catch {
    return {};
  }
}

function guardarRetorno(retorno) {
  try {
    if (retorno) sessionStorage.setItem(CLAVE_RETORNO, JSON.stringify(retorno));
    else sessionStorage.removeItem(CLAVE_RETORNO);
  } catch {
    // Sin almacenamiento: si recarga, el PIN le llega igualmente por email.
  }
}

const retorno = leerRetorno();

// Dos páginas: inicio (#/) y reservas (#/reservar). Con # funcionan en GitHub Pages sin configurar nada.
const paginaDeHash = () => (window.location.hash.startsWith('#/reservar') ? 'reservar' : 'inicio');

export default function App() {
  const [vista, setVista] = useState(() => {
    if (retorno.cancelar) return 'cancelar';
    return retorno.pago === 'ok' && retorno.reserva ? 'confirmacion' : 'reserva';
  });
  // Al volver de Stripe o desde el enlace de cancelación se abre directamente el bloque de reservas.
  const [pagina, setPagina] = useState(() => (retorno.pago || retorno.cancelar ? 'reservar' : paginaDeHash()));
  const pagoCancelado = retorno.pago === 'cancelado';

  useEffect(() => {
    const alCambiar = () => {
      const nueva = paginaDeHash();
      // Salir al inicio cierra la confirmación o cancelación que se estuviera viendo.
      if (nueva === 'inicio') {
        guardarRetorno(null);
        setVista('reserva');
      }
      setPagina(nueva);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', alCambiar);
    return () => window.removeEventListener('hashchange', alCambiar);
  }, []);

  function nuevaReserva() {
    guardarRetorno(null);
    setVista('reserva');
    setPagina('reservar');
    if (window.location.hash !== '#/reservar') window.location.hash = '#/reservar';
    window.scrollTo(0, 0);
  }

  return (
    <div className="shell">
      <header className="border-b border-[#1d3047]">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3 sm:py-4 flex items-center gap-3">
          <a href="#/" className="flex items-center gap-3 min-w-0" aria-label="BTBOX Training Center, inicio">
            <img src={logo} alt="" className="w-10 h-10 rounded-xl bg-white object-contain p-1 shrink-0" />
            <span className="min-w-0">
              <span className="block font-bold tracking-wide leading-tight truncate">BTBOX TRAINING CENTER</span>
              <span className="block eyebrow text-[11px] text-[#5fc4f0]">RESERVAS 24/7</span>
            </span>
          </a>
          <nav className="ml-auto flex items-center gap-1 sm:gap-2" aria-label="Principal">
            <a href="#/" className={`nav-enlace hidden sm:inline-block ${pagina === 'inicio' ? 'activo' : ''}`} aria-current={pagina === 'inicio' ? 'page' : undefined}>
              Inicio
            </a>
            <a href="#/reservar" className="boton px-4 py-2.5 text-sm" aria-current={pagina === 'reservar' ? 'page' : undefined}>
              Reservar
            </a>
          </nav>
        </div>
      </header>

      {MODO_DEMO && (
        <p className="bg-[#3a2e0b] text-[#ffe08a] text-sm text-center px-4 py-2">
          Modo demostración: datos inventados y sin pagos reales. Pon la URL del Apps Script en <code>src/config.js</code> para conectarla.
        </p>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {pagina === 'inicio' ? (
          <Inicio />
        ) : PROXIMAMENTE ? (
          <Proximamente />
        ) : vista === 'cancelar' ? (
          <Cancelar reservaId={retorno.cancelar} token={retorno.token} onNueva={nuevaReserva} />
        ) : vista === 'confirmacion' ? (
          <Confirmacion reservaId={retorno.reserva} sessionId={retorno.sessionId} onNueva={nuevaReserva} />
        ) : (
          <Reserva pagoCancelado={pagoCancelado} />
        )}
      </main>

      <footer className="max-w-6xl mx-auto px-4 sm:px-8 pb-8 text-[#7d93a9] text-xs">
        <p>BTBOX Training Center · Acceso 24/7 con código PIN · Pago seguro con Stripe</p>
      </footer>
    </div>
  );
}
