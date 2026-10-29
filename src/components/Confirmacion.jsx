import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { duracion, esUrlSegura, euros, fechaLarga, plural } from '../utils.js';

const INTENTOS = 10;
const ESPERA_MS = 3000;

function Resumen({ reserva }) {
  if (!reserva) return null;
  const filas = [
    ['Código de reserva', reserva.id],
    ['Fecha', reserva.fechaTexto || fechaLarga(reserva.fecha)],
    ['Horario', `${reserva.hora} – ${reserva.horaFin} (${duracion(reserva.horas * 60)})`],
    ['Personas', `${plural(reserva.profesionales, 'profesional', 'profesionales')} + ${plural(reserva.clientes, 'cliente', 'clientes')}`],
    ['Importe', euros(reserva.precio)],
  ];
  return (
    <dl className="mt-6 divide-y divide-[#24364a] border-y border-[#24364a]">
      {filas.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4 py-2.5 text-sm sm:text-base">
          <dt className="text-[#9bb1c7]">{k}</dt>
          <dd className="text-right font-semibold first-letter:uppercase">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function Confirmacion({ reservaId, sessionId, onNueva }) {
  const [estado, setEstado] = useState({ fase: 'cargando' });
  const [vuelta, setVuelta] = useState(0);

  useEffect(() => {
    let activo = true;
    let temporizador;

    // El pago puede tardar unos segundos en confirmarse: se reintenta mientras siga pendiente.
    async function consultar(intento) {
      try {
        const r = await api.estado(reservaId, sessionId);
        if (!activo) return;
        if (r.estado === 'Pendiente de pago') {
          if (intento < INTENTOS) {
            setEstado({ fase: 'cargando', reserva: r.reserva });
            temporizador = setTimeout(() => consultar(intento + 1), ESPERA_MS);
          } else {
            setEstado({ fase: 'pendiente', reserva: r.reserva });
          }
        } else if (r.estado === 'Pagada') {
          setEstado({ fase: 'pagada', reserva: r.reserva, acceso: r.acceso });
        } else {
          setEstado({ fase: 'fallida', estado: r.estado, reserva: r.reserva });
        }
      } catch (e) {
        if (activo) setEstado({ fase: 'error', mensaje: e.message });
      }
    }

    setEstado({ fase: 'cargando' });
    consultar(1);
    return () => {
      activo = false;
      clearTimeout(temporizador);
    };
  }, [reservaId, sessionId, vuelta]);

  const reintentar = (
    <button type="button" className="boton-sec px-5 py-3" onClick={() => setVuelta((v) => v + 1)}>
      Comprobar de nuevo
    </button>
  );
  const nueva = (
    <button type="button" className="boton px-5 py-3" onClick={onNueva}>
      Hacer otra reserva
    </button>
  );

  return (
    <section className="glass rounded-2xl max-w-xl mx-auto p-6 sm:p-9" aria-live="polite">
      {estado.fase === 'cargando' && (
        <div className="text-center py-8">
          <span className="spinner" aria-hidden="true" />
          <h1 className="font-bold text-2xl mt-5">Confirmando tu pago…</h1>
          <p className="text-[#9bb1c7] mt-2">Esto tarda solo unos segundos. No cierres esta página.</p>
        </div>
      )}

      {estado.fase === 'pagada' && (
        <>
          <p className="eyebrow text-[#00e0c6] text-xs">PAGO CONFIRMADO</p>
          <h1 className="font-bold text-2xl sm:text-3xl mt-2">¡Reserva confirmada!</h1>
          <Resumen reserva={estado.reserva} />

          {estado.acceso?.pin ? (
            <div className="mt-6 rounded-2xl banner border border-[#2a5f8f] p-6 text-center">
              <p className="text-sm text-[#adc8dd]">Tu código para abrir la puerta</p>
              <p className="pin mt-2" aria-label={`Código PIN: ${estado.acceso.pin.split('').join(' ')}`}>{estado.acceso.pin}</p>
              <p className="text-sm text-[#adc8dd] mt-3">Te lo hemos enviado también por email.</p>
              {esUrlSegura(estado.acceso.magicLink) && (
                <a href={estado.acceso.magicLink} className="boton inline-block mt-4 px-5 py-3" target="_blank" rel="noopener noreferrer">
                  Abrir la puerta desde el móvil
                </a>
              )}
            </div>
          ) : (
            <p className="aviso mt-6">Estamos generando tu código de acceso. Te llegará por email en unos minutos.</p>
          )}

          <ul className="mt-6 text-sm text-[#c7d6e5] space-y-2 list-disc pl-5">
            <li>El código funciona desde 10 minutos antes hasta 10 minutos después de tu horario.</li>
            <li>Marca el código en el teclado de la puerta para entrar.</li>
            <li>Guarda el código de reserva por si necesitas contactar con el centro.</li>
          </ul>
          <div className="mt-7">{nueva}</div>
        </>
      )}

      {estado.fase === 'pendiente' && (
        <>
          <h1 className="font-bold text-2xl">Tu pago se está procesando</h1>
          <p className="text-[#c7d6e5] mt-3">
            Aún no hemos recibido la confirmación de Stripe. En cuanto llegue, te enviaremos un email con tu código de acceso. Puedes comprobarlo de nuevo
            en un momento.
          </p>
          <Resumen reserva={estado.reserva} />
          <div className="mt-7 flex flex-wrap gap-3">{reintentar}</div>
        </>
      )}

      {estado.fase === 'fallida' && (
        <>
          <h1 className="font-bold text-2xl">
            {estado.estado === 'Caducada' ? 'La reserva ha caducado' : 'La reserva está cancelada'}
          </h1>
          <p className="text-[#c7d6e5] mt-3">
            {estado.estado === 'Caducada'
              ? 'El pago no se completó a tiempo y la hora se ha liberado. Puedes hacer una nueva reserva.'
              : 'Esta reserva se ha cancelado. Si crees que es un error, contacta con el centro indicando el código de reserva.'}
          </p>
          <Resumen reserva={estado.reserva} />
          <div className="mt-7">{nueva}</div>
        </>
      )}

      {estado.fase === 'error' && (
        <>
          <h1 className="font-bold text-2xl">No hemos podido comprobar tu reserva</h1>
          <p className="aviso-error mt-4">{estado.mensaje}</p>
          <p className="text-[#c7d6e5] mt-4 text-sm">
            Si has pagado, no te preocupes: recibirás el código por email cuando se confirme. Código de reserva: <strong>{reservaId}</strong>
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            {reintentar}
            {nueva}
          </div>
        </>
      )}
    </section>
  );
}
