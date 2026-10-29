// Se muestra mientras las reservas online no están abiertas (web sin conectar o Stripe en modo pruebas).
export default function Proximamente() {
  return (
    <section className="glass rounded-2xl max-w-xl mx-auto p-6 sm:p-9 text-center">
      <h1 className="font-bold text-2xl sm:text-3xl">Reservas disponibles próximamente</h1>
      <p className="text-[#c7d6e5] mt-3">Estamos preparando las reservas online. Vuelve en unos días.</p>
    </section>
  );
}
