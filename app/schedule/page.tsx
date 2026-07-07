"use client";

import { useState } from "react";

type BookingType = "individual" | "farmer";
type Portion = "Quarter" | "Half" | "Whole";

type FarmerCustomer = {
  name: string;
  phone: string;
  portion: Portion;
};

export default function SchedulePage() {
  const [bookingType, setBookingType] = useState<BookingType>("individual");

  const [farmerCustomers, setFarmerCustomers] = useState<FarmerCustomer[]>([
    { name: "", phone: "", portion: "Quarter" },
  ]);

  function addCustomer() {
    setFarmerCustomers([
      ...farmerCustomers,
      { name: "", phone: "", portion: "Quarter" },
    ]);
  }

  function updateCustomer(
    index: number,
    field: keyof FarmerCustomer,
    value: string
  ) {
    const updated = [...farmerCustomers];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setFarmerCustomers(updated);
  }

  function removeCustomer(index: number) {
    setFarmerCustomers(farmerCustomers.filter((_, i) => i !== index));
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow">
        <p className="mb-2 text-sm font-bold uppercase tracking-wide text-red-700">
          Schedule Processing
        </p>

        <h1 className="mb-4 text-4xl font-bold">Book Your Drop-Off</h1>

        <p className="mb-8 text-gray-700">
          Schedule beef drop-off for Monday night or Tuesday morning. Cut
          orders are locked until the animal is killed and APEX makes the cut
          sheet available.
        </p>

        <form className="space-y-8">
          <div>
            <label className="mb-2 block font-semibold">Booking Type</label>

            <select
              value={bookingType}
              onChange={(e) => setBookingType(e.target.value as BookingType)}
              className="w-full rounded-lg border px-4 py-3"
            >
              <option value="individual">Individual Customer</option>
              <option value="farmer">Farmer Booking for Customers</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block font-semibold">Processing Week</label>
            <input type="date" className="w-full rounded-lg border px-4 py-3" />
            <p className="mt-2 text-sm text-gray-600">
              We will limit this to Tuesday processing weeks when we connect the
              calendar rules.
            </p>
          </div>

          <div>
            <label className="mb-2 block font-semibold">Drop-Off Option</label>
            <select className="w-full rounded-lg border px-4 py-3">
              <option>Monday Night</option>
              <option>Tuesday Morning - No Later Than 9:00 AM</option>
            </select>
          </div>

          {bookingType === "individual" && (
            <div className="space-y-6 rounded-xl border p-6">
              <h2 className="text-2xl font-bold">Customer Information</h2>

              <div>
                <label className="mb-2 block font-semibold">Name</label>
                <input className="w-full rounded-lg border px-4 py-3" />
              </div>

              <div>
                <label className="mb-2 block font-semibold">Phone Number</label>
                <input className="w-full rounded-lg border px-4 py-3" />
              </div>

              <div>
                <label className="mb-2 block font-semibold">Email</label>
                <input
                  type="email"
                  className="w-full rounded-lg border px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block font-semibold">Portion</label>
                <select className="w-full rounded-lg border px-4 py-3">
                  <option>Quarter</option>
                  <option>Half</option>
                  <option>Whole</option>
                </select>
              </div>
            </div>
          )}

          {bookingType === "farmer" && (
            <div className="space-y-6 rounded-xl border p-6">
              <h2 className="text-2xl font-bold">Farmer Information</h2>

              <div>
                <label className="mb-2 block font-semibold">Farmer Name</label>
                <input className="w-full rounded-lg border px-4 py-3" />
              </div>

              <div>
                <label className="mb-2 block font-semibold">Farmer Phone</label>
                <input className="w-full rounded-lg border px-4 py-3" />
              </div>

              <div>
                <label className="mb-2 block font-semibold">
                  Number of Beef
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full rounded-lg border px-4 py-3"
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="mb-4 text-xl font-bold">
                  Farmer&apos;s Customers
                </h3>

                <div className="space-y-6">
                  {farmerCustomers.map((customer, index) => (
                    <div
                      key={index}
                      className="rounded-lg bg-gray-100 p-5"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <h4 className="font-bold">Customer {index + 1}</h4>

                        {farmerCustomers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCustomer(index)}
                            className="text-sm font-bold text-red-700"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          <label className="mb-2 block font-semibold">
                            Name
                          </label>
                          <input
                            value={customer.name}
                            onChange={(e) =>
                              updateCustomer(index, "name", e.target.value)
                            }
                            className="w-full rounded-lg border px-4 py-3"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block font-semibold">
                            Phone
                          </label>
                          <input
                            value={customer.phone}
                            onChange={(e) =>
                              updateCustomer(index, "phone", e.target.value)
                            }
                            className="w-full rounded-lg border px-4 py-3"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block font-semibold">
                            Portion
                          </label>
                          <select
                            value={customer.portion}
                            onChange={(e) =>
                              updateCustomer(index, "portion", e.target.value)
                            }
                            className="w-full rounded-lg border px-4 py-3"
                          >
                            <option>Quarter</option>
                            <option>Half</option>
                            <option>Whole</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addCustomer}
                  className="mt-4 rounded-lg border px-5 py-3 font-bold hover:bg-gray-100"
                >
                  Add Another Customer
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="mb-2 block font-semibold">Notes</label>
            <textarea
              className="min-h-28 w-full rounded-lg border px-4 py-3"
              placeholder="Anything APEX should know before drop-off?"
            />
          </div>

          <div className="rounded-lg bg-gray-100 p-4 text-sm text-gray-700">
            Weekly limits: 15 beef and 6 pigs. Cut sheets are not fillable when
            booking. After the animal is killed, APEX can choose whether to send
            each customer a text link or contact them another way.
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-red-700 px-6 py-3 font-bold text-white hover:bg-red-800"
          >
            Schedule Drop-Off
          </button>
        </form>
      </div>
    </main>
  );
}