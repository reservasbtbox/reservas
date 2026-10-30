import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api.js';
import { MODO_DEMO } from '../config.js';
import {
  addDays, aMinutos, calcularPrecio, duracion, esUrlSegura, euros, fechaLarga, iso, lunes, pagoPendiente, recordarPago, sumarMin, tarifaPara, textoHorario,
} from '../utils.js';
import Calendario from './Calendario.jsx';
import Contador from './Contador.jsx';
import Proximamente from './Proximamente.jsx';

const LIMITES_POR_DEFECTO = { maxPersonas: 6, duraciones: [60], diasMaximos: 60, franjaMin: 30 };
const DATOS_VACIOS = { nombre: '', email: '', telefono: '', website: '' };
const PASOS = ['Elige el horario', 'Reserva tu espacio', 'Paga online', 'Entra y entrena'];

// Cuántos bloques seguidos hay libres en un día a partir de una hora (hasta el límite).
function bloquesSeguidos(dia, hora, franja, limite) {
  let n = 0;
  while (n < limite && dia.slots.find((s) => s.hora === sumarMin(hora, n * franja))?.estado === 'disponible') n++;
  return n;
}

function Campo({ id, etiqueta, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold mb-1.5">{etiqueta}</label>
      <input id={id} className="campo" required {...props} />
    </div>
  );
}

