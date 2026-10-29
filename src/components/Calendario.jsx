import { DIAS, fechaCorta, fechaLarga, fromISO } from '../utils.js';

const TEXTO_ESTADO = { disponible: 'disponible', ocupada: 'ocupada', cerrada: 'cerrada', pasada: 'pasada' };

// Se ve un día cada vez (en móvil y en escritorio): arriba los 7 días de la semana y debajo solo las horas
// en las que el centro abre ese día. Así el calendario cabe en pantalla junto al formulario.
export default function Calendario({ dias, cargando, error, inicio, fin, onAnterior, onSiguiente, anteriorDesactivado, siguienteDesactivado, enSeleccion, onElegir, diaActivo, setDiaActivo, onReintentar }) {
  const dia = dias[diaActivo];
  const slots = dia ? dia.slots.filter((s) => s.estado !== 'cerrada') : [];

  return (
    <section className="glass rounded-2xl p-4 sm:p-6 min-w-0" aria-labelledby="titulo-calendario">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h2 id="titulo-calendario" className="font-bold text-2xl sm:text-3xl">1. Elige día y hora</h2>
          <p className="text-[#9bb1c7] text-sm mt-0.5" aria-live="polite">
            Semana del {fechaCorta(inicio)} al {fechaCorta(fin)}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="flecha" aria-label="Semana anterior" disabled={anteriorDesactivado || cargando} onClick={onAnterior}>←</button>
          <button type="button" className="flecha" aria-label="Semana siguiente" disabled={siguienteDesactivado || cargando} onClick={onSiguiente}>→</button>
        </div>
      </div>

      {error ? (
        <div className="aviso-error">
          <p>{error}</p>
          <button type="button" className="underline font-semibold mt-2" onClick={onReintentar}>Reintentar</button>
        </div>
      ) : (
        <div className={`relative ${cargando ? 'opacity-50 pointer-events-none' : ''}`} aria-busy={cargando}>
          <div className="grid grid-cols-7 gap-1 sm:gap-2" role="tablist" aria-label="Días de la semana">
            {dias.map((d, i) => {
              const libres = d.slots.filter((s) => s.estado === 'disponible').length;
              return (
                <button
                  key={d.fecha}
                  type="button"
                  role="tab"
                  aria-selected={i === diaActivo}
                  className={`chip-dia ${i === diaActivo ? 'activo' : ''} ${libres ? '' : 'completo'}`}
                  onClick={() => setDiaActivo(i)}
                >
                  <strong className="block">{DIAS[i]}</strong>
                  <span className="block text-sm">{fromISO(d.fecha).getDate()}</span>
                  <span className="block text-[11px] opacity-80">
                    {libres ? (
                      <>
                        {libres}
                        <span className="hidden sm:inline"> libres</span>
                      </>
                    ) : (
                      <>
                        <span className="sm:hidden">—</span>
                        <span className="hidden sm:inline">completo</span>
                      </>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {dia && (
            <div role="tabpanel" className="mt-4">
              <p className="text-sm text-[#c7e7ff] mb-2 first-letter:uppercase">{fechaLarga(dia.fecha)}</p>
              {slots.length ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {slots.map(({ hora, estado }) => {
                    const elegido = enSeleccion(dia.fecha, hora);
                    return (
                      <button
                        key={hora}
                        type="button"
                        className={`slot ${estado} ${elegido ? 'elegido' : ''}`}
                        disabled={estado !== 'disponible'}
                        aria-pressed={elegido}
                        aria-label={`${fechaLarga(dia.fecha)}, ${hora}: ${elegido ? 'seleccionada' : TEXTO_ESTADO[estado] || estado}`}
                        onClick={() => onElegir(dia, hora)}
                      >
                        {hora}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="aviso text-sm">Este día el centro está cerrado. Elige otro día.</p>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 text-xs text-[#aebed0]">
            <span><span className="punto bg-[#1e90ff]" />Disponible</span>
            <span><span className="punto bg-[#00e0c6]" />Tu selección</span>
            <span><span className="punto bg-[#895361]" />Ocupada</span>
            <span><span className="punto bg-[#4a5666]" />Pasada</span>
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
