"use client";

import { useState } from "react";
import { supabase } from "../../supabase";

type AnimalType = "beef" | "pork" | "sheep" | "goat";
type BookingType = "individual" | "farmer";
type BeefSaleType = "whole" | "halves" | "quarters";

type BeefCustomer = {
  name: string;
  phone: string;
};

type BeefEntry = {
  saleType: BeefSaleType;
  customers: BeefCustomer[];
};

const mondayTimes = ["16:00", "16:15", "16:30", "16:45", "17:00", "17:15", "17:30"];
const tuesdayTimes = ["07:00", "07:15", "07:30", "07:45", "08:00", "08:15", "08:30", "08:45", "09:00"];

function customersForSaleType(saleType: BeefSaleType): BeefCustomer[] {
  if (saleType === "whole") return [{ name: "", phone: "" }];
  if (saleType === "halves") {
    return [
      { name: "", phone: "" },
      { name: "", phone: "" },
    ];
  }

  return [
    { name: "", phone: "" },
    { name: "", phone: "" },
    { name: "", phone: "" },
    { name: "", phone: "" },
  ];
}

function getAvailableTimes(dateValue: string) {
  if (!dateValue) return [];

  const date = new Date(`${dateValue}T00:00:00`);
  const day = date.getDay();

  if (day === 1) return mondayTimes;
  if (day === 2) return tuesdayTimes;

  return [];
}

