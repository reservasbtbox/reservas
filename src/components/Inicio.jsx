import { useEffect, useState } from 'react';
import { api } from '../api.js';
import fotoFamilia from '../assets/familia.jpg';
import fotoHorario from '../assets/horario.jpg';
import fotoPareja from '../assets/pareja.jpg';
import fotoSolo from '../assets/solo.jpg';
import { PROXIMAMENTE } from '../config.js';
import { duracion, euros } from '../utils.js';
import { Amanecer, Candado, Corazon, Familia, Libro, Luna, Pareja, Persona, Pesa, Reloj, Tableta } from './Iconos.jsx';

const SECCIONES = [
  {
    Icono: Reloj,
    titulo: ['Entrena', 'a tu horario'],
    texto: (
      <>
        Tienes pocas horas, te levantas muy temprano o entrenas por la noche. Reserva el centro desde <strong>las 6:00</strong> de la mañana hasta
        las <strong>00:00 de la noche</strong>.
      </>
    ),
    datos: [
      { Icono: Amanecer, grande: '06:00', sub: 'Apertura' },
      { Icono: Luna, grande: '00:00', sub: 'Cierre' },
    ],
    foto: fotoHorario,
  },
  {
    Icono: Persona,
    titulo: ['Reserva el centro', 'para ti'],
    texto: 'Entrena solo, el tiempo que quieras, sin molestias y a tu ritmo.',
    datos: [
      { Icono: Pesa, linea: 'Todo el', sub: 'material' },
      { Icono: Candado, linea: 'Reserva', sub: 'online' },
      { Icono: Reloj, linea: '06:00 – 00:00', sub: 'Apertura y cierre' },
    ],
    foto: fotoSolo,
  },
  {
    Icono: Pareja,
    titulo: ['Entrena', 'en pareja'],
    texto: '¿Te sientes mejor en compañía? Reserva el centro con tu pareja y disfrutad del entrenamiento juntos.',
    datos: [
      { Icono: Corazon, linea: 'Entrenamiento', sub: 'a tu ritmo' },
      { Icono: Pesa, linea: 'Todo', sub: 'el material' },
      { Icono: Pareja, linea: 'Reserva online', sub: 'fácil y rápida' },
    ],
    foto: fotoPareja,
  },
  {
    Icono: Familia,
    titulo: ['Vienes con', 'familia'],
    texto: 'Entrena mientras tus hijos están con la tablet, leyendo, haciendo tareas o lo que quieran.',
    datos: [
      { Icono: Tableta, linea: 'Espacio seguro', sub: 'para tus hijos' },
      { Icono: Libro, linea: 'Entrena', sub: 'con tranquilidad' },
      { Icono: Pesa, linea: 'Todo el', sub: 'material' },
    ],
    foto: fotoFamilia,
  },
];

const PASOS = ['Elige día y hora', 'Indica cuántos venís', 'Paga online', 'Recibe tu PIN y entra'];

