import { useEffect, useState } from 'react';
import { api } from '../api.js';

// Normas de uso del centro. El texto vive en el Apps Script (NORMAS): es el mismo que se acepta al reservar
// y el que se envía en el email de confirmación.
export default function Normas() {
  const [normas, setNormas] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.normas().then((r) => setNormas(r.normas)).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="aviso-error max-w-3xl mx-auto">{error}</p>;
  if (!normas) {
    return (
      <div className="text-center py-16">
        <span className="spinner" aria-label="Cargando las normas" />
      </div>
    );
  }

  return (
    <article className="glass rounded-3xl max-w-3xl mx-auto p-6 sm:p-10">
      <p className="eyebrow text-[#5fc4f0] text-xs">BTBOX 24/7</p>
      <h1 className="titular text-[30px] sm:text-[42px] mt-2">
        <span className="text-white">Normas de uso </span>
        <span className="text-[#14b4ff]">y alquiler</span>
      </h1>
      <div className="raya mt-5" />
      <div className="text-[#d9e6f2] leading-relaxed mt-6 space-y-3">
        {normas.intro.map((t) => <p key={t}>{t}</p>)}
      </div>

      {normas.secciones.map((s) => (
        <section key={s.titulo} className="mt-8">
          <h2 className="font-bold text-lg sm:text-xl text-white uppercase tracking-wide">{s.titulo}</h2>
          {s.puntos && (
            <ul className="list-disc pl-5 mt-3 space-y-1.5 text-[#c7d6e5] marker:text-[#14b4ff]">
              {s.puntos.map((t) => <li key={t}>{t}</li>)}
            </ul>
          )}
          {s.parrafos?.map((t) => <p key={t} className="text-[#c7d6e5] mt-3">{t}</p>)}
          {s.destacado && <p className="aviso mt-4 font-semibold">{s.destacado}</p>}
        </section>
      ))}

      <section className="mt-10 rounded-2xl border border-[#2a5f8f] banner p-6 text-center">
        <h2 className="font-bold text-xl text-white uppercase">{normas.cierre.titulo}</h2>
        {normas.cierre.parrafos.map((t) => <p key={t} className="text-[#c7d6e5] mt-2">{t}</p>)}
        <p className="eyebrow text-[#5fc4f0] text-xs mt-4">{normas.cierre.firma}</p>
      </section>
      <p className="text-[#7d93a9] text-xs mt-6">Versión {normas.version}</p>
    </article>
  );
}
