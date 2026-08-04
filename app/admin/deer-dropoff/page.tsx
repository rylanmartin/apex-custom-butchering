"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type DeerCutSheet = {
  id: string;
  secure_token: string;
  customer_name: string;
  phone: string;
  submitted_at: string | null;
  created_at: string;
  form_data: Record<string, unknown> | null;
};

const supabase = createClient();

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function customerLink(token: string) {
  if (typeof window === "undefined") return `/deer-cut-sheet/${token}`;
  return `${window.location.origin}/deer-cut-sheet/${token}`;
}

function customerMessage(sheet: DeerCutSheet) {
  return `Hello ${sheet.customer_name}, your deer that you dropped off at Apex Custom Butchering is waiting for a cut sheet. Please complete your cut order here: ${customerLink(sheet.secure_token)}`;
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = value;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.focus();
    area.select();
    const copied = document.execCommand("copy");
    area.remove();
    return copied;
  }
}

export default function DeerDropOffPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sheets, setSheets] = useState<DeerCutSheet[]>([]);
  const [createdSheet, setCreatedSheet] = useState<DeerCutSheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadSheets() {
    const { data, error } = await supabase
      .from("deer_cut_sheets")
      .select(
        "id, secure_token, customer_name, phone, submitted_at, created_at, form_data",
      )
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`Could not load deer drop-offs: ${error.message}`);
      setSheets([]);
    } else {
      setSheets((data ?? []) as DeerCutSheet[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    let active = true;

    async function initialize() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!active) return;
      if (error || !user) {
        router.replace("/login");
        return;
      }
      await loadSheets();
    }

    initialize();
    return () => {
      active = false;
    };
  }, [router]);

  const waiting = useMemo(
    () => sheets.filter((sheet) => !sheet.submitted_at),
    [sheets],
  );
  const submitted = useMemo(
    () => sheets.filter((sheet) => Boolean(sheet.submitted_at)),
    [sheets],
  );

  async function createDropOff() {
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    if (!cleanName || !cleanPhone) {
      setMessage("Enter the customer's name and phone number first.");
      return;
    }

    setSaving(true);
    setMessage("Creating the deer cut sheet...");
    setCreatedSheet(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      router.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("deer_cut_sheets")
      .insert({
        customer_name: cleanName,
        phone: cleanPhone,
        created_by: user.id,
        form_data: {},
      })
      .select(
        "id, secure_token, customer_name, phone, submitted_at, created_at, form_data",
      )
      .single();

    if (error || !data) {
      setSaving(false);
      setMessage(
        `Could not create the deer cut sheet: ${error?.message || "Unknown error"}`,
      );
      return;
    }

    const sheet = data as DeerCutSheet;
    const copied = await copyText(customerMessage(sheet));
    setCreatedSheet(sheet);
    setName("");
    setPhone("");
    setSaving(false);
    setMessage(
      copied
        ? "Deer cut sheet created and the customer message was copied. Paste it into Messages and send it."
        : "Deer cut sheet created. Use Copy Message below before sending it.",
    );
    await loadSheets();
  }

  async function copyMessage(sheet: DeerCutSheet) {
    const copied = await copyText(customerMessage(sheet));
    setMessage(
      copied
        ? `Message copied for ${sheet.customer_name}. Paste it into Messages and send it to ${sheet.phone}.`
        : "The message could not be copied automatically. Select the message and copy it manually.",
    );
  }

  return (
    <main className="min-h-screen bg-stone-100 text-stone-950">
      <header className="bg-stone-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-red-500">
              Apex Custom Butchering
            </p>
            <h1 className="mt-2 font-serif text-4xl font-black">
              Deer Drop-Off
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/cut-sheets"
              className="rounded-md border border-white/25 px-4 py-3 text-sm font-bold transition hover:bg-white hover:text-stone-950"
            >
              Customer Cut Sheets
            </Link>
            <Link
              href="/admin"
              className="rounded-md bg-red-800 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)]">
        <section className="h-fit rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-800">
            New Deer
          </p>
          <h2 className="mt-2 font-serif text-3xl font-black">
            Create Customer Cut Sheet
          </h2>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            Enter the drop-off information. The customer&apos;s name and phone
            number will already be filled in when they open their cut sheet.
          </p>

          <div className="mt-6 space-y-5">
            <label className="block">
              <span className="text-sm font-bold">Customer Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                className="mt-2 w-full rounded-md border border-stone-300 px-4 py-3 outline-none transition focus:border-red-700 focus:ring-2 focus:ring-red-100"
                placeholder="Customer name"
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold">Phone Number</span>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                autoComplete="tel"
                inputMode="tel"
                className="mt-2 w-full rounded-md border border-stone-300 px-4 py-3 outline-none transition focus:border-red-700 focus:ring-2 focus:ring-red-100"
                placeholder="(989) 555-1234"
              />
            </label>
            <button
              type="button"
              onClick={createDropOff}
              disabled={saving}
              className="w-full rounded-md bg-red-800 px-5 py-4 font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Creating..." : "Create Cut Sheet & Copy Text"}
            </button>
          </div>

          {message ? (
            <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-950">
              {message}
            </div>
          ) : null}

          {createdSheet ? (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-5">
              <p className="font-black">
                Ready for {createdSheet.customer_name}
              </p>
              <p className="mt-1 text-sm text-stone-700">
                Send to: {createdSheet.phone}
              </p>
              <textarea
                readOnly
                value={customerMessage(createdSheet)}
                className="mt-4 h-36 w-full resize-none rounded-md border border-red-200 bg-white p-3 text-sm leading-6"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => copyMessage(createdSheet)}
                  className="rounded-md bg-stone-950 px-4 py-2 text-sm font-bold text-white"
                >
                  Copy Message Again
                </button>
                <a
                  href={customerLink(createdSheet.secure_token)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-bold"
                >
                  Open Cut Sheet
                </a>
              </div>
            </div>
          ) : null}
        </section>

        <section className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-red-800 p-6 text-white shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-100">
                Waiting on Customer
              </p>
              <p className="mt-2 text-4xl font-black">{waiting.length}</p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-600">
                Submitted Deer Orders
              </p>
              <p className="mt-2 text-4xl font-black">{submitted.length}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-stone-200 px-6 py-5">
              <div>
                <h2 className="font-serif text-2xl font-black">
                  Deer Cut Sheets
                </h2>
                <p className="mt-1 text-sm text-stone-600">
                  Waiting and submitted orders stay together here.
                </p>
              </div>
              <button
                type="button"
                onClick={loadSheets}
                className="rounded-md border border-stone-300 px-4 py-2 text-sm font-bold"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <p className="px-6 py-14 text-center font-bold text-stone-500">
                Loading deer drop-offs...
              </p>
            ) : sheets.length ? (
              <div className="divide-y divide-stone-200">
                {sheets.map((sheet) => (
                  <article
                    key={sheet.id}
                    className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-black">
                          {sheet.customer_name}
                        </h3>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${sheet.submitted_at ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-900"}`}
                        >
                          {sheet.submitted_at ? "Submitted" : "Waiting"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-stone-600">
                        {sheet.phone} · Dropped off{" "}
                        {formatDate(sheet.created_at)}
                      </p>
                      {sheet.submitted_at ? (
                        <p className="mt-1 text-sm font-semibold text-green-800">
                          Submitted {formatDate(sheet.submitted_at)}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!sheet.submitted_at ? (
                        <button
                          type="button"
                          onClick={() => copyMessage(sheet)}
                          className="rounded-md border border-stone-300 px-4 py-2 text-sm font-bold"
                        >
                          Copy Message
                        </button>
                      ) : null}
                      <a
                        href={customerLink(sheet.secure_token)}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md bg-red-800 px-4 py-2 text-sm font-bold text-white"
                      >
                        {sheet.submitted_at
                          ? "Review Cut Sheet"
                          : "Open Customer Link"}
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="px-6 py-14 text-center font-bold text-stone-500">
                No deer drop-offs yet.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
