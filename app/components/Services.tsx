const services = [
  "🐄 Beef Processing",
  "🐖 Pork Processing",
  "🐑 Sheep Processing",
  "🐐 Goat Processing",
  "🦌 Deer Processing",
];

export default function Services() {
  return (
    <section id="services" className="bg-gray-100 px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-4 text-center text-3xl font-bold">
          Our Services
        </h2>

        <p className="mx-auto mb-10 max-w-2xl text-center text-gray-700">
          Custom processing for livestock and wild game with clear instructions,
          careful handling, and dependable service.
        </p>

        <div className="grid gap-6 md:grid-cols-5">
          {services.map((service) => (
            <div
              key={service}
              className="rounded-xl bg-white p-6 text-center text-lg font-bold shadow-sm"
            >
              {service}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}