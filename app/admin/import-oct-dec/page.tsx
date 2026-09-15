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
  note?: string;
};

const BOOKINGS: Booking[] = [
  {
    "date": "2026-10-06",
    "time": "08:00",
    "name": "Jeremy Joray",
    "phone": "",
    "species": "beef",
    "quantity": 3
  },
  {
    "date": "2026-10-06",
    "time": "08:00",
    "name": "Rick Myzack",
    "phone": "517-993-2068",
    "species": "beef",
    "quantity": 3
  },
  {
    "date": "2026-10-06",
    "time": "08:00",
    "name": "Andy Briskel",
    "phone": "989-464-7952",
    "species": "beef",
    "quantity": 1
  },
  {
    "date": "2026-10-06",
    "time": "08:00",
    "name": "Will Stewart",
    "phone": "989-717-1721",
    "species": "beef",
    "quantity": 1
  },
  {
    "date": "2026-10-06",
    "time": "08:00",
    "name": "Will Base",
    "phone": "989-666-3637",
    "species": "beef",
    "quantity": 2
  },
  {
    "date": "2026-10-06",
    "time": "08:00",
    "name": "Jim Crambell",
    "phone": "989-798-3791",
    "species": "beef",
    "quantity": 2
  },
  {
    "date": "2026-10-06",
    "time": "08:00",
    "name": "Jeff Vogl",
    "phone": "989-666-1445",
    "species": "beef",
    "quantity": 1
  },
  {
    "date": "2026-10-06",
    "time": "08:00",
    "name": "Kirk Otto",
    "phone": "989-413-7756",
    "species": "beef",
    "quantity": 2
  },
  {
    "date": "2026-10-06",
    "time": "08:00",
    "name": "Mike Warner",
    "phone": "810-836-7203",
    "species": "pork",
    "quantity": 3
  },
  {
    "date": "2026-10-06",
    "time": "08:00",
    "name": "David Roach",
    "phone": "989-339-7163",
    "species": "pork",
    "quantity": 4
  },
  {
    "date": "2026-10-13",
    "time": "08:00",
    "name": "Jim Crambell",
    "phone": "",
    "species": "beef",
    "quantity": 4
  },
  {
    "date": "2026-10-13",
    "time": "08:00",
    "name": "Jim Wilkinson",
    "phone": "989-277-8477",
    "species": "beef",
    "quantity": 2
  },
  {
    "date": "2026-10-13",
    "time": "08:00",
    "name": "Will Base",
    "phone": "989-666-3637",
    "species": "beef",
    "quantity": 1
  },
  {
    "date": "2026-10-13",
    "time": "08:00",
    "name": "Carl Bruse",
    "phone": "989-615-7406",
    "species": "beef",
    "quantity": 4
  },
  {
    "date": "2026-10-13",
    "time": "08:00",
    "name": "Kathy Sparks",
    "phone": "989-627-3682",
    "species": "beef",
    "quantity": 2
  },
  {
    "date": "2026-10-13",
    "time": "08:00",
    "name": "Joe Mellentine",
    "phone": "517-230-8057",
    "species": "beef",
    "quantity": 1
  },
  {
    "date": "2026-10-13",
    "time": "08:00",
    "name": "John Fox",
    "phone": "989-802-4909",
    "species": "pork",
    "quantity": 3
  },
  {
    "date": "2026-10-20",
    "time": "08:00",
    "name": "Sam Reynolds",
    "phone": "",
    "species": "beef",
    "quantity": 5
  },
  {
    "date": "2026-10-20",
    "time": "08:00",
    "name": "Heather Salazar",
    "phone": "989-484-3076",
    "species": "beef",
    "quantity": 1
  },
  {
    "date": "2026-10-20",
    "time": "08:00",
    "name": "Kirk Otto",
    "phone": "989-413-7756",
    "species": "beef",
    "quantity": 2
  },
  {
    "date": "2026-10-20",
    "time": "08:00",
    "name": "Andy Hall",
    "phone": "989-643-5438",
    "species": "beef",
    "quantity": 1
  },
  {
    "date": "2026-10-20",
    "time": "08:00",
    "name": "Osmond Smith",
    "phone": "989-666-8502",
    "species": "beef",
    "quantity": 1
  },
  {
    "date": "2026-10-20",
    "time": "08:00",
    "name": "Ron Riley",
    "phone": "989-666-5777",
    "species": "beef",
    "quantity": 1
  },
  {
    "date": "2026-10-20",
    "time": "08:00",
    "name": "Will Stewart",
    "phone": "989-717-1721",
    "species": "beef",
    "quantity": 1
  },
  {
    "date": "2026-10-20",
    "time": "08:00",
    "name": "Jon Crambell",
    "phone": "989-277-0199",
    "species": "beef",
    "quantity": 3
  },
  {
    "date": "2026-10-27",
    "time": "08:00",
    "name": "Larry Senk",
    "phone": "",
    "species": "beef",
    "quantity": 5
  },
  {
    "date": "2026-10-27",
    "time": "08:00",
    "name": "Katrina Burtch",
    "phone": "",
    "species": "beef",
    "quantity": 8
  },
  {
    "date": "2026-10-27",
    "time": "08:00",
    "name": "Jeff Colley",
    "phone": "989-640-4202",
    "species": "beef",
    "quantity": 1
  },
  {
    "date": "2026-10-27",
    "time": "08:00",
    "name": "Mike brcic",
    "phone": "248-635-7408",
    "species": "pork",
    "quantity": 2,
    "note": "Only kill and Hang"
  },
  {
    "date": "2026-10-27",
    "time": "08:00",
    "name": "Chris Thomas",
    "phone": "989-445-0506",
    "species": "pork",
    "quantity": 4
  },
  {
    "date": "2026-11-03",
    "time": "08:00",
    "name": "Jeremy Joray",
    "phone": "",
    "species": "beef",
    "quantity": 3
  },
  {
    "date": "2026-11-10",
    "time": "08:00",
    "name": "Terry Hanson",
    "phone": "719-271-3207",
    "species": "sheep",
    "quantity": 5
  },
  {
    "date": "2026-12-01",
    "time": "08:00",
    "name": "Dwayne Leach",
    "phone": "989-640-2932",
    "species": "beef",
    "quantity": 1
  },
  {
    "date": "2026-12-01",
    "time": "08:00",
    "name": "Mike Wachowicz",
    "phone": "810-923-3068",
    "species": "beef",
    "quantity": 1
  },
  {
    "date": "2026-12-01",
    "time": "08:00",
    "name": "Jon Crambell",
    "phone": "989-277-0199",
    "species": "beef",
    "quantity": 3
  },
  {
    "date": "2026-12-01",
    "time": "08:00",
    "name": "Jane Cassassa",
    "phone": "989-710-7496",
    "species": "beef",
    "quantity": 3
  },
  {
    "date": "2026-12-01",
    "time": "08:00",
    "name": "Dan Mose",
    "phone": "313-617-4878",
    "species": "beef",
    "quantity": 1
  },
  {
    "date": "2026-12-01",
    "time": "08:00",
    "name": "Larry Billings",
    "phone": "989-640-5863",
    "species": "beef",
    "quantity": 2
  },
  {
    "date": "2026-12-01",
    "time": "08:00",
    "name": "Dave Crambell",
    "phone": "989-721-6156",
    "species": "beef",
    "quantity": 1
  },
  {
    "date": "2026-12-01",
    "time": "08:00",
    "name": "Nick Thiel",
    "phone": "989-323-9600",
    "species": "beef",
    "quantity": 1
  },
  {
    "date": "2026-12-01",
    "time": "08:00",
    "name": "Terry Hanson",
    "phone": "719-271-3207",
    "species": "sheep",
    "quantity": 5
  },
  {
    "date": "2026-12-08",
    "time": "08:00",
    "name": "Larry Senk",
    "phone": "",
    "species": "beef",
    "quantity": 3
  },
  {
    "date": "2026-12-08",
    "time": "08:00",
    "name": "Jim Crambell",
    "phone": "",
    "species": "beef",
    "quantity": 4
  },
  {
    "date": "2026-12-08",
    "time": "08:00",
    "name": "Ryan Zelinko",
    "phone": "989-284-3109",
    "species": "beef",
    "quantity": 3
  },
  {
    "date": "2026-12-15",
    "time": "08:00",
    "name": "Jack Oesterreicher",
    "phone": "989-429-2499",
    "species": "beef",
    "quantity": 4
  },
  {
    "date": "2026-12-29",
    "time": "08:00",
    "name": "Kristy Reidsma",
    "phone": "517-230-3738",
    "species": "beef",
    "quantity": 2
  },
  {
    "date": "2026-12-29",
    "time": "08:00",
    "name": "Justin Fergeson",
    "phone": "810-691-5580",
    "species": "beef",
    "quantity": 4
  }
];

