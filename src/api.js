import { API_URL, MODO_DEMO } from './config.js';
import * as demo from './demo.js';

const SIN_CONEXION = 'No se pudo conectar con el sistema de reservas. Comprueba tu conexión e inténtalo de nuevo.';

async function leer(res) {
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error('El sistema de reservas ha devuelto una respuesta no válida. Inténtalo de nuevo en unos minutos.');
  }
  if (!data.ok) throw new Error(data.error || 'Se ha producido un error. Inténtalo de nuevo.');
  return data;
}

async function get(params) {
  if (MODO_DEMO) return demo.get(params);
  let res;
  try {
    res = await fetch(`${API_URL}?${new URLSearchParams(params)}`);
  } catch {
    throw new Error(SIN_CONEXION);
  }
  return leer(res);
}

async function post(body) {
  if (MODO_DEMO) return demo.post(body);
  let res;
  try {
    // text/plain evita la petición previa CORS que Apps Script no admite.
    res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(SIN_CONEXION);
  }
  return leer(res);
}

export const api = {
  config: () => get({ action: 'config' }),
  disponibilidad: (desde, dias = 7) => get({ action: 'disponibilidad', desde, dias }),
  estado: (reserva, sessionId) => get({ action: 'estado', reserva, session_id: sessionId || '' }),
  reservar: (datos) => post({ action: 'reservar', ...datos }),
  cancelacion: (reserva, token) => get({ action: 'cancelacion', reserva, token }),
  cancelar: (reserva, token) => post({ action: 'cancelar', reserva, token }),
  abandonar: (reserva, token) => post({ action: 'abandonar', reserva, token }),
};
