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
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

function parseAppointmentDate(raw: string) {
  const dateOnly = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
  }
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
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
  return raw ? parseAppointmentDate(raw) : null;
}

function getAppointmentName(record: AppointmentRecord) {
  const direct = getString(record, ["customer_name", "name", "full_name", "farmer_name", "contact_name"]);
  if (direct) return direct;
  const first = getString(record, ["first_name", "firstName"]);
  const last = getString(record, ["last_name", "lastName"]);
  return `${first} ${last}`.trim() || "Customer";
}

function getAppointmentAnimal(record: AppointmentRecord) {
  return getString(record, ["animal_type", "species", "animal", "livestock_type", "processing_type"]) || "Processing appointment";
}

function getAppointmentStatus(record: AppointmentRecord) {
  return getString(record, ["status", "appointment_status", "processing_status"]) || "scheduled";
}

function formatDate(date: Date | null) {
  if (!date) return "Date not listed";
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(date);
}

function formatTime(record: AppointmentRecord, date: Date | null) {
  const rawTime = getString(record, ["appointment_time", "dropoff_time", "scheduled_time", "time"]);
  if (rawTime) return rawTime;
  if (!date) return "";
  const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0 || date.getSeconds() !== 0;
  return hasTime ? new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date) : "";
}

function statusClasses(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("complete") || normalized.includes("picked") || normalized.includes("finished")) return "bg-emerald-100 text-emerald-800";
  if (normalized.includes("cancel") || normalized.includes("declin") || normalized.includes("no show")) return "bg-red-100 text-red-800";
  if (normalized.includes("progress") || normalized.includes("processing") || normalized.includes("cut")) return "bg-amber-100 text-amber-800";
  return "bg-blue-100 text-blue-800";
}