export default function ImportOctDecSchedulePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let active = true;
    async function checkAccess() {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!active) return;
      if (error || !user) {
        router.replace("/login");
        return;
      }
      setChecking(false);
    }
    checkAccess();
    return () => { active = false; };
  }, [router]);

  const totalAnimals = useMemo(
    () => BOOKINGS.reduce((sum, booking) => sum + booking.quantity, 0),
    [],
  );

  async function getOrCreateCustomer(name: string, phone: string) {
    let query = supabase.from("customers").select("id,name,phone").eq("name", name);
    if (phone) query = query.eq("phone", phone);

    const { data: existing, error: lookupError } = await query.limit(1);
    if (lookupError) throw lookupError;
    if (existing && existing.length > 0) return existing[0].id;

    const { data: customer, error } = await supabase
      .from("customers")
      .insert({ name, phone, email: null })
      .select("id")
      .single();

    if (error || !customer?.id) {
      throw new Error(error?.message || `Could not create ${name}.`);
    }
    return customer.id;
  }

  async function appointmentAlreadyExists(customerId: string | number, booking: Booking) {
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
      `This will import ${BOOKINGS.length} appointments containing ${totalAnimals} animals for October through December 2026. Matching appointments will be skipped. Continue?`
    );
    if (!confirmed) return;

    setImporting(true);
    setMessage("Importing October through December schedule...");
    setProgress(0);

    let createdAppointments = 0;
    let createdAnimals = 0;
    let skippedAppointments = 0;

    try {
      for (let index = 0; index < BOOKINGS.length; index += 1) {
        const booking = BOOKINGS[index];
        const customerId = await getOrCreateCustomer(booking.name, booking.phone);

        if (await appointmentAlreadyExists(customerId, booking)) {
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
          throw new Error(appointmentError?.message || `Could not create appointment for ${booking.name}.`);
        }

        const animalRows = Array.from({ length: booking.quantity }, (_, animalIndex) => ({
          appointment_id: appointment.id,
          animal_type: booking.species,
          animal_number: animalIndex + 1,
          status: "scheduled",
        }));

        const { error: animalError } = await supabase.from("animals").insert(animalRows);

        if (animalError) {
          await supabase.from("appointments").delete().eq("id", appointment.id);
          throw new Error(`${booking.name}: ${animalError.message || "Could not create animals."}`);
        }

        createdAppointments += 1;
        createdAnimals += booking.quantity;
        setProgress(index + 1);
      }

      setMessage(
        `Import complete. Created ${createdAppointments} appointments and ${createdAnimals} animals. Skipped ${skippedAppointments} matching appointments already on the schedule.`
      );
    } catch (error) {
      console.error(error);
      setMessage(error instanceof Error ? `Import stopped: ${error.message}` : "Import stopped because of an unknown error.");
    } finally {
      setImporting(false);
    }
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-100 px-6">
        <div className="rounded-lg bg-white px-8 py-6 text-center shadow-sm">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-red-800" />
          <p className="mt-4 font-semibold text-stone-700">Checking administrator access...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-100 text-stone-950">
      <header className="bg-stone-950 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-red-400">Apex Custom Butchering</p>
            <h1 className="mt-2 text-3xl font-black uppercase">October-December Import</h1>
          </div>
          <Link href="/admin" className="rounded-md border border-white/20 px-4 py-2 text-sm font-bold transition hover:bg-white hover:text-stone-950">
            Back to Admin
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-black uppercase tracking-tight">One-Time Import</h2>
          <p className="mt-2 text-stone-600">
            Imports the October, November, and December 2026 paper schedules at 8:00 AM. Katrina Burtch is set to 8 beef.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-stone-100 p-4"><p className="text-xs font-black uppercase text-stone-500">Appointments</p><p className="mt-1 text-3xl font-black">{BOOKINGS.length}</p></div>
            <div className="rounded-lg bg-stone-100 p-4"><p className="text-xs font-black uppercase text-stone-500">Animals</p><p className="mt-1 text-3xl font-black">{totalAnimals}</p></div>
            <div className="rounded-lg bg-stone-100 p-4"><p className="text-xs font-black uppercase text-stone-500">Progress</p><p className="mt-1 text-3xl font-black">{progress}/{BOOKINGS.length}</p></div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-lg border border-stone-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-stone-950 text-white">
                <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Species</th><th className="px-4 py-3">Qty</th><th className="px-4 py-3">Note</th></tr>
              </thead>
              <tbody>
                {BOOKINGS.map((booking, index) => (
                  <tr key={`${booking.date}-${booking.name}-${booking.species}-${index}`} className="border-t border-stone-200">
                    <td className="whitespace-nowrap px-4 py-3">{booking.date}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-bold">{booking.name}</td>
                    <td className="whitespace-nowrap px-4 py-3">{booking.phone || "No phone listed"}</td>
                    <td className="whitespace-nowrap px-4 py-3 capitalize">{booking.species}</td>
                    <td className="px-4 py-3 font-black">{booking.quantity}</td>
                    <td className="px-4 py-3">{booking.note || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {message ? <div className="mt-6 rounded-lg border border-stone-300 bg-stone-50 px-4 py-3 font-semibold">{message}</div> : null}

          <button type="button" onClick={importSchedule} disabled={importing} className="mt-6 rounded-lg bg-red-800 px-6 py-4 text-lg font-black uppercase tracking-wide text-white transition hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-60">
            {importing ? "Importing Schedule..." : "Import October-December Schedule"}
          </button>
        </section>
      </div>
    </main>
  );
}