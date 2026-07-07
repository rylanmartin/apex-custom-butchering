export default function Footer() {
  return (
    <footer
      id="contact"
      className="bg-black px-6 py-12 text-white"
    >
      <div className="mx-auto max-w-6xl grid gap-8 md:grid-cols-2">

        <div>
          <h2 className="mb-4 text-2xl font-bold">
            APEX Custom Butchering
          </h2>

          <p>155 W Henderson Rd</p>
          <p>Owosso, MI 48867</p>

          <p className="mt-4 text-lg font-semibold">
            (989) 323-1187
          </p>
        </div>

        <div>
          <h2 className="mb-4 text-2xl font-bold">
            Business Hours
          </h2>

          <p>Monday: 8:00 AM - 5:30 PM</p>
          <p>Tuesday: 8:00 AM - 1:00 PM</p>
          <p>Wednesday: 8:00 AM - 5:30 PM</p>
          <p>Thursday: 8:00 AM - 5:30 PM</p>
          <p>Friday: 8:00 AM - 5:30 PM</p>
          <p>Saturday: 8:00 AM - 12:00 PM</p>
          <p>Sunday: Closed</p>
        </div>

      </div>

      <div className="mt-10 border-t border-gray-700 pt-6 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} APEX Custom Butchering. All Rights Reserved.
      </div>
    </footer>
  );
}