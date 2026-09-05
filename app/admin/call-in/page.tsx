"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type Species = "beef" | "pork" | "sheep" | "goat";

type Quantities = Record<Species, number>;

const EMPTY_QUANTITIES: Quantities = {
  beef: 0,
  pork: 0,
  sheep: 0,
  goat: 0,
};

function formatTime12Hour(value: string) {
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return value;

  const hour24 = Number(match[1]);
  const minute = match[2];
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${minute} ${period}`;
}

export default function CallInBookingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [dropoffDate, setDropoffDate] = useState("");
  const [dropoffTime, setDropoffTime] = useState("");
  const [quantities, setQuantities] = useState<Quantities>(EMPTY_QUANTITIES);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function checkAccess() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!active) return;

      if (error || !user) {
        router.replace("/login");
        return;
      }

      setChecking(false);
    }

    checkAccess();

    return () => {
      active = false;
    };
  }, [router]);

  const totalAnimals = useMemo(
    () =>
      quantities.beef +
      quantities.pork +
      quantities.sheep +
      quantities.goat,
    [quantities],
  );

  function updateQuantity(species: Species, rawValue: string) {
    const parsed = Number.parseInt(rawValue, 10);
    const nextValue = Number.isNaN(parsed) ? 0 : Math.max(0, parsed);

    setQuantities((current) => ({
      ...current,
      [species]: nextValue,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    const cleanName = customerName.trim();
    const cleanPhone = customerPhone.trim();

    if (!cleanName) {
      setMessage("Enter the customer's name.");
      return;
    }

    if (!cleanPhone) {
      setMessage("Enter the customer's phone number.");
      return;
    }

    if (!dropoffDate) {
      setMessage("Choose the drop-off date.");
      return;
    }

    if (!dropoffTime) {
      setMessage("Choose the drop-off time.");
      return;
    }

    if (totalAnimals < 1) {
      setMessage("Enter at least one beef, pork, sheep, or goat.");
      return;
    }

    setSaving(true);
    setMessage("Adding call-in booking to the schedule...");

    const createdAppointmentIds: Array<string | number> = [];

    try {
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .insert({
          name: cleanName,
          phone: cleanPhone,
          email: null,
        })
        .select("id")
        .single();

      if (customerError || !customer?.id) {
        throw new Error(
          customerError?.message || "Could not create the customer.",
        );
      }

      const entries = (
        Object.entries(quantities) as Array<[Species, number]>
      ).filter(([, quantity]) => quantity > 0);

      for (const [species, quantity] of entries) {
        // One appointment per species keeps the existing hanging-weight and
        // cut-sheet workflow intact while still allowing one phone call to
        // schedule several different species at once.
        const { data: appointment, error: appointmentError } = await supabase
          .from("appointments")
          .insert({
            booking_type: "farmer",
            animal_type: species,
            processing_week: dropoffDate,
            dropoff_date: dropoffDate,
            dropoff_time: dropoffTime,
            customer_id: customer.id,
          })
          .select("id")
          .single();

        if (appointmentError || !appointment?.id) {
          throw new Error(
            appointmentError?.message ||
              `Could not create the ${species} appointment.`,
          );
        }

        createdAppointmentIds.push(appointment.id);

        const animalRows = Array.from({ length: quantity }, (_, index) => ({
          appointment_id: appointment.id,
          animal_type: species,
          animal_number: index + 1,
          status: "scheduled",
        }));

        const { error: animalError } = await supabase
          .from("animals")
          .insert(animalRows);

        if (animalError) {
          throw new Error(
            animalError.message || `Could not create the ${species} animals.`,
          );
        }
      }

      const summary = entries
        .map(
          ([species, quantity]) =>
            `${quantity} ${species}${quantity === 1 ? "" : species === "pork" ? "" : "s"}`,
        )
        .join(", ");

      setMessage(
        `Scheduled ${totalAnimals} animal${totalAnimals === 1 ? "" : "s"} for ${cleanName}: ${summary}.`,
      );

      setCustomerName("");
      setCustomerPhone("");
      setDropoffDate("");
      setDropoffTime("");
      setQuantities(EMPTY_QUANTITIES);

      window.setTimeout(() => {
        router.push("/admin");
        router.refresh();
      }, 900);
    } catch (error) {
      console.error(error);

      // Remove appointments created during a partially failed submission.
      // Their animal rows are expected to cascade with the appointment.
      if (createdAppointmentIds.length > 0) {
        await supabase
          .from("appointments")
          .delete()
          .in("id", createdAppointmentIds);
      }

      setMessage(
        error instanceof Error
          ? `Could not schedule the call-in booking: ${error.message}`
          : "Could not schedule the call-in booking.",
      );
      setSaving(false);
    }
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-100 px-6">
        <div className="rounded-lg bg-white px-8 py-6 text-center shadow-sm">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-red-800" />
          <p className="mt-4 font-semibold text-stone-700">
            Checking administrator access...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-100 text-stone-950">
      <header className="bg-stone-950 text-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-red-400">
              Apex Custom Butchering
            </p>
            <h1 className="mt-2 text-3xl font-black uppercase">
              Schedule Call-In
            </h1>
          </div>

          <Link
            href="/admin"
            className="rounded-md border border-white/20 px-4 py-2 text-sm font-bold transition hover:bg-white hover:text-stone-950"
          >
            Back to Admin
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8">
        <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="border-b border-stone-200 pb-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-800">
              Phone Booking
            </p>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-tight">
              Add Animals to the Schedule
            </h2>
            <p className="mt-2 max-w-2xl leading-7 text-stone-600">
              Enter the customer once, choose the drop-off date and time, then
              enter how many of each species they are bringing.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-7">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-black uppercase tracking-wide text-stone-700">
                  Customer Name
                </span>
                <input
                  type="text"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Customer name"
                  autoComplete="name"
                  className="mt-2 w-full rounded-lg border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-red-800 focus:ring-2 focus:ring-red-100"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black uppercase tracking-wide text-stone-700">
                  Phone Number
                </span>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  placeholder="989-555-1234"
                  autoComplete="tel"
                  className="mt-2 w-full rounded-lg border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-red-800 focus:ring-2 focus:ring-red-100"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black uppercase tracking-wide text-stone-700">
                  Drop-Off Date
                </span>
                <input
                  type="date"
                  value={dropoffDate}
                  onChange={(event) => setDropoffDate(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-red-800 focus:ring-2 focus:ring-red-100"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black uppercase tracking-wide text-stone-700">
                  Drop-Off Time
                </span>
                <input
                  type="time"
                  value={dropoffTime}
                  onChange={(event) => setDropoffTime(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-red-800 focus:ring-2 focus:ring-red-100"
                />
                {dropoffTime ? (
                  <p className="mt-2 text-sm font-bold text-stone-500">
                    {formatTime12Hour(dropoffTime)}
                  </p>
                ) : null}
              </label>
            </div>

            <div>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-stone-700">
                    Animals
                  </p>
                  <p className="mt-1 text-sm text-stone-500">
                    Leave a species at 0 if they are not bringing any.
                  </p>
                </div>

                <div className="rounded-full bg-stone-950 px-4 py-2 text-sm font-black text-white">
                  Total: {totalAnimals}
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {(
                  [
                    ["beef", "Beef"],
                    ["pork", "Pork"],
                    ["sheep", "Sheep"],
                    ["goat", "Goats"],
                  ] as Array<[Species, string]>
                ).map(([species, label]) => (
                  <label
                    key={species}
                    className="rounded-lg border border-stone-200 bg-stone-50 p-4"
                  >
                    <span className="block text-sm font-black uppercase tracking-wide text-stone-700">
                      {label}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      value={quantities[species]}
                      onChange={(event) =>
                        updateQuantity(species, event.target.value)
                      }
                      className="mt-2 w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-xl font-black outline-none transition focus:border-red-800 focus:ring-2 focus:ring-red-100"
                    />
                  </label>
                ))}
              </div>
            </div>

            {message ? (
              <div
                className={`rounded-lg border px-4 py-3 font-semibold ${
                  message.startsWith("Scheduled")
                    ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                    : message.startsWith("Adding")
                      ? "border-stone-300 bg-stone-50 text-stone-800"
                      : "border-red-300 bg-red-50 text-red-900"
                }`}
              >
                {message}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-red-800 px-5 py-4 text-lg font-black uppercase tracking-wide text-white transition hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {saving ? "Adding to Schedule..." : "Schedule Animals"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}