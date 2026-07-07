const reasons = [
  "Professional custom processing",
  "Clean, organized facility",
  "Beef, pork, sheep, goat, and deer",
  "Digital cut sheets coming soon",
  "Appointment scheduling coming soon",
  "Local service you can trust",
];

export default function WhyChooseUs() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-10 text-center text-3xl font-bold">
          Why Choose APEX?
        </h2>

        <div className="grid gap-6 md:grid-cols-3">
          {reasons.map((reason) => (
            <div key={reason} className="rounded-xl border p-6 shadow-sm">
              <p className="text-lg font-semibold">✓ {reason}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}