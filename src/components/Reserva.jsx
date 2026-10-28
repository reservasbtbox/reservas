import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api.js';
import { addDays, calcularPrecio, euros, fechaLarga, fromISO, horaMas, iso, lunes, pad, plural } from '../utils.js';
import Calendario from './Calendario.jsx';
import Contador from './Contador.jsx';

const LIMITES_POR_DEFECTO = { maxProfesionales: 1, maxClientes: 10, maxHoras: 1, diasMaximos: 60 };
const DATOS_VACIOS = { nombre: '', profesion: '', email: '', telefono: '', website: '' };
const PASOS = ['Elige el horario', 'Reserva tu espacio', 'Paga online', 'Entra y entrena'];

// Cuántas horas seguidas hay libres en un día a partir de una hora (hasta el límite).
function horasSeguidas(dia, hora, limite) {
  const inicio = Number(hora.slice(0, 2));
  let n = 0;
  while (n < limite && dia.slots.find((s) => s.hora === `${pad(inicio + n)}:00`)?.estado === 'disponible') n++;
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
  const [diaMovil, setDiaMovil] = useState(0);

  const [seleccion, setSeleccion] = useState(null); // { fecha, hora, max }
  const [horas, setHoras] = useState(1);
  const [profesionales, setProfesionales] = useState(1);
  const [clientes, setClientes] = useState(0);
  const [datos, setDatos] = useState(DATOS_VACIOS);
  const [aviso, setAviso] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const calendarioRef = useRef(null);
  const errorRef = useRef(null);
  const peticion = useRef(0);

  const limites = { ...LIMITES_POR_DEFECTO, ...config?.limites };
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
      // En móvil se abre el día de hoy si está en la semana; si no, el primero con horas libres.
      const hoyIdx = r.dias.findIndex((d) => d.fecha === iso(new Date()));
      const libreIdx = r.dias.findIndex((d) => d.slots.some((s) => s.estado === 'disponible'));
      setDiaMovil(hoyIdx >= 0 ? hoyIdx : Math.max(libreIdx, 0));
    } catch (e) {
      if (n === peticion.current) setErrorCarga(e.message);
    } finally {
      if (n === peticion.current) setCargando(false);
    }
  }, [desde]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Al volver atrás desde Stripe el navegador puede restaurar la página con el botón bloqueado.
  useEffect(() => {
    const alMostrar = (e) => e.persisted && setEnviando(false);
    window.addEventListener('pageshow', alMostrar);
    return () => window.removeEventListener('pageshow', alMostrar);
  }, []);

  // Si al recargar la disponibilidad la hora elegida ya no está libre, se avisa y se ajusta.
  useEffect(() => {
    if (!seleccion) return;
    const dia = dias.find((d) => d.fecha === seleccion.fecha);
    if (!dia) return;
    const max = horasSeguidas(dia, seleccion.hora, limites.maxHoras);
    if (max === 0) {
      setSeleccion(null);
      setAviso('La hora que habías elegido ya no está disponible. Elige otra en el calendario.');
    } else if (max !== seleccion.max) {
      setSeleccion({ ...seleccion, max });
      setHoras((h) => Math.min(h, max));
    }
  }, [dias, seleccion, limites.maxHoras]);

  function elegir(dia, hora) {
    setAviso('');
    setError('');
    // Pulsar la hora justo después de la selección la amplía (si se puede).
    if (seleccion && dia.fecha === seleccion.fecha && hora === horaMas(seleccion.hora, horas) && horas < seleccion.max) {
      setHoras(horas + 1);
      return;
    }
    setSeleccion({ fecha: dia.fecha, hora, max: horasSeguidas(dia, hora, limites.maxHoras) });
    setHoras(1);
  }

  const enSeleccion = (fecha, hora) => {
    if (!seleccion || fecha !== seleccion.fecha) return false;
    const h = Number(hora.slice(0, 2));
    const h0 = Number(seleccion.hora.slice(0, 2));
    return h >= h0 && h < h0 + horas;
  };

  const set = (k) => (e) => setDatos((d) => ({ ...d, [k]: e.target.value }));
  const precio = calcularPrecio(config, horas, profesionales, clientes);
  const p = config?.precios;

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
        profesionales,
        clientes,
        nombre: datos.nombre.trim(),
        profesion: datos.profesion.trim(),
        email: datos.email.trim(),
        telefono,
        website: datos.website,
      });
      window.location.assign(r.url);
    } catch (err) {
      setEnviando(false);
      fallo(err.message);
      cargar();
    }
  }

  return (
    <>
      <section className="rounded-2xl border border-[#2a5f8f] banner px-6 py-7 sm:px-10 sm:py-9 mb-6 text-center" aria-label="Cómo funciona">
        <h1 className="font-bold leading-tight text-[26px] sm:text-[32px] text-[#cdeaff]">
          Selecciona hora, selecciona miembros.
          <br />
          Paga y entrena.
        </h1>
        <ol className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-left">
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

      <div className="grid lg:grid-cols-[minmax(0,1.65fr)_minmax(320px,1fr)] gap-6 items-start">
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
            diaMovil={diaMovil}
            setDiaMovil={setDiaMovil}
            onReintentar={cargar}
          />
          {config?.horario && <p className="mt-3 text-[#8fa4ba] text-sm">Horario: {config.horario}</p>}
        </div>

        <aside className="glass rounded-2xl p-5 sm:p-7 lg:sticky lg:top-4" aria-labelledby="titulo-datos">
          <h2 id="titulo-datos" className="font-bold text-xl sm:text-2xl mb-4">2. Completa tu reserva</h2>

          <div className="rounded-xl bg-[#0a2238] border border-[#24557d] px-4 py-3 mb-4" aria-live="polite">
            {seleccion ? (
              <>
                <p className="text-xs eyebrow text-[#5fc4f0]">TU HORA</p>
                <p className="font-bold text-[#e6f4ff] first-letter:uppercase">{fechaLarga(seleccion.fecha)}</p>
                <p className="text-[#c7e7ff]">
                  {seleccion.hora} – {horaMas(seleccion.hora, horas)} · {plural(horas, 'hora', 'horas')}
                </p>
              </>
            ) : (
              <p className="text-[#c7e7ff] text-sm">Toca una hora disponible en el calendario.</p>
            )}
          </div>
          {aviso && <p className="aviso mb-4 text-sm" role="status">{aviso}</p>}

          {seleccion && limites.maxHoras > 1 && (
            <fieldset className="mb-5">
              <legend className="text-sm font-semibold mb-2">Duración</legend>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: limites.maxHoras }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`opcion ${horas === n ? 'activa' : ''}`}
                    aria-pressed={horas === n}
                    disabled={n > seleccion.max}
                    title={n > seleccion.max ? 'Las horas siguientes no están libres' : undefined}
                    onClick={() => setHoras(n)}
                  >
                    {n} h
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <form className="space-y-4" onSubmit={enviar}>
            <div className="rounded-xl border border-[#24364a] p-4 space-y-3">
              {limites.maxProfesionales > 1 && (
                <Contador id="c-prof" etiqueta="Profesionales" valor={profesionales} min={1} max={limites.maxProfesionales} onChange={setProfesionales} />
              )}
              <Contador id="c-cli" etiqueta="Clientes que vienen contigo" valor={clientes} min={0} max={limites.maxClientes} onChange={setClientes} />
            </div>

            <Campo id="nombre" etiqueta="Nombre y apellidos" autoComplete="name" maxLength={100} value={datos.nombre} onChange={set('nombre')} />
            <Campo id="profesion" etiqueta="Profesión" placeholder="Ej.: entrenador personal" maxLength={100} value={datos.profesion} onChange={set('profesion')} />
            <Campo id="email" etiqueta="Correo electrónico" type="email" autoComplete="email" maxLength={160} value={datos.email} onChange={set('email')} />
            <Campo id="telefono" etiqueta="Teléfono" type="tel" autoComplete="tel" maxLength={30} value={datos.telefono} onChange={set('telefono')} />

            {/* Campo trampa anti-spam: las personas no lo ven; si llega relleno, el servidor lo descarta. */}
            <div className="trampa" aria-hidden="true">
              <label htmlFor="website">Web</label>
              <input id="website" name="website" tabIndex={-1} autoComplete="off" value={datos.website} onChange={set('website')} />
            </div>

            <div className="rounded-xl border border-[#2a5f8f] banner p-4">
              <p className="font-bold text-[#cdeaff]">
                {plural(profesionales, 'profesional', 'profesionales')} + {plural(clientes, 'cliente', 'clientes')}
              </p>
              {p && (
                <ul className="text-[#adc8dd] text-sm mt-2 space-y-0.5">
                  <li>{plural(profesionales, 'profesional', 'profesionales')} × {euros(p.profesionalHora)}/h</li>
                  {clientes > 0 && <li>{plural(clientes, 'cliente', 'clientes')} × {euros(p.clienteHora)}/h</li>}
                  <li>× {plural(horas, 'hora', 'horas')}</li>
                </ul>
              )}
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
    </>
  );
}