export default function Reserva({ pagoCancelado }) {
  const hoy = useMemo(() => new Date(), []);
  const [config, setConfig] = useState(null);
  const [semana, setSemana] = useState(0);
  const [dias, setDias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [diaActivo, setDiaActivo] = useState(0);

  const [seleccion, setSeleccion] = useState(null); // { fecha, hora, max } (max en bloques)
  const [bloques, setBloques] = useState(0);
  const [personas, setPersonas] = useState(1);
  const [datos, setDatos] = useState(DATOS_VACIOS);
  const [aviso, setAviso] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const calendarioRef = useRef(null);
  const panelRef = useRef(null);
  const errorRef = useRef(null);
  const peticion = useRef(0);

  const limites = { ...LIMITES_POR_DEFECTO, ...config?.limites };
  const franja = limites.franjaMin;
  // Duraciones reservables (las columnas de la tabla de tarifas), en bloques de calendario.
  const opciones = [...limites.duraciones].sort((a, b) => a - b).map((min) => min / franja);
  const minBloques = opciones[0];
  const maxBloques = opciones[opciones.length - 1];
  // La duración más larga permitida que cabe en 'max' bloques libres.
  const mayorQueCabe = (max) => opciones.filter((n) => n <= max).pop() || 0;
  const minutos = bloques * franja;
  const horas = minutos / 60;
  const inicio = addDays(lunes(hoy), semana * 7);
  const fin = addDays(inicio, 6);
  const desde = iso(inicio);
  const siguienteDesactivado = addDays(inicio, 7) > addDays(hoy, limites.diasMaximos);

  useEffect(() => {
    api.config().then((r) => setConfig(r.config)).catch((e) => setErrorCarga(e.message));
  }, []);

  const cargar = useCallback(async () => {
    const n = ++peticion.current;
    setCargando(true);
    setErrorCarga('');
    try {
      const r = await api.disponibilidad(desde, 7);
      if (n !== peticion.current) return;
      setDias(r.dias);
      // Se abre el primer día con horas libres (hoy, si le quedan); si no hay ninguno, el primero de la semana.
      const libreIdx = r.dias.findIndex((d) => d.slots.some((s) => s.estado === 'disponible'));
      setDiaActivo(Math.max(libreIdx, 0));
    } catch (e) {
      if (n === peticion.current) setErrorCarga(e.message);
    } finally {
      if (n === peticion.current) setCargando(false);
    }
  }, [desde]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Si el cliente vuelve de Stripe sin pagar (flecha "←" de Stripe o botón atrás), la hora se libera al momento
  // en vez de quedar bloqueada hasta que caduque el pago.
  const liberarPagoAbandonado = useCallback(async () => {
    const pago = pagoPendiente();
    if (!pago) return;
    recordarPago(null);
    try {
      await api.abandonar(pago.id, pago.token);
    } catch {
      // Si falla, la hora se libera sola cuando caduca el pago.
    }
    cargar();
  }, [cargar]);

  // Solo al cargar la página (p. ej. al volver de Stripe con la flecha "←").
  useEffect(() => {
    liberarPagoAbandonado();
  }, []);

  // Al volver atrás desde Stripe el navegador puede restaurar la página tal cual (con el botón bloqueado).
  useEffect(() => {
    const alMostrar = (e) => {
      if (!e.persisted) return;
      setEnviando(false);
      liberarPagoAbandonado();
    };
    window.addEventListener('pageshow', alMostrar);
    return () => window.removeEventListener('pageshow', alMostrar);
  }, [liberarPagoAbandonado]);

  // Si al recargar la disponibilidad la hora elegida ya no está libre, se avisa y se ajusta.
  useEffect(() => {
    if (!seleccion) return;
    const dia = dias.find((d) => d.fecha === seleccion.fecha);
    if (!dia) return;
    const max = bloquesSeguidos(dia, seleccion.hora, franja, maxBloques);
    if (max < minBloques) {
      setSeleccion(null);
      setAviso('La hora que habías elegido ya no está disponible. Elige otra en el calendario.');
    } else if (max !== seleccion.max) {
      setSeleccion({ ...seleccion, max });
      if (bloques > max) setBloques(mayorQueCabe(max));
    }
  }, [dias, seleccion, franja, minBloques, maxBloques]);

  function elegir(dia, hora) {
    setAviso('');
    setError('');
    // Pulsar la media hora justo después de la selección la amplía a la siguiente duración (si cabe).
    const siguiente = opciones.find((n) => n > bloques);
    if (seleccion && dia.fecha === seleccion.fecha && hora === sumarMin(seleccion.hora, minutos) && siguiente && siguiente <= seleccion.max) {
      setBloques(siguiente);
      return;
    }
    const max = bloquesSeguidos(dia, hora, franja, maxBloques);
    if (max < minBloques) {
      setSeleccion(null);
      setAviso(`Desde esa hora no quedan ${duracion(minBloques * franja)} libres seguidos. Elige otra.`);
      return;
    }
    setSeleccion({ fecha: dia.fecha, hora, max });
    setBloques(minBloques);
  }

  const enSeleccion = (fecha, hora) => {
    if (!seleccion || fecha !== seleccion.fecha) return false;
    const m = aMinutos(hora);
    const m0 = aMinutos(seleccion.hora);
    return m >= m0 && m < m0 + minutos;
  };

  const set = (k) => (e) => setDatos((d) => ({ ...d, [k]: e.target.value }));
  const precio = calcularPrecio(config, minutos, personas);
  const tarifa = tarifaPara(config, personas);

  function fallo(mensaje) {
    setError(mensaje);
    requestAnimationFrame(() => errorRef.current?.focus());
  }

  async function enviar(e) {
    e.preventDefault();
    setError('');
    if (!seleccion) {
      calendarioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return fallo('Elige primero un día y una hora en el calendario.');
    }
    if (!e.currentTarget.reportValidity()) return;
    const telefono = datos.telefono.trim();
    if ((telefono.match(/\d/g) || []).length < 9) return fallo('Introduce un teléfono válido (al menos 9 dígitos).');

    setEnviando(true);
    try {
      const r = await api.reservar({
        fecha: seleccion.fecha,
        hora: seleccion.hora,
        horas,
        personas,
        nombre: datos.nombre.trim(),
        email: datos.email.trim(),
        telefono,
        website: datos.website,
      });
      // Solo se sale de la web hacia el pago de Stripe, nunca a otra dirección que devuelva el servidor.
      if (!MODO_DEMO && !esUrlSegura(r.url, ['checkout.stripe.com'])) throw new Error('No se pudo iniciar el pago. Inténtalo de nuevo en unos minutos.');
      if (r.token) recordarPago({ id: r.id, token: r.token });
      window.location.assign(r.url);
    } catch (err) {
      setEnviando(false);
      fallo(err.message);
      cargar();
    }
  }

  // El script cierra las reservas mientras Stripe está en modo pruebas.
  if (config?.reservasAbiertas === false) return <Proximamente />;

  return (
    <>
      <section className="rounded-2xl border border-[#2a5f8f] banner px-4 py-5 sm:px-8 sm:py-6 mb-5 text-center" aria-label="Cómo funciona">
        <h1 className="font-bold leading-tight text-[26px] sm:text-[34px] text-[#cdeaff]">
          Elige hora y personas. Paga y entrena.
        </h1>
        <ol className="mt-4 hidden sm:grid grid-cols-4 gap-3 text-left">
          {PASOS.map((paso, i) => (
            <li key={paso} className="paso">
              <span className="eyebrow text-[#5fc4f0] text-xs">0{i + 1}</span>
              <span className="block font-semibold text-sm sm:text-base">{paso}</span>
            </li>
          ))}
        </ol>
      </section>

      {pagoCancelado && (
        <p className="aviso mb-6" role="status">
          Has cancelado el pago y la reserva no se ha completado. Puedes volver a intentarlo cuando quieras. Si quieres la misma hora, puede
          aparecer ocupada durante unos minutos.
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.65fr)_minmax(320px,1fr)] gap-6 items-start">
        <div ref={calendarioRef} className="scroll-mt-4 min-w-0">
          <Calendario
            dias={dias}
            cargando={cargando}
            error={errorCarga}
            inicio={inicio}
            fin={fin}
            onAnterior={() => setSemana((s) => s - 1)}
            onSiguiente={() => setSemana((s) => s + 1)}
            anteriorDesactivado={semana === 0}
            siguienteDesactivado={siguienteDesactivado}
            enSeleccion={enSeleccion}
            onElegir={elegir}
            diaActivo={diaActivo}
            setDiaActivo={setDiaActivo}
            onReintentar={cargar}
          />
          {config?.horario && <p className="mt-3 text-[#8fa4ba] text-sm">Horario: {textoHorario(config.horario)}</p>}
        </div>

        <aside ref={panelRef} className="glass rounded-2xl p-5 sm:p-6 scroll-mt-4" aria-labelledby="titulo-datos">
          <h2 id="titulo-datos" className="font-bold text-2xl sm:text-3xl mb-4">2. Completa tu reserva</h2>

          <div className="rounded-xl bg-[#0a2238] border border-[#24557d] px-4 py-3 mb-4" aria-live="polite">
            {seleccion ? (
              <>
                <p className="text-xs eyebrow text-[#5fc4f0]">TU HORA</p>
                <p className="font-bold text-[#e6f4ff] first-letter:uppercase">{fechaLarga(seleccion.fecha)}</p>
                <p className="text-[#c7e7ff]">
                  {seleccion.hora} – {sumarMin(seleccion.hora, minutos)} · {duracion(minutos)}
                </p>
              </>
            ) : (
              <p className="text-[#c7e7ff] text-sm">Toca una hora disponible en el calendario.</p>
            )}
          </div>
          {aviso && <p className="aviso mb-4 text-sm" role="status">{aviso}</p>}

          {seleccion && opciones.length > 1 && (
            <fieldset className="mb-5">
              <legend className="text-sm font-semibold mb-2">Duración</legend>
              <div className="flex flex-wrap gap-2">
                {opciones.map((n) => {
                  const precioOpcion = calcularPrecio(config, n * franja, personas);
                  return (
                    <button
                      key={n}
                      type="button"
                      className={`opcion ${bloques === n ? 'activa' : ''}`}
                      aria-pressed={bloques === n}
                      disabled={n > seleccion.max}
                      title={n > seleccion.max ? 'Las horas siguientes no están libres' : undefined}
                      onClick={() => setBloques(n)}
                    >
                      {duracion(n * franja)}
                      {precioOpcion != null && <span className="block text-xs opacity-80">{euros(precioOpcion)}</span>}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          <form className="space-y-4" onSubmit={enviar}>
            <div className="rounded-xl border border-[#24364a] p-4 space-y-3">
              <Contador id="c-personas" etiqueta="Personas (contándote a ti)" valor={personas} min={1} max={limites.maxPersonas} onChange={setPersonas} />
            </div>

            <Campo id="nombre" etiqueta="Nombre y apellidos" autoComplete="name" maxLength={100} value={datos.nombre} onChange={set('nombre')} />
            <Campo id="email" etiqueta="Correo electrónico" type="email" autoComplete="email" maxLength={160} value={datos.email} onChange={set('email')} />
            <Campo id="telefono" etiqueta="Teléfono" type="tel" autoComplete="tel" maxLength={30} value={datos.telefono} onChange={set('telefono')} />

            {/* Campo trampa anti-spam: las personas no lo ven; si llega relleno, el servidor lo descarta. */}
            <div className="trampa" aria-hidden="true">
              <label htmlFor="website">Web</label>
              <input id="website" name="website" tabIndex={-1} autoComplete="off" value={datos.website} onChange={set('website')} />
            </div>

            <div className="rounded-xl border border-[#2a5f8f] banner p-4">
              <p className="font-bold text-[#cdeaff]">{tarifa ? tarifa.nombre : '—'}</p>
              <p className="text-[#adc8dd] text-sm mt-1">{seleccion ? duracion(minutos) : 'Elige una hora para ver el precio'}</p>
              <p className="font-bold text-lg mt-3 flex justify-between gap-3">
                <span>Total</span>
                <span>{precio == null ? '—' : euros(precio)}</span>
              </p>
            </div>

            {error && (
              <p ref={errorRef} className="aviso-error text-sm" role="alert" tabIndex={-1}>{error}</p>
            )}

            <button type="submit" className="boton w-full py-3.5 text-base flex items-center justify-center gap-2" disabled={enviando} aria-busy={enviando}>
              {enviando && <span className="spinner pequeno" aria-hidden="true" />}
              {enviando ? 'Preparando el pago…' : 'Reservar y pagar'}
            </button>
            <p className="text-xs text-[#8fa4ba] leading-relaxed">
              Te llevaremos a Stripe para pagar de forma segura con tarjeta, Apple Pay o Google Pay. La hora queda guardada unos minutos mientras
              pagas. Al confirmarse el pago recibirás por email tu código para abrir la puerta.
            </p>
          </form>
        </aside>
      </div>

      {/* Móvil y tableta: con una hora elegida, barra fija abajo con el resumen y acceso directo al formulario. */}
      {seleccion && (
        <>
          <div className="h-20 lg:hidden" aria-hidden="true" />
          <div className="barra-movil lg:hidden">
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate first-letter:uppercase">
                {fechaLarga(seleccion.fecha)} · {seleccion.hora}
              </p>
              <p className="text-[#adc8dd] text-sm">
                {duracion(minutos)} · {precio == null ? '—' : euros(precio)}
              </p>
            </div>
            <button type="button" className="boton px-5 py-3 shrink-0" onClick={() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
              Continuar
            </button>
          </div>
        </>
      )}
    </>
  );
}
