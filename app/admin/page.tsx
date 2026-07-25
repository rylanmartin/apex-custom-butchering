"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AppointmentRecord = Record<string, unknown> & {
  id?: string | number;
};

type DashboardStats = {
  total: number;
  today: number;
  upcoming: number;
  completed: number;
};

const supabase = createClient();

function CalendarIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3.75 9.75h16.5M5.25 5.25h13.5A1.5 1.5 0 0 1 20.25 6.75v12a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-12a1.5 1.5 0 0 1 1.5-1.5Z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.592c.55 0 1.02.398 1.11.94l.213 1.274c.059.355.292.657.616.814.071.034.141.071.21.11.31.177.686.199 1.01.073l1.164-.454a1.125 1.125 0 0 1 1.37.492l1.296 2.244a1.125 1.125 0 0 1-.26 1.432l-.95.78c-.28.23-.42.59-.41.95.002.076.002.153 0 .229-.01.36.13.72.41.95l.95.78c.42.344.53.94.26 1.432l-1.296 2.244a1.125 1.125 0 0 1-1.37.492l-1.164-.454a1.145 1.145 0 0 0-1.01.073c-.069.039-.139.076-.21.11-.324.157-.557.459-.616.814l-.213 1.274c-.09.542-.56.94-1.11.94h-2.592c-.55 0-1.02-.398-1.11-.94l-.213-1.274a1.141 1.141 0 0 0-.616-.814 6.774 6.774 0 0 1-.21-.11 1.145 1.145 0 0 0-1.01-.073l-1.164.454a1.125 1.125 0 0 1-1.37-.492L3.67 16.84a1.125 1.125 0 0 1 .26-1.432l.95-.78c.28-.23.42-.59.41-.95a7.19 7.19 0 0 1 0-.229c.01-.36-.13-.72-.41-.95l-.95-.78a1.125 1.125 0 0 1-.26-1.432l1.296-2.244a1.125 1.125 0 0 1 1.37-.492l1.164.454c.324.126.7.104 1.01-.073.069-.039.139-.076.21-.11.324-.157.557-.459.616-.814l.213-1.274Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

function GalleryIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25A1.5 1.5 0 0 1 5.25 3.75h13.5a1.5 1.5 0 0 1 1.5 1.5v13.5a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V5.25Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 16.5 4.72-4.72a1.5 1.5 0 0 1 2.12 0l2.16 2.16 1.22-1.22a1.5 1.5 0 0 1 2.12 0l4.16 4.16M15.75 8.25h.008v.008h-.008V8.25Z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l3-3m0 0 3 3m-3-3v12" />
    </svg>
  );
}

function getString(record: AppointmentRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
  }
  return "";
}

