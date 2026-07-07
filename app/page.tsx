import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-black">
      <section className="bg-black text-white px-6 py-16 text-center">
        <div className="mb-8 flex justify-center">
          <Image
            src="/images/apex-logo.jpg.JPG"
            alt="APEX Custom Butchering Logo"
            width={260}
            height={260}
            priority
          />
        </div>

        <h1 className="mb-4 text-4xl font-bold md:text-6xl">
          APEX Custom Butchering
        </h1>

        <p className="mb-4 text-xl text-gray-200">
          Premium Quality Meat Processing
        </p>

        <p className="mb-8 text-lg">
          Beef • Pork • Sheep • Goat • Deer
        </p>

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <a
            href="#schedule"
            className="rounded-lg bg-red-700 px-8 py-3 font-bold text-white hover:bg-red-800"
          >
            Schedule Processing
          </a>

          <a
            href="tel:9893231187"
            className="rounded-lg border border-white px-8 py-3 font-bold text-white hover:bg-white hover:text-black"
          >
            Call Now
          </a>
        </div>
      </section>

      <section className="px-6 py-14 text-center">
        <h2 className="mb-6 text-3xl font-bold">Quality You Can Trust</h2>

        <p className="mx-auto max-w-3xl text-lg leading-8 text-gray-700">
          APEX Custom Butchering provides professional custom processing for
          beef, pork, sheep, goats, and deer. We focus on clean work, careful
          cutting, and dependable service from drop-off to pickup.
        </p>
      </section>

      <section className="bg-gray-100 px-6 py-14">
        <h2 className="mb-10 text-center text-3xl font-bold">
          Our Services
        </h2>

        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-5">
          {["🐄 Beef", "🐖 Pork", "🐑 Sheep", "🐐 Goat", "🦌 Deer"].map(
            (service) => (
              <div
                key={service}
                className="rounded-xl bg-white p-6 text-center text-xl font-bold shadow"
              >
                {service}
              </div>
            )
          )}
        </div>
      </section>

      <section id="schedule" className="px-6 py-14 text-center">
        <h2 className="mb-6 text-3xl font-bold">How It Works</h2>

        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-4">
          <div className="rounded-xl border p-6">
            <h3 className="mb-2 text-xl font-bold">1. Schedule</h3>
            <p>Choose your animal type and drop-off time.</p>
          </div>

          <div className="rounded-xl border p-6">
            <h3 className="mb-2 text-xl font-bold">2. Drop Off</h3>
            <p>Bring your animal to our shop at your scheduled time.</p>
          </div>

          <div className="rounded-xl border p-6">
            <h3 className="mb-2 text-xl font-bold">3. Cut Sheet</h3>
            <p>Fill out your custom processing instructions.</p>
          </div>

          <div className="rounded-xl border p-6">
            <h3 className="mb-2 text-xl font-bold">4. Pick Up</h3>
            <p>We notify you when your order is ready.</p>
          </div>
        </div>
      </section>

      <section className="bg-black px-6 py-14 text-white">
        <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-2">
          <div>
            <h2 className="mb-4 text-3xl font-bold">Contact</h2>
            <p>155 W Henderson Rd</p>
            <p>Owosso, MI 48867</p>
            <p className="mt-4 text-xl font-bold">(989) 323-1187</p>
          </div>

          <div>
            <h2 className="mb-4 text-3xl font-bold">Business Hours</h2>
            <p>Monday: 8:00 AM - 5:30 PM</p>
            <p>Tuesday: 8:00 AM - 1:00 PM</p>
            <p>Wednesday: 8:00 AM - 5:30 PM</p>
            <p>Thursday: 8:00 AM - 5:30 PM</p>
            <p>Friday: 8:00 AM - 5:30 PM</p>
            <p>Saturday: 8:00 AM - 12:00 PM</p>
            <p>Sunday: Closed</p>
          </div>
        </div>
      </section>
    </main>
  );
}