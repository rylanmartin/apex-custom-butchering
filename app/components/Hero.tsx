import Image from "next/image";

export default function Hero() {
  return (
    <section className="bg-black px-6 py-20 text-center text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex justify-center">
          <Image
            src="/images/apex-logo.jpg.JPG"
            alt="APEX Custom Butchering Logo"
            width={260}
            height={260}
            priority
          />
        </div>

        <p className="mb-3 text-sm font-bold uppercase tracking-[0.35em] text-red-500">
          Premium Custom Butchering
        </p>

        <h1 className="mb-6 text-4xl font-extrabold md:text-6xl">
          Quality Processing From Drop-Off To Pickup
        </h1>

        <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-300">
          Beef, pork, sheep, goats, and deer processed with care, clean work,
          and custom cut instructions.
        </p>

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <a
            href="/schedule"
            className="rounded-lg bg-red-700 px-8 py-3 font-bold text-white hover:bg-red-800"
          >
            Schedule Processing
          </a>

          <a
            href="tel:9893231187"
            className="rounded-lg border border-white px-8 py-3 font-bold text-white hover:bg-white hover:text-black"
          >
            Call (989) 323-1187
          </a>
        </div>
      </div>
    </section>
  );
}