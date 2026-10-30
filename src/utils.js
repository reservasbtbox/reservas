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
export const aMinutos = (hora) => Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3, 5));
// Suma minutos a una hora 'HH:MM'; medianoche se muestra como 00:00.
export const sumarMin = (hora, min) => {
  const m = (aMinutos(hora) + min) % (24 * 60);
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
};
export const duracion = (min) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
};

const largo = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
const corto = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' });
export const fechaLarga = (s) => largo.format(fromISO(s));
export const fechaCorta = (d) => corto.format(d);

const eur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
export const euros = (n) => (typeof n === 'number' ? eur.format(n) : String(n ?? ''));

// Tarifa de la tabla: la primera fila que admite esas personas.
// El servidor recalcula el precio igualmente; esto es solo para mostrarlo al momento.
export const tarifaPara = (config, personas) => config?.tarifas?.find((t) => personas <= t.hasta) || null;

export function calcularPrecio(config, minutos, personas) {
  const precio = tarifaPara(config, personas)?.precios?.[minutos];
  return typeof precio === 'number' ? precio : null;
}

// El Apps Script devuelve el horario como { 1: [['06:00', '08:00'], ['14:00', '17:00']], … } (1 = lunes).
export function textoHorario(horario) {
  if (!horario || typeof horario !== 'object') return '';
  const grupos = [];
  DIAS.forEach((nombre, i) => {
    const franjas = horario[i + 1] || [];
    const texto = franjas.length ? franjas.map(([a, b]) => `${a}–${b === '24:00' ? '00:00' : b}`).join(', ') : 'cerrado';
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.texto === texto) ultimo.dias.push(nombre);
    else grupos.push({ texto, dias: [nombre] });
  });
  return grupos
    .map(({ dias, texto }) => `${dias.length > 1 ? `${dias[0]}–${dias[dias.length - 1]}` : dias[0]} ${texto}`)
    .join(' · ');
}

// Enlaces que llegan del servidor: solo https y, si se indica, solo esos dominios (evita javascript: y redirecciones a terceros).
export function esUrlSegura(url, dominios) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && (!dominios || dominios.includes(u.hostname));
  } catch {
    return false;
  }
}

export const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

// Reserva a medio pagar en esta pestaña: si el cliente vuelve de Stripe sin pagar, la web la libera al momento.
const CLAVE_PAGO = 'btbox-pago';
export function recordarPago(pago) {
  try {
    if (pago) sessionStorage.setItem(CLAVE_PAGO, JSON.stringify(pago));
    else sessionStorage.removeItem(CLAVE_PAGO);
  } catch {
    // Sin almacenamiento: la hora se libera sola cuando caduca el pago.
  }
}
export function pagoPendiente() {
  try {
    return JSON.parse(sessionStorage.getItem(CLAVE_PAGO)) || null;
  } catch {
    return null;
  }
}