export default function SchedulePage() {
  const [animalType, setAnimalType] = useState<AnimalType>("beef");
  const [bookingType, setBookingType] = useState<BookingType>("individual");

  const [processingWeek, setProcessingWeek] = useState("");
  const [dropoffDate, setDropoffDate] = useState("");
  const [dropoffTime, setDropoffTime] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  const [farmerName, setFarmerName] = useState("");
  const [farmerPhone, setFarmerPhone] = useState("");
  const [farmerEmail, setFarmerEmail] = useState("");

  const [beefs, setBeefs] = useState<BeefEntry[]>([
    { saleType: "whole", customers: customersForSaleType("whole") },
  ]);

  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");

  const availableTimes = getAvailableTimes(dropoffDate);

  function handleAnimalChange(value: AnimalType) {
    setAnimalType(value);

    if (value !== "beef") {
      setBookingType("individual");
    }
  }

  function handleDropoffDate(value: string) {
    const date = new Date(`${value}T00:00:00`);
    const day = date.getDay();

    if (day !== 1 && day !== 2) {
      alert("Drop-off is only available Monday evening or Tuesday morning.");
      setDropoffDate("");
      setDropoffTime("");
      return;
    }

    setDropoffDate(value);
    setDropoffTime("");
  }

  function updateBeefSaleType(index: number, saleType: BeefSaleType) {
    const updated = [...beefs];
    updated[index] = {
      saleType,
      customers: customersForSaleType(saleType),
    };
    setBeefs(updated);
  }

  function updateBeefCustomer(
    beefIndex: number,
    customerIndex: number,
    field: keyof BeefCustomer,
    value: string
  ) {
    const updated = [...beefs];
    updated[beefIndex].customers[customerIndex][field] = value;
    setBeefs(updated);
  }

  function addBeef() {
    setBeefs([
      ...beefs,
      { saleType: "whole", customers: customersForSaleType("whole") },
    ]);
  }

  function removeBeef(index: number) {
    setBeefs(beefs.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Saving appointment...");

    if (!processingWeek || !dropoffDate || !dropoffTime) {
      setMessage("Please choose a processing week, drop-off date, and drop-off time.");
      return;
    }

    try {
      if (animalType === "beef" && bookingType === "farmer") {
        if (!farmerName || !farmerPhone) {
          setMessage("Please enter farmer name and phone number.");
          return;
        }

        const { data: farmer, error: farmerError } = await supabase
          .from("farmers")
          .insert({
            contact_name: farmerName,
            phone: farmerPhone,
            email: farmerEmail || null,
          })
          .select()
          .single();

        if (farmerError) throw farmerError;

        const { data: appointment, error: appointmentError } = await supabase
          .from("appointments")
          .insert({
            booking_type: "farmer",
            animal_type: "beef",
            processing_week: processingWeek,
            dropoff_date: dropoffDate,
            dropoff_time: dropoffTime,
            farmer_id: farmer.id,
            notes,
          })
          .select()
          .single();

        if (appointmentError) throw appointmentError;

        for (let beefIndex = 0; beefIndex < beefs.length; beefIndex++) {
          const beef = beefs[beefIndex];

          const { data: animal, error: animalError } = await supabase
            .from("animals")
            .insert({
              appointment_id: appointment.id,
              animal_type: "beef",
              animal_number: beefIndex + 1,
              status: "scheduled",
            })
            .select()
            .single();

          if (animalError) throw animalError;

          for (let customerIndex = 0; customerIndex < beef.customers.length; customerIndex++) {
            const customer = beef.customers[customerIndex];

            if (!customer.name || !customer.phone) {
              throw new Error("Each beef customer needs a name and phone number.");
            }

            const { data: savedCustomer, error: customerError } = await supabase
              .from("customers")
              .insert({
                name: customer.name,
                phone: customer.phone,
              })
              .select()
              .single();

            if (customerError) throw customerError;

            const shareType =
              beef.saleType === "whole"
                ? "whole"
                : beef.saleType === "halves"
                  ? "half"
                  : "quarter";

            const { error: shareError } = await supabase
              .from("beef_shares")
              .insert({
                animal_id: animal.id,
                customer_id: savedCustomer.id,
                share_type: shareType,
                share_number: customerIndex + 1,
                cut_sheet_unlocked: false,
                cut_sheet_submitted: false,
                text_sent: false,
                contact_method: "none",
              });

            if (shareError) throw shareError;
          }
        }
      } else {
        if (!customerName || !customerPhone) {
          setMessage("Please enter customer name and phone number.");
          return;
        }

        const { data: customer, error: customerError } = await supabase
          .from("customers")
          .insert({
            name: customerName,
            phone: customerPhone,
            email: customerEmail || null,
          })
          .select()
          .single();

        if (customerError) throw customerError;

        const { data: appointment, error: appointmentError } = await supabase
          .from("appointments")
          .insert({
            booking_type: "individual",
            animal_type: animalType,
            processing_week: processingWeek,
            dropoff_date: dropoffDate,
            dropoff_time: dropoffTime,
            customer_id: customer.id,
            notes,
          })
          .select()
          .single();

        if (appointmentError) throw appointmentError;

        const { error: animalError } = await supabase
          .from("animals")
          .insert({
            appointment_id: appointment.id,
            animal_type: animalType,
            animal_number: 1,
            status: "scheduled",
          });

        if (animalError) throw animalError;
      }

      setMessage("Appointment saved successfully.");
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong while saving. Check the console or Supabase settings.");
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-5xl rounded-2xl bg-white p-8 shadow">
        <p className="mb-2 text-sm font-bold uppercase tracking-wide text-red-700">
          Schedule Processing
        </p>

        <h1 className="mb-4 text-4xl font-bold">Book Your Drop-Off</h1>

        <p className="mb-8 text-gray-700">
          Schedule beef, pork, sheep, or goat processing. Cut sheets are locked
          until APEX receives the animal, enters hanging weight, and unlocks the cut order.
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="mb-2 block font-semibold">Animal Type</label>
            <select
              value={animalType}
              onChange={(e) => handleAnimalChange(e.target.value as AnimalType)}
              className="w-full rounded-lg border px-4 py-3"
            >
              <option value="beef">Beef</option>
              <option value="pork">Pork</option>
              <option value="sheep">Sheep</option>
              <option value="goat">Goat</option>
            </select>
          </div>

          {animalType === "beef" && (
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
          )}

          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <label className="mb-2 block font-semibold">Processing Week</label>
              <input
                type="date"
                value={processingWeek}
                onChange={(e) => setProcessingWeek(e.target.value)}
                className="w-full rounded-lg border px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block font-semibold">Drop-Off Date</label>
              <input
                type="date"
                value={dropoffDate}
                onChange={(e) => handleDropoffDate(e.target.value)}
                className="w-full rounded-lg border px-4 py-3"
              />
              <p className="mt-2 text-xs text-gray-600">
                Monday 4:00-5:30 PM or Tuesday 7:00-9:00 AM.
              </p>
            </div>

            <div>
              <label className="mb-2 block font-semibold">Drop-Off Time</label>
              <select
                value={dropoffTime}
                onChange={(e) => setDropoffTime(e.target.value)}
                className="w-full rounded-lg border px-4 py-3"
              >
                <option value="">Select time</option>
                {availableTimes.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {bookingType === "individual" && (
            <div className="space-y-4 rounded-xl border p-6">
              <h2 className="text-2xl font-bold">Customer Information</h2>

              <input
                placeholder="Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full rounded-lg border px-4 py-3"
              />

              <input
                placeholder="Phone Number"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full rounded-lg border px-4 py-3"
              />

              <input
                placeholder="Email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full rounded-lg border px-4 py-3"
              />
            </div>
          )}

          {animalType === "beef" && bookingType === "farmer" && (
            <div className="space-y-6 rounded-xl border p-6">
              <h2 className="text-2xl font-bold">Farmer Booking</h2>

              <input
                placeholder="Farmer Name"
                value={farmerName}
                onChange={(e) => setFarmerName(e.target.value)}
                className="w-full rounded-lg border px-4 py-3"
              />

              <input
                placeholder="Farmer Phone"
                value={farmerPhone}
                onChange={(e) => setFarmerPhone(e.target.value)}
                className="w-full rounded-lg border px-4 py-3"
              />

              <input
                placeholder="Farmer Email"
                value={farmerEmail}
                onChange={(e) => setFarmerEmail(e.target.value)}
                className="w-full rounded-lg border px-4 py-3"
              />

              {beefs.map((beef, beefIndex) => (
                <div key={beefIndex} className="rounded-xl bg-gray-100 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xl font-bold">Beef #{beefIndex + 1}</h3>

                    {beefs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBeef(beefIndex)}
                        className="font-bold text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <label className="mb-2 block font-semibold">
                    How is this beef sold?
                  </label>

                  <select
                    value={beef.saleType}
                    onChange={(e) =>
                      updateBeefSaleType(beefIndex, e.target.value as BeefSaleType)
                    }
                    className="mb-4 w-full rounded-lg border px-4 py-3"
                  >
                    <option value="whole">Whole</option>
                    <option value="halves">Halves</option>
                    <option value="quarters">Quarters</option>
                  </select>

                  <div className="space-y-4">
                    {beef.customers.map((customer, customerIndex) => (
                      <div key={customerIndex} className="grid gap-4 md:grid-cols-2">
                        <input
                          placeholder={`Customer ${customerIndex + 1} Name`}
                          value={customer.name}
                          onChange={(e) =>
                            updateBeefCustomer(
                              beefIndex,
                              customerIndex,
                              "name",
                              e.target.value
                            )
                          }
                          className="rounded-lg border px-4 py-3"
                        />

                        <input
                          placeholder={`Customer ${customerIndex + 1} Phone`}
                          value={customer.phone}
                          onChange={(e) =>
                            updateBeefCustomer(
                              beefIndex,
                              customerIndex,
                              "phone",
                              e.target.value
                            )
                          }
                          className="rounded-lg border px-4 py-3"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addBeef}
                className="rounded-lg border px-5 py-3 font-bold hover:bg-gray-100"
              >
                Add Another Beef
              </button>
            </div>
          )}

          <div>
            <label className="mb-2 block font-semibold">Notes</label>
            <textarea
              placeholder="Anything APEX should know before drop-off?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-28 w-full rounded-lg border px-4 py-3"
            />
          </div>

          <div className="rounded-lg bg-gray-100 p-4 text-sm text-gray-700">
            Weekly limits are 15 beef and 6 pigs. Cut sheets are not fillable at booking.
            APEX unlocks cut sheets after the animal is received and hanging weight is entered.
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-red-700 px-6 py-3 font-bold text-white hover:bg-red-800"
          >
            Schedule Drop-Off
          </button>

          {message && <p className="text-center font-bold">{message}</p>}
        </form>
      </div>
    </main>
  );
}