function getAppointmentDate(record: AppointmentRecord) {
  const raw = getString(record, [
    "appointment_date",
    "dropoff_date",
    "scheduled_date",
    "date",
    "processing_date",
    "created_at",
  ]);
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getAppointmentName(record: AppointmentRecord) {
  const direct = getString(record, [
    "customer_name",
    "name",
    "full_name",
    "farmer_name",
    "contact_name",
  ]);
  if (direct) return direct;
  const first = getString(record, ["first_name", "firstName"]);
  const last = getString(record, ["last_name", "lastName"]);
  return `${first} ${last}`.trim() || "Customer";
}

function getAppointmentAnimal(record: AppointmentRecord) {
  return getString(record, [
    "animal_type",
    "species",
    "animal",
    "livestock_type",
    "processing_type",
  ]) || "Processing appointment";
}

function getAppointmentStatus(record: AppointmentRecord) {
  return getString(record, ["status", "appointment_status", "processing_status"]) || "scheduled";
}

function formatDate(date: Date | null) {
  if (!date) return "Date not listed";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function formatTime(record: AppointmentRecord, date: Date | null) {
  const rawTime = getString(record, ["appointment_time", "dropoff_time", "scheduled_time", "time"]);
  if (rawTime) return rawTime;
  if (!date) return "";
  const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0 || date.getSeconds() !== 0;
  if (!hasTime) return "";
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
}

function statusClasses(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("complete") || normalized.includes("picked") || normalized.includes("finished")) return "bg-emerald-100 text-emerald-800";
  if (normalized.includes("cancel") || normalized.includes("declin") || normalized.includes("no show")) return "bg-red-100 text-red-800";
  if (normalized.includes("progress") || normalized.includes("processing") || normalized.includes("cut")) return "bg-amber-100 text-amber-800";
  return "bg-blue-100 text-blue-800";
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (!active) return;
      if (authError || !user) {
        router.replace("/login");
        return;
      }

      setAuthChecking(false);

      const result = await supabase
        .from("appointments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (!active) return;

      if (result.error) {
        console.error("Unable to load appointments:", result.error);
        setLoadError("The dashboard loaded, but appointments could not be retrieved.");
        setAppointments([]);
      } else {
        setAppointments((result.data ?? []) as AppointmentRecord[]);
      }

      setLoading(false);
    }

    loadDashboard();
    return () => {
      active = false;
    };
  }, [router]);

  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => {
      const aDate = getAppointmentDate(a)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bDate = getAppointmentDate(b)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return aDate - bDate;
    });
  }, [appointments]);

  const stats = useMemo<DashboardStats>(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const tomorrowStart = todayStart + 24 * 60 * 60 * 1000;
    let today = 0;
    let upcoming = 0;
    let completed = 0;

    for (const appointment of appointments) {
      const date = getAppointmentDate(appointment);
      const status = getAppointmentStatus(appointment).toLowerCase();
      if (status.includes("complete") || status.includes("picked") || status.includes("finished")) completed += 1;
      if (date) {
        const timestamp = date.getTime();
        if (timestamp >= todayStart && timestamp < tomorrowStart) today += 1;
        if (timestamp >= todayStart) upcoming += 1;
      }
    }

    return { total: appointments.length, today, upcoming, completed };
  }, [appointments]);

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  if (authChecking) {
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
      <header className="border-b border-white/10 bg-stone-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.32em] text-red-400">Apex Custom Butchering</p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-tight">Admin Dashboard</h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/" className="inline-flex items-center justify-center rounded-md border border-white/25 px-4 py-3 text-sm font-bold transition hover:bg-white hover:text-stone-950">
              View Website
            </Link>
            <button type="button" onClick={handleSignOut} disabled={signingOut} className="inline-flex items-center justify-center gap-2 rounded-md bg-red-800 px-4 py-3 text-sm font-bold transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
              <LogoutIcon />
              {signingOut ? "Signing Out..." : "Sign Out"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8 lg:px-12">
        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[['Total Loaded', stats.total], ['Today', stats.today], ['Upcoming', stats.upcoming], ['Completed', stats.completed]].map(([label, value]) => (
            <article key={String(label)} className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-stone-500">{label}</p>
              <p className="mt-3 text-4xl font-black">{value}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <Link href="/schedule" className="group rounded-lg border border-stone-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-red-800 hover:shadow-md">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-800 text-white"><CalendarIcon /></div>
            <h2 className="mt-5 text-xl font-black uppercase tracking-tight">New Appointment</h2>
            <p className="mt-2 leading-7 text-stone-600">Open the public scheduling form to create or test a booking.</p>
          </Link>

          <Link href="/admin/settings" className="group rounded-lg border border-stone-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-red-800 hover:shadow-md">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-800 text-white"><SettingsIcon /></div>
            <h2 className="mt-5 text-xl font-black uppercase tracking-tight">Shop Settings</h2>
            <p className="mt-2 leading-7 text-stone-600">Manage capacity, business details, closures, processing days, and appointment times.</p>
          </Link>

          <Link href="/admin/settings#gallery" className="group rounded-lg border border-stone-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-red-800 hover:shadow-md">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-800 text-white"><GalleryIcon /></div>
            <h2 className="mt-5 text-xl font-black uppercase tracking-tight">Homepage Gallery</h2>
            <p className="mt-2 leading-7 text-stone-600">Change the gallery title and manage the images shown on the homepage.</p>
          </Link>
        </section>

        <section className="mt-8 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-stone-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-800">Scheduling</p>
              <h2 className="mt-1 text-2xl font-black uppercase tracking-tight">Appointments</h2>
            </div>
            <button type="button" onClick={() => window.location.reload()} className="rounded-md border border-stone-300 px-4 py-2 text-sm font-bold transition hover:border-stone-900">Refresh</button>
          </div>

          {loadError ? (
            <div className="m-6 rounded-md border border-amber-300 bg-amber-50 px-5 py-4 text-amber-900">
              <p className="font-bold">Appointments could not be loaded.</p>
              <p className="mt-1 text-sm">Confirm the table is named <code>appointments</code> and that the signed-in administrator has permission to read it.</p>
            </div>
          ) : null}

          {loading ? (
            <div className="px-6 py-14 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-red-800" />
              <p className="mt-4 font-semibold text-stone-600">Loading appointments...</p>
            </div>
          ) : sortedAppointments.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="text-lg font-bold">No appointments found.</p>
              <p className="mt-2 text-stone-600">New bookings will appear here after they are submitted.</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-200">
              {sortedAppointments.map((appointment, index) => {
                const appointmentId = appointment.id !== undefined ? String(appointment.id) : String(index);
                const date = getAppointmentDate(appointment);
                const time = formatTime(appointment, date);
                const name = getAppointmentName(appointment);
                const animal = getAppointmentAnimal(appointment);
                const status = getAppointmentStatus(appointment);

                return (
                  <article key={appointmentId} className="grid gap-4 px-6 py-5 transition hover:bg-stone-50 md:grid-cols-[1.2fr_1fr_auto] md:items-center">
                    <div>
                      <h3 className="text-lg font-black">{name}</h3>
                      <p className="mt-1 text-stone-600">{animal}</p>
                    </div>
                    <div>
                      <p className="font-bold">{formatDate(date)}</p>
                      {time ? <p className="mt-1 text-sm text-stone-600">{time}</p> : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 md:justify-end">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] ${statusClasses(status)}`}>{status}</span>
                      {appointment.id !== undefined ? (
                        <Link href={`/admin/${appointmentId}`} className="rounded-md bg-stone-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-800">Open</Link>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}