function animalClasses(animal: string) {
  const normalized = animal.toLowerCase();
  if (normalized.includes("beef") || normalized.includes("cow") || normalized.includes("cattle")) return "border-red-300 bg-red-50 text-red-950 hover:bg-red-100";
  if (normalized.includes("pork") || normalized.includes("pig") || normalized.includes("hog")) return "border-blue-300 bg-blue-50 text-blue-950 hover:bg-blue-100";
  if (normalized.includes("sheep") || normalized.includes("lamb")) return "border-emerald-300 bg-emerald-50 text-emerald-950 hover:bg-emerald-100";
  if (normalized.includes("goat")) return "border-amber-300 bg-amber-50 text-amber-950 hover:bg-amber-100";
  return "border-stone-300 bg-stone-50 text-stone-950 hover:bg-stone-100";
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function buildCalendarDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - first.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    return day;
  });
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentRecord | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  async function loadAppointments() {
    setLoading(true);
    setLoadError("");

    const result = await supabase
      .from("appointments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (result.error) {
      console.error("Unable to load appointments:", result.error);
      setLoadError("The dashboard loaded, but appointments could not be retrieved.");
      setAppointments([]);
    } else {
      setAppointments((result.data ?? []) as AppointmentRecord[]);
    }

    setLoading(false);
  }

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
      await loadAppointments();
    }

    loadDashboard();
    return () => {
      active = false;
    };
  }, [router]);

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

  const calendarDays = useMemo(() => buildCalendarDays(calendarMonth), [calendarMonth]);

  const appointmentsByDay = useMemo(() => {
    const grouped = new Map<string, AppointmentRecord[]>();
    for (const appointment of appointments) {
      const date = getAppointmentDate(appointment);
      if (!date) continue;
      const key = dateKey(date);
      const current = grouped.get(key) ?? [];
      current.push(appointment);
      grouped.set(key, current);
    }

    for (const [, dayAppointments] of grouped) {
      dayAppointments.sort((a, b) => {
        const aTime = getAppointmentDate(a)?.getTime() ?? 0;
        const bTime = getAppointmentDate(b)?.getTime() ?? 0;
        return aTime - bTime;
      });
    }

    return grouped;
  }, [appointments]);

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  async function handleDeleteBooking() {
    if (!selectedAppointment?.id || deleting) return;

    const name = getAppointmentName(selectedAppointment);
    const confirmed = window.confirm(`Delete the booking for ${name}? This cannot be undone.`);
    if (!confirmed) return;

    setDeleting(true);
    setActionMessage("");

    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", selectedAppointment.id);

    if (error) {
      console.error("Unable to delete appointment:", error);
      setActionMessage(`Could not delete the booking: ${error.message}`);
      setDeleting(false);
      return;
    }

    setAppointments((current) => current.filter((appointment) => String(appointment.id) !== String(selectedAppointment.id)));
    setSelectedAppointment(null);
    setActionMessage("Booking deleted successfully.");
    setDeleting(false);
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

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:px-12">
        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[["Total Loaded", stats.total], ["Today", stats.today], ["Upcoming", stats.upcoming], ["Completed", stats.completed]].map(([label, value]) => (
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

        {actionMessage ? (
          <div className={`mt-8 rounded-md border px-5 py-4 font-semibold ${actionMessage.startsWith("Could not") ? "border-red-300 bg-red-50 text-red-900" : "border-emerald-300 bg-emerald-50 text-emerald-900"}`}>
            {actionMessage}
          </div>
        ) : null}

        <section className="mt-8 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-stone-200 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-800">Scheduling</p>
              <h2 className="mt-1 text-2xl font-black uppercase tracking-tight">
                {new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(calendarMonth)}
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} className="rounded-md border border-stone-300 px-4 py-2 text-sm font-bold transition hover:border-stone-900">
                Previous
              </button>
              <button type="button" onClick={() => { const now = new Date(); setCalendarMonth(new Date(now.getFullYear(), now.getMonth(), 1)); }} className="rounded-md border border-stone-300 px-4 py-2 text-sm font-bold transition hover:border-stone-900">
                Today
              </button>
              <button type="button" onClick={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} className="rounded-md border border-stone-300 px-4 py-2 text-sm font-bold transition hover:border-stone-900">
                Next
              </button>
              <button type="button" onClick={loadAppointments} disabled={loading} className="rounded-md bg-stone-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-800 disabled:opacity-60">
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
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
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                <div className="grid grid-cols-7 border-b border-stone-200 bg-stone-50">
                  {WEEKDAYS.map((weekday) => (
                    <div key={weekday} className="px-3 py-3 text-center text-xs font-black uppercase tracking-[0.16em] text-stone-500">
                      {weekday}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7">
                  {calendarDays.map((day) => {
                    const dayAppointments = appointmentsByDay.get(dateKey(day)) ?? [];
                    const inCurrentMonth = day.getMonth() === calendarMonth.getMonth();
                    const isToday = sameDay(day, new Date());

                    return (
                      <div key={dateKey(day)} className={`min-h-36 border-b border-r border-stone-200 p-2 ${inCurrentMonth ? "bg-white" : "bg-stone-50"}`}>
                        <div className="mb-2 flex items-center justify-between">
                          <span className={`flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-sm font-black ${isToday ? "bg-red-800 text-white" : inCurrentMonth ? "text-stone-900" : "text-stone-400"}`}>
                            {day.getDate()}
                          </span>
                          {dayAppointments.length > 0 ? <span className="text-xs font-bold text-stone-400">{dayAppointments.length}</span> : null}
                        </div>

                        <div className="space-y-1.5">
                          {dayAppointments.map((appointment, index) => {
                            const name = getAppointmentName(appointment);
                            const animal = getAppointmentAnimal(appointment);
                            const appointmentDate = getAppointmentDate(appointment);
                            const time = formatTime(appointment, appointmentDate);
                            const appointmentKey = appointment.id !== undefined ? String(appointment.id) : `${dateKey(day)}-${index}`;

                            return (
                              <button
                                key={appointmentKey}
                                type="button"
                                onClick={() => setSelectedAppointment(appointment)}
                                className={`block w-full rounded-md border px-2 py-2 text-left text-xs font-semibold transition ${animalClasses(animal)}`}
                              >
                                <span className="block truncate font-black">{name}</span>
                                <span className="mt-0.5 block truncate opacity-80">{animal}{time ? ` · ${time}` : ""}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {selectedAppointment ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-4" role="dialog" aria-modal="true" aria-label="Booking details">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-stone-200 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-800">Booking Details</p>
                <h2 className="mt-1 text-2xl font-black">{getAppointmentName(selectedAppointment)}</h2>
              </div>
              <button type="button" onClick={() => setSelectedAppointment(null)} className="rounded-md px-3 py-2 text-xl font-black text-stone-500 transition hover:bg-stone-100 hover:text-stone-950" aria-label="Close booking details">
                ×
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-500">Animal</p>
                  <p className="mt-1 font-bold">{getAppointmentAnimal(selectedAppointment)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-500">Status</p>
                  <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] ${statusClasses(getAppointmentStatus(selectedAppointment))}`}>
                    {getAppointmentStatus(selectedAppointment)}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-500">Date</p>
                  <p className="mt-1 font-bold">{formatDate(getAppointmentDate(selectedAppointment))}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-500">Time</p>
                  <p className="mt-1 font-bold">{formatTime(selectedAppointment, getAppointmentDate(selectedAppointment)) || "Not listed"}</p>
                </div>
              </div>

              {getString(selectedAppointment, ["phone", "phone_number", "customer_phone"]) ? (
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-500">Phone</p>
                  <p className="mt-1 font-bold">{getString(selectedAppointment, ["phone", "phone_number", "customer_phone"])}</p>
                </div>
              ) : null}

              {getString(selectedAppointment, ["email", "customer_email"]) ? (
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-500">Email</p>
                  <p className="mt-1 break-all font-bold">{getString(selectedAppointment, ["email", "customer_email"])}</p>
                </div>
              ) : null}

              {getString(selectedAppointment, ["notes", "customer_notes", "special_instructions", "comments"]) ? (
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-500">Notes</p>
                  <p className="mt-1 whitespace-pre-wrap text-stone-700">{getString(selectedAppointment, ["notes", "customer_notes", "special_instructions", "comments"])}</p>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-stone-200 px-6 py-5 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setSelectedAppointment(null)} className="rounded-md border border-stone-300 px-5 py-3 text-sm font-bold transition hover:border-stone-950">
                Close
              </button>
              <button type="button" onClick={handleDeleteBooking} disabled={deleting || selectedAppointment.id === undefined} className="rounded-md bg-red-800 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">
                {deleting ? "Deleting..." : "Delete Booking"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}