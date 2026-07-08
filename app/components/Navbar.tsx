export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="/" className="text-xl font-bold tracking-wide">
          APEX
        </a>

        <nav className="hidden gap-8 text-sm font-semibold md:flex">
          <a href="/">Home</a>
          <a href="#services">Services</a>
          <a href="/schedule">Schedule</a>
          <a href="#contact">Contact</a>
        </nav>

        <a
          href="tel:9893231187"
          className="rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800"
        >
          Call Now
        </a>
      </div>
    </header>
  );
}