function Seccion({ Icono, titulo, texto, datos, foto, primera }) {
  const Titulo = primera ? 'h1' : 'h2';
  return (
    <article className="tarjeta">
      <img src={foto} alt="" className="tarjeta-foto" loading={primera ? 'eager' : 'lazy'} />
      <div className="relative px-6 pb-8 -mt-10 sm:px-10 md:mt-0 md:py-14 md:w-[56%]">
        <Icono className="w-12 h-12 sm:w-16 sm:h-16 text-[#1fa3ff]" />
        <Titulo className="titular mt-4">
          <span className="block text-white">{titulo[0]}</span>
          <span className="block text-[#14b4ff]">{titulo[1]}</span>
        </Titulo>
        <div className="raya mt-5" />
        <p className="text-[#d9e6f2] text-lg sm:text-xl leading-snug mt-5 max-w-md">{texto}</p>
        <ul className="mt-7 flex flex-wrap gap-y-4">
          {datos.map(({ Icono: I, grande, linea, sub }) => (
            <li key={sub + (grande || linea)} className="dato">
              <I className={`${grande ? 'w-10 h-10' : 'w-9 h-9 mx-auto'} text-[#1fa3ff] shrink-0`} />
              {grande ? (
                <div>
                  <p className="font-display text-[#14b4ff] text-3xl leading-none">{grande}</p>
                  <p className="text-xs tracking-[.14em] uppercase mt-1">{sub}</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="font-bold text-[13px] uppercase leading-tight mt-2">{linea}</p>
                  <p className="text-[11px] tracking-[.1em] uppercase text-[#c7d6e5]">{sub}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
        {primera && (
          <a href="#/reservar" className="boton inline-block mt-8 px-7 py-3.5 text-base">
            Reservar ahora
          </a>
        )}
      </div>
    </article>
  );
}

// Tabla de tarifas, leída del Apps Script para que siempre coincida con lo que se cobra.
function Tarifas() {
  const [config, setConfig] = useState(null);
  useEffect(() => {
    if (PROXIMAMENTE) return;
    api.config().then((r) => setConfig(r.config)).catch(() => {});
  }, []);
  const tarifas = config?.tarifas;
  const duraciones = config?.limites?.duraciones;
  if (!tarifas?.length || !duraciones?.length) return null;

  return (
    <section className="glass rounded-3xl p-6 sm:p-10" aria-labelledby="titulo-tarifas">
      <h2 id="titulo-tarifas" className="titular text-[34px] sm:text-[44px]">
        <span className="text-white">Tari</span>
        <span className="text-[#14b4ff]">fas</span>
      </h2>
      <p className="text-[#9bb1c7] mt-2">Precio total por reserva, para todo el grupo.</p>
      <div className="overflow-x-auto mt-6 -mx-2 px-2">
        <table className="w-full min-w-[420px] text-left border-collapse">
          <thead>
            <tr className="text-[#5fc4f0] text-sm uppercase tracking-wider">
              <th className="py-3 pr-4 font-semibold">Personas</th>
              {duraciones.map((m) => (
                <th key={m} className="py-3 px-2 font-semibold text-right">{duracion(m)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tarifas.map((t) => (
              <tr key={t.hasta} className="border-t border-[#24364a]">
                <td className="py-3.5 pr-4">{t.nombre}</td>
                {duraciones.map((m) => (
                  <td key={m} className="py-3.5 px-2 text-right font-bold">{euros(t.precios[m])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function Inicio() {
  return (
    <div className="space-y-6 sm:space-y-8">
      {SECCIONES.map((s, i) => (
        <Seccion key={s.titulo.join(' ')} {...s} primera={i === 0} />
      ))}

      <section className="rounded-3xl border border-[#2a5f8f] banner p-6 sm:p-10" aria-labelledby="titulo-pasos">
        <h2 id="titulo-pasos" className="titular text-[30px] sm:text-[40px]">
          <span className="text-white">Así de </span>
          <span className="text-[#14b4ff]">fácil</span>
        </h2>
        <ol className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {PASOS.map((paso, i) => (
            <li key={paso} className="paso">
              <span className="eyebrow text-[#5fc4f0] text-xs">0{i + 1}</span>
              <span className="block font-semibold">{paso}</span>
            </li>
          ))}
        </ol>
      </section>

      <Tarifas />

      <section className="text-center py-8">
        <h2 className="titular text-[34px] sm:text-[48px]">
          <span className="text-white">¿Entrenamos? </span>
          <span className="text-[#14b4ff]">Reserva ya</span>
        </h2>
        <p className="text-[#c7d6e5] mt-3">Elige tu hora, paga online y recibe tu código para entrar.</p>
        <a href="#/reservar" className="boton inline-block mt-6 px-8 py-4 text-lg">
          Reservar ahora
        </a>
      </section>
    </div>
  );
}
