export const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export const pad = (n) => String(n).padStart(2, '0');
export const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromISO = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (d, n) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};
export const lunes = (d) => {
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return addDays(day, -((day.getDay() + 6) % 7));
};
export const horaMas = (hora, n) => `${pad(Number(hora.slice(0, 2)) + n)}:00`;

const largo = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
const corto = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' });
export const fechaLarga = (s) => largo.format(fromISO(s));
export const fechaCorta = (d) => corto.format(d);

const eur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
export const euros = (n) => (typeof n === 'number' ? eur.format(n) : String(n ?? ''));

// El servidor recalcula el precio igualmente; esto es solo para mostrarlo al momento.
export function calcularPrecio(config, horas, profesionales, clientes) {
  const p = config?.precios;
  if (!p) return null;
  return horas * (p.profesionalHora * profesionales + p.clienteHora * clientes);
}

export const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
