"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type Species = "beef" | "pork" | "sheep" | "goat";

type Booking = {
  date: string;
  time: string;
  name: string;
  phone: string;
  species: Species;
  quantity: number;
};

const BOOKINGS: Booking[] = [
  // September 1, 2026
  { date: "2026-09-01", time: "08:00", name: "Jerry Rosen", phone: "517-281-9338", species: "beef", quantity: 3 },
  { date: "2026-09-01", time: "08:00", name: "Vince Upton", phone: "989-640-2596", species: "beef", quantity: 2 },
  { date: "2026-09-01", time: "08:00", name: "Josh Miller", phone: "989-429-4647", species: "beef", quantity: 2 },
  { date: "2026-09-01", time: "08:00", name: "Jeff Riley", phone: "989-280-9900", species: "beef", quantity: 3 },
  { date: "2026-09-01", time: "08:00", name: "Jeremy Morgan", phone: "810-691-6281", species: "beef", quantity: 1 },
  { date: "2026-09-01", time: "08:00", name: "Dan Mose", phone: "313-617-4878", species: "beef", quantity: 2 },
  { date: "2026-09-01", time: "08:00", name: "Austin Chludill", phone: "989-494-2621", species: "beef", quantity: 2 },
  { date: "2026-09-01", time: "08:00", name: "Ryan Zelinko", phone: "989-284-3109", species: "beef", quantity: 4 },

  { date: "2026-09-01", time: "08:00", name: "Amanda Mrva", phone: "989-666-2118", species: "pork", quantity: 1 },
  { date: "2026-09-01", time: "08:00", name: "Stone Morgan", phone: "810-445-9337", species: "pork", quantity: 1 },
  { date: "2026-09-01", time: "08:00", name: "Jeremy Morgan", phone: "810-691-6281", species: "sheep", quantity: 1 },
  { date: "2026-09-01", time: "08:00", name: "Brook Wells", phone: "517-927-9313", species: "pork", quantity: 2 },
  { date: "2026-09-01", time: "08:00", name: "Justin Kurney", phone: "989-239-1402", species: "pork", quantity: 1 },
  { date: "2026-09-01", time: "08:00", name: "John Lehman", phone: "517-719-9427", species: "sheep", quantity: 1 },

  // September 8, 2026
  { date: "2026-09-08", time: "08:00", name: "Sam Reynolds", phone: "", species: "beef", quantity: 5 },
  { date: "2026-09-08", time: "08:00", name: "Jerry Rosen", phone: "517-281-9338", species: "beef", quantity: 3 },
  { date: "2026-09-08", time: "08:00", name: "Jack Oesterreicher", phone: "989-429-2499 / 989-429-2482", species: "beef", quantity: 4 },
  { date: "2026-09-08", time: "08:00", name: "Josh Miller", phone: "989-429-4647", species: "beef", quantity: 2 },
  { date: "2026-09-08", time: "08:00", name: "Brian Kiesling", phone: "989-413-0127", species: "pork", quantity: 3 },
  { date: "2026-09-08", time: "08:00", name: "Tracy Foster", phone: "517-488-3916", species: "pork", quantity: 3 },
  { date: "2026-09-08", time: "08:00", name: "Santine Geitman", phone: "989-280-8639", species: "pork", quantity: 2 },

  // September 15, 2026
  { date: "2026-09-15", time: "08:00", name: "Kyle Godly", phone: "989-277-7409", species: "beef", quantity: 3 },
  { date: "2026-09-15", time: "08:00", name: "Jim Crambell", phone: "", species: "beef", quantity: 3 },
  { date: "2026-09-15", time: "08:00", name: "Ryan Zelinko", phone: "", species: "beef", quantity: 5 },
  { date: "2026-09-15", time: "08:00", name: "Andy Hall", phone: "517-404-0627", species: "beef", quantity: 2 },
  { date: "2026-09-15", time: "08:00", name: "Jeremy Enser", phone: "517-230-4430", species: "beef", quantity: 2 },
  { date: "2026-09-15", time: "08:00", name: "Chris Smith", phone: "517-204-4110", species: "pork", quantity: 6 },
  { date: "2026-09-15", time: "08:00", name: "Tim Kalakay", phone: "810-241-0350", species: "pork", quantity: 2 },

  // September 22, 2026
  { date: "2026-09-22", time: "08:00", name: "Jerry Rosen", phone: "517-281-9338", species: "beef", quantity: 4 },
  { date: "2026-09-22", time: "08:00", name: "Susannah Miller", phone: "989-574-5081", species: "beef", quantity: 1 },
  { date: "2026-09-22", time: "08:00", name: "Mark Gifford", phone: "517-819-0684", species: "beef", quantity: 1 },
  { date: "2026-09-22", time: "08:00", name: "Brad Binger", phone: "989-743-5093", species: "beef", quantity: 1 },
  { date: "2026-09-22", time: "08:00", name: "Will Base", phone: "989-666-3637", species: "beef", quantity: 2 },
  { date: "2026-09-22", time: "08:00", name: "Tim Birchmeier", phone: "989-239-8838", species: "beef", quantity: 1 },
  { date: "2026-09-22", time: "08:00", name: "Dave Crambell", phone: "989-721-6156", species: "beef", quantity: 1 },
  { date: "2026-09-22", time: "08:00", name: "Dale Greenhoe", phone: "989-277-6054", species: "beef", quantity: 1 },
  { date: "2026-09-22", time: "08:00", name: "Mike Cross", phone: "517-376-1808", species: "beef", quantity: 2 },
  { date: "2026-09-22", time: "08:00", name: "Dwayne Leach", phone: "989-640-2932", species: "beef", quantity: 3 },
  { date: "2026-09-22", time: "08:00", name: "Jim Richardson", phone: "989-413-3995", species: "beef", quantity: 1 },
  { date: "2026-09-22", time: "08:00", name: "Rodney Fowler", phone: "989-302-2299", species: "beef", quantity: 1 },
  { date: "2026-09-22", time: "08:00", name: "Leonard Hare", phone: "989-239-6565", species: "beef", quantity: 1 },
  { date: "2026-09-22", time: "08:00", name: "Tim Makie", phone: "989-274-4898", species: "pork", quantity: 3 },
  { date: "2026-09-22", time: "08:00", name: "Charles Struck", phone: "989-323-1504", species: "sheep", quantity: 2 },

  // September 29, 2026
  { date: "2026-09-29", time: "08:00", name: "Livingston Farms", phone: "989-640-7391", species: "beef", quantity: 9 },
  { date: "2026-09-29", time: "08:00", name: "Charles Struck", phone: "989-323-1504", species: "beef", quantity: 1 },
  { date: "2026-09-29", time: "08:00", name: "Will Stewart", phone: "989-717-1721", species: "beef", quantity: 2 },
  { date: "2026-09-29", time: "08:00", name: "Jason Enrigrt", phone: "989-928-2405", species: "beef", quantity: 1 },
  { date: "2026-09-29", time: "08:00", name: "Mike Cross", phone: "517-376-1808", species: "beef", quantity: 2 },
  { date: "2026-09-29", time: "08:00", name: "Tim Kalakay", phone: "810-516-6662", species: "pork", quantity: 6 },
];

