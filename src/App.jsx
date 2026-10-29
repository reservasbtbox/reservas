import { useState } from 'react';
import Confirmacion from './components/Confirmacion.jsx';
import Reserva from './components/Reserva.jsx';
import { MODO_DEMO, PROXIMAMENTE } from './config.js';

// Stripe devuelve aquí con ?pago=ok&reserva=…&session_id=…  o  ?pago=cancelado&reserva=…
// La reserva y el session_id permiten ver el PIN: se quitan de la URL al momento para que no queden
// en el historial ni en enlaces compartidos, y se guardan solo en esta pestaña por si el cliente recarga.
const CLAVE_RETORNO = 'btbox-retorno';

function leerRetorno() {
  const params = new URLSearchParams(window.location.search);
  const pago = params.get('pago');
  if (pago) {
    window.history.replaceState(null, '', window.location.pathname);
    const retorno = { pago, reserva: params.get('reserva'), sessionId: params.get('session_id') };
    if (pago === 'ok') guardarRetorno(retorno);
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

export default function App() {
  const [vista, setVista] = useState(retorno.pago === 'ok' && retorno.reserva ? 'confirmacion' : 'reserva');
  const pagoCancelado = retorno.pago === 'cancelado';

  function nuevaReserva() {
    guardarRetorno(null);
    setVista('reserva');
    window.scrollTo(0, 0);
  }

  return (
    <div className="shell">
      <header className="border-b border-[#1d3047]">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4 flex items-center gap-3">
          <span aria-hidden="true" className="w-9 h-9 rounded-xl marca flex items-center justify-center font-bold text-xl text-[#03101d]">B</span>
          <div>
            <p className="font-bold tracking-wide leading-tight">BTBOX TRAINING CENTER</p>
            <p className="eyebrow text-[11px] text-[#5fc4f0]">RESERVAS 24/7</p>
          </div>
        </div>
      </header>

      {MODO_DEMO && (
        <p className="bg-[#3a2e0b] text-[#ffe08a] text-sm text-center px-4 py-2">
          Modo demostración: datos inventados y sin pagos reales. Pon la URL del Apps Script en <code>src/config.js</code> para conectarla.
        </p>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {PROXIMAMENTE ? (
          <section className="glass rounded-2xl max-w-xl mx-auto p-6 sm:p-9 text-center">
            <h1 className="font-bold text-2xl sm:text-3xl">Reservas disponibles próximamente</h1>
            <p className="text-[#c7d6e5] mt-3">Estamos preparando las reservas online. Vuelve en unos días.</p>
          </section>
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
