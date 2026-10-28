// Datos inventados para ver la página funcionando antes de conectar el Apps Script.
// No se usa en cuanto API_URL tiene la URL real.
import { addDays, fromISO, horaMas, iso, pad } from './utils.js';

const CONFIG = {
  centro: 'BTBOX Training Center',
  zonaHoraria: 'Europe/Madrid',
  horario: 'L–V 08:00–21:00 · Sáb 09:00–14:00 · Dom cerrado',
  precios: { profesionalHora: 20, clienteHora: 5 },
  limites: { maxProfesionales: 1, maxClientes: 6, maxHoras: 3, diasMaximos: 60 },
};
const CLAVE = 'btbox-demo-reserva';

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

function estadoSlot(fecha, h) {
  const d = fromISO(fecha);
  const dia = (d.getDay() + 6) % 7;
  const abierto = dia < 5 ? h >= 8 && h < 21 : dia === 5 ? h >= 9 && h < 14 : false;
  if (!abierto) return 'cerrada';
  if (new Date(d.getFullYear(), d.getMonth(), d.getDate(), h) <= new Date()) return 'pasada';
  return (d.getDate() * 7 + h * 3) % 11 === 0 ? 'ocupada' : 'disponible';
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
        slots: Array.from({ length: 13 }, (_, k) => ({ hora: `${pad(8 + k)}:00`, estado: estadoSlot(fecha, 8 + k) })),
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
  return { ok: false, error: 'Acción no válida.' };
}

export async function post(body) {
  await espera(700);
  const id = `DEMO-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const p = CONFIG.precios;
  const precio = body.horas * (p.profesionalHora * body.profesionales + p.clienteHora * body.clientes);
  const reserva = {
    id,
    fecha: body.fecha,
    hora: body.hora,
    horaFin: horaMas(body.hora, body.horas),
    horas: body.horas,
    profesionales: body.profesionales,
    clientes: body.clientes,
    precio,
  };
  sessionStorage.setItem(CLAVE, JSON.stringify(reserva));
  // En real, aquí se iría a Stripe y Stripe devolvería a la página con estos parámetros.
  return { ok: true, id, precio, url: `${location.pathname}?pago=ok&reserva=${id}&session_id=cs_demo` };
}
