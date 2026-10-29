import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { euros } from '../utils.js';
import { Resumen } from './Confirmacion.jsx';

// Página del enlace "cancelar tu reserva" del email de confirmación (?cancelar=BT…&token=…).
export default function Cancelar({ reservaId, token, onNueva }) {
  const [estado, setEstado] = useState({ fase: 'cargando' });
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let activo = true;
    api
      .cancelacion(reservaId, token)
      .then((r) => activo && setEstado({ fase: r.cancelada ? 'cancelada' : 'info', ...r }))
      .catch((e) => activo && setEstado({ fase: 'error', mensaje: e.message }));
    return () => {
      activo = false;
    };
  }, [reservaId, token]);

  async function cancelar() {
    setEnviando(true);
    try {
      const r = await api.cancelar(reservaId, token);
      setEstado((e) => ({ ...e, fase: 'hecho', reembolsado: r.reembolsado, importe: r.importe }));
    } catch (e) {
      setEstado((s) => ({ ...s, fase: 'info', puedeCancelar: false, motivo: e.message }));
    } finally {
      setEnviando(false);
    }
  }

  const nueva = (
    <button type="button" className="boton px-5 py-3" onClick={onNueva}>
      Hacer una reserva
    </button>
  );

  return (
    <section className="glass rounded-2xl max-w-xl mx-auto p-6 sm:p-9" aria-live="polite">
      {estado.fase === 'cargando' && (
        <div className="text-center py-8">
          <span className="spinner" aria-hidden="true" />
          <h1 className="font-bold text-2xl mt-5">Buscando tu reserva…</h1>
        </div>
      )}

      {estado.fase === 'info' && (
        <>
          <h1 className="font-bold text-2xl sm:text-3xl">Cancelar reserva</h1>
          <Resumen reserva={estado.reserva} />
          {estado.puedeCancelar ? (
            <>
              <p className="text-[#c7d6e5] mt-6">
                Si cancelas, tu código de acceso dejará de funcionar y la hora quedará libre para otros.
                {estado.reembolso > 0 && <> Te devolveremos <strong>{euros(estado.reembolso)}</strong> a la tarjeta con la que pagaste (tarda entre 5 y 10 días).</>}
              </p>
              <p className="text-[#9bb1c7] text-sm mt-2">Puedes cancelar online hasta el {estado.limite}.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <button type="button" className="boton px-5 py-3 flex items-center gap-2" disabled={enviando} aria-busy={enviando} onClick={cancelar}>
                  {enviando && <span className="spinner pequeno" aria-hidden="true" />}
                  {enviando ? 'Cancelando…' : 'Sí, cancelar mi reserva'}
                </button>
              </div>
            </>
          ) : (
            <p className="aviso mt-6">{estado.motivo}</p>
          )}
        </>
      )}

      {estado.fase === 'hecho' && (
        <>
          <p className="eyebrow text-[#00e0c6] text-xs">RESERVA CANCELADA</p>
          <h1 className="font-bold text-2xl sm:text-3xl mt-2">Tu reserva se ha cancelado</h1>
          <p className="text-[#c7d6e5] mt-3">
            {estado.reembolsado
              ? `Hemos iniciado el reembolso de ${euros(estado.importe)}. Puede tardar entre 5 y 10 días en aparecer en tu cuenta.`
              : 'La hora ha quedado libre.'}{' '}
            Te hemos enviado un email de confirmación.
          </p>
          <div className="mt-7">{nueva}</div>
        </>
      )}

      {estado.fase === 'cancelada' && (
        <>
          <h1 className="font-bold text-2xl">Esta reserva ya está cancelada</h1>
          <Resumen reserva={estado.reserva} />
          <div className="mt-7">{nueva}</div>
        </>
      )}

      {estado.fase === 'error' && (
        <>
          <h1 className="font-bold text-2xl">No hemos podido abrir la cancelación</h1>
          <p className="aviso-error mt-4">{estado.mensaje}</p>
          <p className="text-[#c7d6e5] mt-4 text-sm">Usa el enlace del email de confirmación tal cual, o responde a ese email si necesitas ayuda.</p>
          <div className="mt-7">{nueva}</div>
        </>
      )}
    </section>
  );
}
