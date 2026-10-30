// Iconos de línea (24×24) para la página de inicio. Toman el color del texto (currentColor).
function Icono({ children, className = 'w-7 h-7' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {children}
    </svg>
  );
}

export const Reloj = (p) => (
  <Icono {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Icono>
);

export const Persona = (p) => (
  <Icono {...p}>
    <circle cx="12" cy="7.5" r="4" />
    <path d="M4.5 21v-.5A5.5 5.5 0 0 1 10 15h4a5.5 5.5 0 0 1 5.5 5.5v.5" />
  </Icono>
);

export const Pareja = (p) => (
  <Icono {...p}>
    <circle cx="8" cy="8" r="3.2" />
    <circle cx="16" cy="8" r="3.2" />
    <path d="M2.5 20v-.5A4.5 4.5 0 0 1 7 15h2a4.5 4.5 0 0 1 3 1.2A4.5 4.5 0 0 1 15 15h2a4.5 4.5 0 0 1 4.5 4.5v.5" />
  </Icono>
);

export const Familia = (p) => (
  <Icono {...p}>
    <circle cx="12" cy="6" r="2.6" />
    <circle cx="5.5" cy="10" r="2.2" />
    <circle cx="18.5" cy="10" r="2.2" />
    <path d="M8 20v-3a4 4 0 0 1 8 0v3M2 20v-1.5A3.5 3.5 0 0 1 5.5 15h.5M22 20v-1.5a3.5 3.5 0 0 0-3.5-3.5H18" />
  </Icono>
);

export const Amanecer = (p) => (
  <Icono {...p}>
    <path d="M2 19h20M6.5 19a5.5 5.5 0 0 1 11 0M12 6v3M4.6 10.6l1.8 1.8M19.4 10.6l-1.8 1.8M2 15.5h2M20 15.5h2" />
  </Icono>
);

export const Luna = (p) => (
  <Icono {...p}>
    <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5z" />
  </Icono>
);

export const Pesa = (p) => (
  <Icono {...p}>
    <path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11" />
  </Icono>
);

export const Candado = (p) => (
  <Icono {...p}>
    <rect x="5" y="10.5" width="14" height="10.5" rx="2" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3M12 14.5v2.5" />
  </Icono>
);

export const Corazon = (p) => (
  <Icono {...p}>
    <path d="M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.2a4.2 4.2 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z" />
  </Icono>
);

export const Tableta = (p) => (
  <Icono {...p}>
    <rect x="5.5" y="2.5" width="13" height="19" rx="2" />
    <path d="M10.5 18.5h3" />
  </Icono>
);

export const Libro = (p) => (
  <Icono {...p}>
    <path d="M2.5 5h6A3.5 3.5 0 0 1 12 8.5V20a2.5 2.5 0 0 0-2.5-2.5h-7zM21.5 5h-6A3.5 3.5 0 0 0 12 8.5V20a2.5 2.5 0 0 1 2.5-2.5h7z" />
  </Icono>
);
