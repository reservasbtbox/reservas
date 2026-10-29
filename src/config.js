// ⬇️ Pega aquí la URL de tu aplicación web de Google Apps Script (termina en /exec).
export const API_URL = 'https://script.google.com/macros/s/AKfycbwlYS-NRJBLd7d--P4crfc3g6QK4k2HIbXIThiqYB9LjjnzIhPygyjNvrDK3uoR1efNaA/exec';

const CONECTADA = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(API_URL) && !API_URL.includes('XXXX');

// Sin URL válida: en tu ordenador (npm run dev) funciona en modo demostración con datos inventados;
// publicada, muestra "Reservas disponibles próximamente" para que nadie haga una reserva falsa.
export const MODO_DEMO = !CONECTADA && import.meta.env.DEV;
export const PROXIMAMENTE = !CONECTADA && !import.meta.env.DEV;
