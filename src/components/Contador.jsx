export default function Contador({ id, etiqueta, valor, min, max, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span id={id} className="text-sm font-semibold">{etiqueta}</span>
      <div className="flex items-center gap-2" role="group" aria-labelledby={id}>
        <button type="button" className="contador" aria-label={`Quitar: ${etiqueta}`} disabled={valor <= min} onClick={() => onChange(valor - 1)}>
          −
        </button>
        <output className="w-8 text-center font-bold text-lg" aria-live="polite">{valor}</output>
        <button type="button" className="contador" aria-label={`Añadir: ${etiqueta}`} disabled={valor >= max} onClick={() => onChange(valor + 1)}>
          +
        </button>
      </div>
    </div>
  );
}
