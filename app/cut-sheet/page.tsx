"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type CutSheetResult = {
  id: string;
  secure_token: string;
  animal_type: string;
  unlocked: boolean;
  submitted_at: string | null;
  customers:
    | { name: string | null; phone: string | null }
    | Array<{ name: string | null; phone: string | null }>
    | null;
};

function firstCustomer(value: CutSheetResult["customers"]) {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function titleCase(value: string) {
  return value
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export default function PublicCutSheetLookupPage() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<CutSheetResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [searched, setSearched] = useState(false);

  async function searchCustomers(event?: FormEvent) {
    event?.preventDefault();

    const query = search.trim();
    if (!query) {
      setResults([]);
      setMessage("Enter your name or phone number to search for your cut sheet.");
      setSearched(false);
      return;
    }

    setLoading(true);
    setMessage("");
    setSearched(true);

    const { data, error } = await supabase
      .from("cut_sheets")
      .select(`
        id,
        secure_token,
        animal_type,
        unlocked,
        submitted_at,
        customers (name, phone)
      `)
      .eq("unlocked", true)
      .order("submitted_at", { ascending: true, nullsFirst: true });

    if (error) {
      console.error(error);
      setResults([]);
      setMessage(`We could not search for your cut sheet: ${error.message}`);
      setLoading(false);
      return;
    }

    const normalizedQuery = query.toLowerCase();
    const queryDigits = normalizePhone(query);

    const matches = ((data ?? []) as unknown as CutSheetResult[]).filter((sheet) => {
      const customer = firstCustomer(sheet.customers);
      const name = String(customer?.name ?? "").toLowerCase();
      const phone = String(customer?.phone ?? "");

      return (
        name.includes(normalizedQuery) ||
        (queryDigits.length > 0 && normalizePhone(phone).includes(queryDigits))
      );
    });

    setResults(matches);
    if (!matches.length) {
      setMessage(
        "We could not find a cut sheet with that name or phone number. Make sure the information is entered the same way it was given to Apex Custom Butchering.",
      );
    }

    setLoading(false);
  }

  const resultCountText = useMemo(() => {
    if (!searched || loading) return "";
    if (results.length === 1) return "1 Cut Sheet Found";
    return `${results.length} Cut Sheets Found`;
  }, [loading, results.length, searched]);

  return (
    <main className="min-h-screen bg-stone-100 text-stone-950">
      <header className="bg-stone-950 text-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-6">
          <Link href="/" className="font-black uppercase tracking-[0.16em]">
            Apex Custom Butchering
          </Link>
          <Link
            href="/schedule"
            className="rounded-md bg-red-800 px-4 py-3 text-sm font-bold hover:bg-red-700"
          >
            Schedule Processing
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-red-800">
              Customer Portal
            </p>
            <h1 className="mt-3 text-4xl font-black uppercase tracking-tight sm:text-5xl">
              Fill Out Your Cut Sheet
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-stone-600">
              Enter your name or phone number below. If you have a cut sheet on
              file with Apex Custom Butchering, you can open it and enter your
              cut preferences.
            </p>
          </div>

          <form onSubmit={searchCustomers} className="mt-8">
            <label className="block">
              <span className="text-sm font-black uppercase tracking-wide">
                Your Name or Phone Number
              </span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="John Smith or 989-555-1234"
                autoComplete="name"
                className="mt-2 w-full rounded-lg border border-stone-300 px-4 py-4 text-lg outline-none focus:border-red-800 focus:ring-2 focus:ring-red-100"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full rounded-lg bg-red-800 px-6 py-4 text-lg font-black uppercase tracking-wide text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Searching..." : "Find My Cut Sheet"}
            </button>
          </form>

          {message ? (
            <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-4 font-semibold text-amber-950">
              {message}
            </div>
          ) : null}

          {resultCountText ? (
            <p className="mt-7 text-sm font-bold uppercase tracking-wide text-stone-500">
              {resultCountText}
            </p>
          ) : null}

          {results.length ? (
            <div className="mt-4 space-y-3">
              {results.map((sheet) => {
                const customer = firstCustomer(sheet.customers);
                const submitted = Boolean(sheet.submitted_at);

                return (
                  <Link
                    key={sheet.id}
                    href={`/cut-sheet/${sheet.secure_token}`}
                    className="block rounded-xl border border-stone-200 bg-stone-50 p-5 transition hover:-translate-y-0.5 hover:border-red-800 hover:bg-white hover:shadow-sm"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-xl font-black">
                          {customer?.name || "Customer"}
                        </h2>
                        <p className="mt-1 font-semibold text-stone-600">
                          {customer?.phone || "Phone not listed"}
                        </p>
                        <p className="mt-2 text-sm font-bold uppercase tracking-wide text-red-800">
                          {titleCase(sheet.animal_type)} Cut Sheet
                        </p>
                        <p className="mt-1 text-xs font-bold uppercase tracking-wide text-stone-500">
                          {submitted ? "Submitted" : "Ready to Fill Out"}
                        </p>
                      </div>

                      <span className="inline-flex items-center justify-center rounded-md bg-red-800 px-5 py-3 text-sm font-black uppercase tracking-wide text-white">
                        Open Cut Sheet
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : null}

          <div className="mt-8 border-t border-stone-200 pt-6 text-center text-sm text-stone-500">
            If you do not see your cut sheet, contact Apex Custom Butchering.
          </div>
        </section>
      </div>
    </main>
  );
}