"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

const animals = [
  ["beef", "Beef"],
  ["pork", "Pork"],
  ["sheep", "Sheep"],
  ["goat", "Goat"],
] as const;

function today() {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

export default function FairAnimalsPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [animalType, setAnimalType] = useState("beef");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function checkAuth() {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        router.replace("/login");
        return;
      }

      setChecking(false);
    }

    void checkAuth();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const customerName = name.trim();
    const customerPhone = phone.trim();

    if (!customerName) {
      setMessage("Enter the customer's name.");
      return;
    }

    if (!customerPhone) {
      setMessage("Enter the customer's phone number.");
      return;
    }

    setSaving(true);
    setMessage("Creating cut sheet...");

    try {
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .insert({
          name: customerName,
          phone: customerPhone,
          email: null,
        })
        .select("id")
        .single();

      if (customerError || !customer) {
        throw new Error(customerError?.message || "Could not create customer.");
      }

      const date = today();

      // Hidden fair record. The dashboard excludes booking_type = fair from the calendar.
      const { data: appointment, error: appointmentError } = await supabase
        .from("appointments")
        .insert({
          booking_type: "fair",
          animal_type: animalType,
          processing_week: date,
          dropoff_date: date,
          dropoff_time: "12:00",
          customer_id: customer.id,
        })
        .select("id")
        .single();

      if (appointmentError || !appointment) {
        throw new Error(appointmentError?.message || "Could not create fair animal.");
      }

      const { data: animal, error: animalError } = await supabase
        .from("animals")
        .insert({
          appointment_id: appointment.id,
          animal_type: animalType,
          animal_number: 1,
          status: "scheduled",
        })
        .select("id")
        .single();

      if (animalError || !animal) {
        throw new Error(animalError?.message || "Could not create animal.");
      }

      const { data: cutSheet, error: cutSheetError } = await supabase
        .from("cut_sheets")
        .insert({
          animal_id: animal.id,
          customer_id: customer.id,
          animal_type: animalType,
          unlocked: true,
          form_data: {
            customer_name: customerName,
            phone_number: customerPhone,
            fair_animal: true,
          },
        })
        .select("secure_token")
        .single();

      if (cutSheetError || !cutSheet?.secure_token) {
        throw new Error(cutSheetError?.message || "Could not create cut sheet.");
      }

      router.push(`/cut-sheet/${cutSheet.secure_token}`);
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error
          ? `Could not create fair animal: ${error.message}`
          : "Could not create fair animal.",
      );
      setSaving(false);
    }
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-100">
        <p className="font-bold">Checking administrator access...</p>
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
            <h1 className="mt-2 text-3xl font-black uppercase">Fair Animals</h1>
          </div>

          <Link
            href="/admin"
            className="rounded-md bg-red-800 px-4 py-3 text-sm font-bold hover:bg-red-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-10">
        <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-black uppercase">New Fair Animal</h2>

          <p className="mt-2 text-stone-600">
            Enter the customer, select the animal, then open and fill out the cut sheet.
          </p>

          {message ? (
            <div className="mt-5 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 font-semibold text-amber-950">
              {message}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-7 space-y-6">
            <label className="block">
              <span className="text-sm font-black uppercase tracking-wide">
                Customer Name
              </span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 w-full rounded-md border border-stone-300 px-4 py-3 text-lg outline-none focus:border-red-800"
                placeholder="Customer name"
              />
            </label>

            <label className="block">
              <span className="text-sm font-black uppercase tracking-wide">
                Phone Number
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="mt-2 w-full rounded-md border border-stone-300 px-4 py-3 text-lg outline-none focus:border-red-800"
                placeholder="(989) 555-1234"
              />
            </label>

            <fieldset>
              <legend className="text-sm font-black uppercase tracking-wide">
                Animal
              </legend>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {animals.map(([value, label]) => (
                  <label
                    key={value}
                    className={`cursor-pointer rounded-lg border p-4 ${
                      animalType === value
                        ? "border-red-800 bg-red-50"
                        : "border-stone-300 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="animalType"
                      value={value}
                      checked={animalType === value}
                      onChange={(event) => setAnimalType(event.target.value)}
                      className="mr-3"
                    />
                    <span className="font-black">{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-md bg-red-800 px-6 py-4 font-black uppercase tracking-wide text-white hover:bg-red-700 disabled:opacity-60"
            >
              {saving ? "Creating Cut Sheet..." : "Create & Open Cut Sheet"}
            </button>
          </form>

          <div className="mt-7 border-t border-stone-200 pt-5">
            <Link
              href="/admin/cut-sheets"
              className="font-bold text-red-800 underline underline-offset-4"
            >
              Open Cut Sheets
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}