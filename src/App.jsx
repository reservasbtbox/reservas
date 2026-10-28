import { useState } from 'react';
import Confirmacion from './components/Confirmacion.jsx';
import Reserva from './components/Reserva.jsx';
import { MODO_DEMO } from './config.js';

// Stripe devuelve aquí con ?pago=ok&reserva=…&session_id=…  o  ?pago=cancelado&reserva=…
const params = new URLSearchParams(window.location.search);
const retorno = {
  pago: params.get('pago'),
  reserva: params.get('reserva'),
  sessionId: params.get('session_id'),
};

function limpiarUrl() {
  window.history.replaceState(null, '', window.location.pathname);
}

export default function App() {
  const [vista, setVista] = useState(retorno.pago === 'ok' && retorno.reserva ? 'confirmacion' : 'reserva');
  const [pagoCancelado] = useState(() => {
    if (retorno.pago !== 'cancelado') return false;
    limpiarUrl();
    return true;
  });

  function nuevaReserva() {
    limpiarUrl();
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
        {vista === 'confirmacion' ? (
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
