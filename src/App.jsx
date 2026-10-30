import { useState } from 'react';
import logo from './assets/logo.png';
import Cancelar from './components/Cancelar.jsx';
import Confirmacion from './components/Confirmacion.jsx';
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

export default function App() {
  const [vista, setVista] = useState(() => {
    if (retorno.cancelar) return 'cancelar';
    return retorno.pago === 'ok' && retorno.reserva ? 'confirmacion' : 'reserva';
  });
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
          <img src={logo} alt="" className="w-10 h-10 rounded-xl bg-white object-contain p-1" />
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
