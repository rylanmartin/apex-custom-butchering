"use client";

type ReviewSubmitProps = {
  animalType: string;
  dropoffDate: string;
  dropoffTime: string;
  bookingType: "individual" | "farmer";
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  onSubmit: () => void;
  message: string;
};

export default function ReviewSubmit({
  animalType,
  dropoffDate,
  dropoffTime,
  bookingType,
  customerName,
  customerPhone,
  customerEmail,
  onSubmit,
  message,
}: ReviewSubmitProps) {
  return (
    <section className="rounded-2xl border bg-white p-8 shadow">
      <h2 className="mb-6 text-3xl font-bold">4. Review & Submit</h2>

      <div className="grid gap-4 rounded-xl bg-gray-100 p-6 text-lg">
        <p><strong>Animal:</strong> {animalType}</p>
        <p><strong>Drop-Off Date:</strong> {dropoffDate}</p>
        <p><strong>Drop-Off Time:</strong> {dropoffTime}</p>

        {animalType === "Beef" && (
          <p>
            <strong>Booking Type:</strong>{" "}
            {bookingType === "farmer" ? "Farmer Booking" : "Individual Customer"}
          </p>
        )}

        {bookingType === "individual" && (
          <>
            <p><strong>Name:</strong> {customerName || "Not entered yet"}</p>
            <p><strong>Phone:</strong> {customerPhone || "Not entered yet"}</p>
            <p><strong>Email:</strong> {customerEmail || "Not entered"}</p>
          </>
        )}
      </div>

      <div className="mt-6 rounded-xl bg-yellow-50 p-4 text-yellow-900">
        Cut sheets will be available after APEX receives the animal and enters hanging weight.
      </div>

      <button
        type="button"
        onClick={onSubmit}
        className="mt-6 w-full rounded-xl bg-red-700 px-6 py-4 text-lg font-bold text-white hover:bg-red-800"
      >
        Schedule Appointment
      </button>

      {message && (
        <p className="mt-4 text-center font-bold">
          {message}
        </p>
      )}
    </section>
  );
}