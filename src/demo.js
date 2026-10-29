// Datos inventados para ver la página funcionando antes de conectar el Apps Script.
// No se usa en cuanto API_URL tiene la URL real.
import { addDays, aMinutos, calcularPrecio, fromISO, iso, sumarMin } from './utils.js';

const ENTRE_SEMANA = [['06:00', '08:00'], ['14:00', '17:00'], ['22:00', '24:00']];
const SABADO = [['06:00', '08:00'], ['11:00', '24:00']];
const DOMINGO = [['06:00', '08:00'], ['11:00', '13:00'], ['14:00', '24:00']];
const CONFIG = {
  centro: 'BTBOX Training Center',
  zonaHoraria: 'Europe/Madrid',
  horario: { 1: ENTRE_SEMANA, 2: ENTRE_SEMANA, 3: ENTRE_SEMANA, 4: ENTRE_SEMANA, 5: ENTRE_SEMANA, 6: SABADO, 7: DOMINGO },
  tarifas: [
    { hasta: 1, nombre: '1 persona', precios: { 60: 10, 90: 15, 120: 18 } },
    { hasta: 2, nombre: 'Pareja (2 personas)', precios: { 60: 14, 90: 20, 120: 26 } },
    { hasta: 4, nombre: 'Hasta 4 personas', precios: { 60: 18, 90: 26, 120: 34 } },
    { hasta: 6, nombre: 'Hasta 6 personas', precios: { 60: 24, 90: 34, 120: 44 } },
  ],
  limites: { maxPersonas: 6, duraciones: [60, 90, 120], diasMaximos: 60, franjaMin: 30 },
};
const CLAVE = 'btbox-demo-reserva';
const FRANJA = CONFIG.limites.franjaMin;

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// Inicios de media hora abiertos algún día de la semana (como hace el Apps Script).
const INICIOS = [...new Set(Object.values(CONFIG.horario).flatMap((franjas) => franjas.flatMap(([a, b]) =>
  Array.from({ length: (aMinutos(b) - aMinutos(a)) / FRANJA }, (_, k) => aMinutos(a) + k * FRANJA))))].sort((x, y) => x - y);

function estadoSlot(fecha, m) {
  const d = fromISO(fecha);
  const franjas = CONFIG.horario[((d.getDay() + 6) % 7) + 1] || [];
  if (!franjas.some(([a, b]) => m >= aMinutos(a) && m + FRANJA <= aMinutos(b))) return 'cerrada';
  if (new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, m) <= new Date()) return 'pasada';
  return (d.getDate() * 7 + m / FRANJA * 3) % 11 === 0 ? 'ocupada' : 'disponible';
}

export async function get(params) {
  await espera(350);
  if (params.action === 'config') return { ok: true, config: CONFIG };

  if (params.action === 'disponibilidad') {
    const inicio = fromISO(params.desde);
    const dias = Array.from({ length: Number(params.dias) || 7 }, (_, i) => {
      const fecha = iso(addDays(inicio, i));
      return {
        fecha,
        diaSemana: ((fromISO(fecha).getDay() + 6) % 7) + 1,
        slots: INICIOS.map((m) => ({ hora: sumarMin('00:00', m), estado: estadoSlot(fecha, m) })),
      };
    });
    return { ok: true, dias };
  }

  if (params.action === 'estado') {
    const r = JSON.parse(sessionStorage.getItem(CLAVE) || 'null');
    if (!r || r.id !== params.reserva) return { ok: false, error: 'No se encontró la reserva.' };
    return {
      ok: true,
      estado: 'Pagada',
      reserva: { ...r, fechaTexto: new Intl.DateTimeFormat('es-ES', { dateStyle: 'full' }).format(fromISO(r.fecha)) },
      acceso: { pin: '482913', magicLink: '' },
    };
  }
  if (params.action === 'cancelacion') {
    const r = JSON.parse(sessionStorage.getItem(CLAVE) || 'null');
    if (!r || r.id !== params.reserva) return { ok: false, error: 'Enlace de cancelación no válido.' };
    return { ok: true, reserva: r, cancelada: false, puedeCancelar: true, motivo: null, limite: 'el día anterior', reembolso: r.precio };
  }
  return { ok: false, error: 'Acción no válida.' };
}

export async function post(body) {
  await espera(700);
  if (body.action === 'cancelar') {
    const r = JSON.parse(sessionStorage.getItem(CLAVE) || 'null');
    return { ok: true, reembolsado: true, importe: r?.precio || 0 };
  }
  const id = `DEMO-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const precio = calcularPrecio(CONFIG, body.horas * 60, body.personas);
  const reserva = {
    id,
    fecha: body.fecha,
    hora: body.hora,
    horaFin: sumarMin(body.hora, body.horas * 60),
    horas: body.horas,
    personas: body.personas,
    precio,
  };
  sessionStorage.setItem(CLAVE, JSON.stringify(reserva));
  // En real, aquí se iría a Stripe y Stripe devolvería a la página con estos parámetros.
  return { ok: true, id, precio, url: `${location.pathname}?pago=ok&reserva=${id}&session_id=cs_demo` };
}
