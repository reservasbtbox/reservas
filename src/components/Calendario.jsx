import { DIAS, fechaCorta, fechaLarga, fromISO } from '../utils.js';

const TEXTO_ESTADO = { disponible: 'disponible', ocupada: 'ocupada', cerrada: 'cerrada', pasada: 'pasada' };

export default function Calendario({ dias, cargando, error, inicio, fin, onAnterior, onSiguiente, anteriorDesactivado, siguienteDesactivado, enSeleccion, onElegir, diaMovil, setDiaMovil, onReintentar }) {
  // Todas las horas que aparecen en la semana, para alinear las filas entre días.
  const horas = [...new Set(dias.flatMap((d) => d.slots.map((s) => s.hora)))].sort();

  return (
    <section className="glass rounded-2xl p-4 sm:p-6 min-w-0" aria-labelledby="titulo-calendario">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h2 id="titulo-calendario" className="font-bold text-xl sm:text-2xl">1. Elige día y hora</h2>
          <p className="text-[#9bb1c7] text-sm mt-1" aria-live="polite">
            Semana del {fechaCorta(inicio)} al {fechaCorta(fin)}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="flecha" aria-label="Semana anterior" disabled={anteriorDesactivado || cargando} onClick={onAnterior}>←</button>
          <button type="button" className="flecha" aria-label="Semana siguiente" disabled={siguienteDesactivado || cargando} onClick={onSiguiente}>→</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2 mb-5 text-xs text-[#aebed0]">
        <span><span className="punto bg-[#1e90ff]" />Disponible</span>
        <span><span className="punto bg-[#00e0c6]" />Tu selección</span>
        <span><span className="punto bg-[#895361]" />Ocupada</span>
        <span><span className="punto bg-[#4a5666]" />Cerrada o pasada</span>
      </div>

      {error ? (
        <div className="aviso-error">
          <p>{error}</p>
          <button type="button" className="underline font-semibold mt-2" onClick={onReintentar}>Reintentar</button>
        </div>
      ) : (
        <div className={`relative ${cargando ? 'opacity-50 pointer-events-none' : ''}`} aria-busy={cargando}>
          {/* Móvil: selector de día; el calendario muestra solo ese día. */}
          <div className="md:hidden flex gap-2 overflow-x-auto pb-3 mb-3 -mx-1 px-1" role="tablist" aria-label="Días de la semana">
            {dias.map((d, i) => {
              const libres = d.slots.filter((s) => s.estado === 'disponible').length;
              return (
                <button
                  key={d.fecha}
                  type="button"
                  role="tab"
                  aria-selected={i === diaMovil}
                  className={`chip-dia ${i === diaMovil ? 'activo' : ''}`}
                  onClick={() => setDiaMovil(i)}
                >
                  <strong className="block">{DIAS[i]}</strong>
                  <span className="block text-xs">{fromISO(d.fecha).getDate()}</span>
                  <span className="block text-[10px] opacity-80">{libres ? `${libres} libres` : 'completo'}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
            {dias.map((d, i) => (
              <div key={d.fecha} className={`${i === diaMovil ? 'grid' : 'hidden'} md:flex md:flex-col grid-cols-3 gap-2 min-w-0`}>
                <div className="hidden md:block text-center py-2 border-b border-[#2a3b4f] mb-1">
                  <strong className="block text-[#e9f3ff]">{DIAS[i]}</strong>
                  <span className="text-[#91a9c0] text-sm">{fechaCorta(fromISO(d.fecha))}</span>
                </div>
                {horas.map((hora) => {
                  const estado = d.slots.find((s) => s.hora === hora)?.estado || 'cerrada';
                  const elegido = enSeleccion(d.fecha, hora);
                  const libre = estado === 'disponible';
                  return (
                    <button
                      key={hora}
                      type="button"
                      className={`slot ${estado} ${elegido ? 'elegido' : ''}`}
                      disabled={!libre}
                      aria-pressed={elegido}
                      aria-label={`${fechaLarga(d.fecha)}, ${hora}: ${elegido ? 'seleccionada' : TEXTO_ESTADO[estado] || estado}`}
                      onClick={() => onElegir(d, hora)}
                    >
                      {hora}
                    </button>
                  );
                })}
                {!horas.length && <p className="text-sm text-[#9bb1c7] col-span-3">Sin horas</p>}
              </div>
            ))}
          </div>
          {cargando && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="spinner" aria-label="Cargando disponibilidad" />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