function prettySpecies(species: Species) {
  if (species === "pork") return "hog";
  if (species === "sheep") return "lamb";
  return species;
}

export default function ImportSeptemberSchedulePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);

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
    () => BOOKINGS.reduce((sum, booking) => sum + booking.quantity, 0),
    [],
  );

  async function getOrCreateCustomer(name: string, phone: string) {
    let query = supabase
      .from("customers")
      .select("id,name,phone")
      .eq("name", name);

    if (phone) {
      query = query.eq("phone", phone);
    }

    const { data: existingCustomers, error: lookupError } = await query.limit(1);

    if (lookupError) throw lookupError;

    if (existingCustomers && existingCustomers.length > 0) {
      return existingCustomers[0].id;
    }

    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .insert({
        name,
        phone,
        email: null,
      })
      .select("id")
      .single();

    if (customerError || !customer?.id) {
      throw new Error(customerError?.message || `Could not create ${name}.`);
    }

    return customer.id;
  }

  async function appointmentAlreadyExists(
    customerId: string | number,
    booking: Booking,
  ) {
    const { data, error } = await supabase
      .from("appointments")
      .select("id")
      .eq("customer_id", customerId)
      .eq("animal_type", booking.species)
      .eq("dropoff_date", booking.date)
      .limit(1);

    if (error) throw error;
    return Boolean(data && data.length > 0);
  }

  async function importSchedule() {
    if (importing) return;

    const confirmed = window.confirm(
      `This will import ${BOOKINGS.length} appointments containing ${totalAnimals} animals into the live schedule. Existing matching customer/date/species appointments will be skipped. Continue?`,
    );

    if (!confirmed) return;

    setImporting(true);
    setMessage("Importing September schedule...");
    setProgress(0);

    let createdAppointments = 0;
    let createdAnimals = 0;
    let skippedAppointments = 0;

    try {
      for (let index = 0; index < BOOKINGS.length; index += 1) {
        const booking = BOOKINGS[index];

        const customerId = await getOrCreateCustomer(
          booking.name,
          booking.phone,
        );

        const exists = await appointmentAlreadyExists(customerId, booking);

        if (exists) {
          skippedAppointments += 1;
          setProgress(index + 1);
          continue;
        }

        const { data: appointment, error: appointmentError } = await supabase
          .from("appointments")
          .insert({
            booking_type: "farmer",
            animal_type: booking.species,
            processing_week: booking.date,
            dropoff_date: booking.date,
            dropoff_time: booking.time,
            customer_id: customerId,
          })
          .select("id")
          .single();

        if (appointmentError || !appointment?.id) {
          throw new Error(
            appointmentError?.message ||
              `Could not create appointment for ${booking.name}.`,
          );
        }

        const animalRows = Array.from(
          { length: booking.quantity },
          (_, animalIndex) => ({
            appointment_id: appointment.id,
            animal_type: booking.species,
            animal_number: animalIndex + 1,
            status: "scheduled",
          }),
        );

        const { error: animalError } = await supabase
          .from("animals")
          .insert(animalRows);

        if (animalError) {
          await supabase
            .from("appointments")
            .delete()
            .eq("id", appointment.id);

          throw new Error(
            `${booking.name}: ${animalError.message || "Could not create animals."}`,
          );
        }

        createdAppointments += 1;
        createdAnimals += booking.quantity;
        setProgress(index + 1);
      }

      setMessage(
        `Import complete. Created ${createdAppointments} appointments and ${createdAnimals} animals. Skipped ${skippedAppointments} matching appointments already on the schedule.`,
      );
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error
          ? `Import stopped: ${error.message}`
          : "Import stopped because of an unknown error.",
      );
    } finally {
      setImporting(false);
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
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-red-400">
              Apex Custom Butchering
            </p>
            <h1 className="mt-2 text-3xl font-black uppercase">
              September Schedule Import
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

      <div className="mx-auto max-w-5xl px-6 py-8">
        <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-black uppercase tracking-tight">
            One-Time Import
          </h2>
          <p className="mt-2 text-stone-600">
            Imports the September 2026 paper schedule at 8:00 AM. Bryce Moody's
            zero-hog entry is intentionally excluded.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-stone-100 p-4">
              <p className="text-xs font-black uppercase text-stone-500">
                Appointments
              </p>
              <p className="mt-1 text-3xl font-black">{BOOKINGS.length}</p>
            </div>
            <div className="rounded-lg bg-stone-100 p-4">
              <p className="text-xs font-black uppercase text-stone-500">
                Animals
              </p>
              <p className="mt-1 text-3xl font-black">{totalAnimals}</p>
            </div>
            <div className="rounded-lg bg-stone-100 p-4">
              <p className="text-xs font-black uppercase text-stone-500">
                Progress
              </p>
              <p className="mt-1 text-3xl font-black">
                {progress}/{BOOKINGS.length}
              </p>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-lg border border-stone-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-stone-950 text-white">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Animal</th>
                  <th className="px-4 py-3">Qty</th>
                </tr>
              </thead>
              <tbody>
                {BOOKINGS.map((booking, index) => (
                  <tr
                    key={`${booking.date}-${booking.name}-${booking.species}-${index}`}
                    className="border-t border-stone-200"
                  >
                    <td className="whitespace-nowrap px-4 py-3">
                      {booking.date}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-bold">
                      {booking.name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {booking.phone || "No phone listed"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 capitalize">
                      {prettySpecies(booking.species)}
                    </td>
                    <td className="px-4 py-3 font-black">{booking.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {message ? (
            <div className="mt-6 rounded-lg border border-stone-300 bg-stone-50 px-4 py-3 font-semibold">
              {message}
            </div>
          ) : null}

          <button
            type="button"
            onClick={importSchedule}
            disabled={importing}
            className="mt-6 rounded-lg bg-red-800 px-6 py-4 text-lg font-black uppercase tracking-wide text-white transition hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {importing ? "Importing Schedule..." : "Import September Schedule"}
          </button>
        </section>
      </div>
    </main>
  );
}