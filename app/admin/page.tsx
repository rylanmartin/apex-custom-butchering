"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AppointmentRecord = Record<string, unknown> & {
  id?: string | number;
};

type OwnerContact = {
  customerId: string;
  name: string;
  phone: string;
};

type DashboardStats = {
  total: number;
  today: number;
  upcoming: number;
  completed: number;
};

type AdminNotification = {
  id: string;
  event_type: string;
  title: string;
  message: string;
  link: string;
  read_at: string | null;
  created_at: string;
};

type AnnualProcessingTotals = {
  beef: number;
  pork: number;
  sheep: number;
  goat: number;
  deer: number;
  cropDamageDeer: number;
};

const EMPTY_ANNUAL_TOTALS: AnnualProcessingTotals = {
  beef: 0,
  pork: 0,
  sheep: 0,
  goat: 0,
  deer: 0,
  cropDamageDeer: 0,
};

const supabase = createClient();
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function BellIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75v-.7V9a6 6 0 0 0-12 0v.05-.05.7a8.967 8.967 0 0 1-2.311 6.072c1.75.575 3.57 1.012 5.454 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3.75 9.75h16.5M5.25 5.25h13.5A1.5 1.5 0 0 1 20.25 6.75v12a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-12a1.5 1.5 0 0 1 1.5-1.5Z"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.592c.55 0 1.02.398 1.11.94l.213 1.274c.059.355.292.657.616.814.071.034.141.071.21.11.31.177.686.199 1.01.073l1.164-.454a1.125 1.125 0 0 1 1.37.492l1.296 2.244a1.125 1.125 0 0 1-.26 1.432l-.95.78c-.28.23-.42.59-.41.95.002.076.002.153 0 .229-.01.36.13.72.41.95l.95.78c.42.344.53.94.26 1.432l-1.296 2.244a1.125 1.125 0 0 1-1.37.492l-1.164-.454a1.145 1.145 0 0 0-1.01.073c-.069.039-.139.076-.21.11-.324.157-.557.459-.616.814l-.213 1.274c-.09.542-.56.94-1.11.94h-2.592c-.55 0-1.02-.398-1.11-.94l-.213-1.274a1.141 1.141 0 0 0-.616-.814 6.774 6.774 0 0 1-.21-.11 1.145 1.145 0 0 0-1.01-.073l-1.164.454a1.125 1.125 0 0 1-1.37-.492L3.67 16.84a1.125 1.125 0 0 1 .26-1.432l.95-.78c.28-.23.42-.59.41-.95a7.19 7.19 0 0 1 0-.229c.01-.36-.13-.72-.41-.95l-.95-.78a1.125 1.125 0 0 1-.26-1.432l1.296-2.244a1.125 1.125 0 0 1 1.37-.492l1.164.454c.324.126.7.104 1.01-.073.069-.039.139-.076.21-.11.324-.157.557-.459.616-.814l.213-1.274Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    </svg>
  );
}

function GalleryIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 5.25A1.5 1.5 0 0 1 5.25 3.75h13.5a1.5 1.5 0 0 1 1.5 1.5v13.5a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V5.25Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m3.75 16.5 4.72-4.72a1.5 1.5 0 0 1 2.12 0l2.16 2.16 1.22-1.22a1.5 1.5 0 0 1 2.12 0l4.16 4.16M15.75 8.25h.008v.008h-.008V8.25Z"
      />
    </svg>
  );
}

function CutSheetIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.25 3.75H6.75a1.5 1.5 0 0 0-1.5 1.5v13.5a1.5 1.5 0 0 0 1.5 1.5h10.5a1.5 1.5 0 0 0 1.5-1.5V8.25l-4.5-4.5Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.25 3.75v4.5h4.5M8.25 12h7.5M8.25 15h7.5M8.25 18h4.5"
      />
    </svg>
  );
}

function CustomersIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.25a7.5 7.5 0 0 1 15 0"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l3-3m0 0 3 3m-3-3v12"
      />
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

function getStringList(record: AppointmentRecord, key: string) {
  const value = record[key];
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is string => typeof item === "string" && Boolean(item.trim()),
  );
}

function getOwnerContacts(record: AppointmentRecord) {
  const value = record.owner_contacts;

  if (Array.isArray(value)) {
    const contacts = value.flatMap((item): OwnerContact[] => {
      if (!item || typeof item !== "object") return [];

      const contact = item as Record<string, unknown>;
      const name = typeof contact.name === "string" ? contact.name.trim() : "";
      const phone =
        typeof contact.phone === "string" ? contact.phone.trim() : "";
      const customerId = String(contact.customerId ?? name);

      return name ? [{ customerId, name, phone }] : [];
    });

    if (contacts.length > 0) return contacts;
  }

  const names = getStringList(record, "owner_names");
  const primaryPhone = getString(record, [
    "cut_sheet_customer_phone",
    "phone",
    "phone_number",
    "customer_phone",
  ]);

  return names.map((name, index) => ({
    customerId: `${name}-${index}`,
    name,
    phone: index === 0 ? primaryPhone : "",
  }));
}

function parseAppointmentDate(raw: string) {
  const dateOnly = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    return new Date(
      Number(dateOnly[1]),
      Number(dateOnly[2]) - 1,
      Number(dateOnly[3]),
    );
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
  const direct = getString(record, [
    "customer_name",
    "producer_name",
    "name",
    "full_name",
    "farmer_name",
    "contact_name",
  ]);
  if (direct) return direct;
  const owners = getStringList(record, "owner_names");
  if (owners.length > 0) return owners.join(", ");
  const first = getString(record, ["first_name", "firstName"]);
  const last = getString(record, ["last_name", "lastName"]);
  return `${first} ${last}`.trim() || "Customer";
}

function getAppointmentAnimal(record: AppointmentRecord) {
  return (
    getString(record, [
      "animal_type",
      "species",
      "animal",
      "livestock_type",
      "processing_type",
    ]) || "Processing appointment"
  );
}

function normalizeAnnualSpecies(
  value: unknown,
):
  | keyof Pick<AnnualProcessingTotals, "beef" | "pork" | "sheep" | "goat">
  | null {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  if (
    normalized.includes("beef") ||
    normalized.includes("cow") ||
    normalized.includes("cattle")
  ) {
    return "beef";
  }
  if (
    normalized.includes("pork") ||
    normalized.includes("pig") ||
    normalized.includes("hog")
  ) {
    return "pork";
  }
  if (normalized.includes("sheep") || normalized.includes("lamb")) {
    return "sheep";
  }
  if (normalized.includes("goat")) return "goat";

  return null;
}

function isProcessedAnimalStatus(value: unknown) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  return (
    normalized.includes("ready_for_pickup") ||
    normalized.includes("ready for pickup") ||
    normalized.includes("picked_up") ||
    normalized.includes("picked up") ||
    normalized.includes("complete") ||
    normalized.includes("finished") ||
    normalized.includes("processed")
  );
}

function getAppointmentStatus(record: AppointmentRecord) {
  return (
    getString(record, [
      "animal_status",
      "status",
      "appointment_status",
      "processing_status",
    ]) || "scheduled"
  );
}

function formatDate(date: Date | null) {
  if (!date) return "Date not listed";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatTime(record: AppointmentRecord, date: Date | null) {
  const rawTime = getString(record, [
    "appointment_time",
    "dropoff_time",
    "scheduled_time",
    "time",
  ]);
  if (rawTime) return rawTime;
  if (!date) return "";
  const hasTime =
    date.getHours() !== 0 || date.getMinutes() !== 0 || date.getSeconds() !== 0;
  return hasTime
    ? new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }).format(date)
    : "";
}

function statusClasses(status: string) {
  const normalized = status.toLowerCase();
  if (
    normalized.includes("complete") ||
    normalized.includes("picked") ||
    normalized.includes("finished")
  )
    return "bg-emerald-100 text-emerald-800";
  if (
    normalized.includes("cancel") ||
    normalized.includes("declin") ||
    normalized.includes("no show")
  )
    return "bg-red-100 text-red-800";
  if (
    normalized.includes("progress") ||
    normalized.includes("processing") ||
    normalized.includes("cut")
  )
    return "bg-amber-100 text-amber-800";
  return "bg-blue-100 text-blue-800";
}

function animalClasses(animal: string) {
  const normalized = animal.toLowerCase();
  if (
    normalized.includes("beef") ||
    normalized.includes("cow") ||
    normalized.includes("cattle")
  )
    return "border-red-300 bg-red-50 text-red-950 hover:bg-red-100";
  if (
    normalized.includes("pork") ||
    normalized.includes("pig") ||
    normalized.includes("hog")
  )
    return "border-blue-300 bg-blue-50 text-blue-950 hover:bg-blue-100";
  if (normalized.includes("sheep") || normalized.includes("lamb"))
    return "border-emerald-300 bg-emerald-50 text-emerald-950 hover:bg-emerald-100";
  if (normalized.includes("goat"))
    return "border-amber-300 bg-amber-50 text-amber-950 hover:bg-amber-100";
  return "border-stone-300 bg-stone-50 text-stone-950 hover:bg-stone-100";
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
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
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentRecord | null>(null);
  const [hangingWeight, setHangingWeight] = useState("");
  const [savingWeight, setSavingWeight] = useState(false);
  const [unlockingCutSheet, setUnlockingCutSheet] = useState<
    "copy" | "no-copy" | null
  >(null);
  const [pickupAction, setPickupAction] = useState<"copy" | "no-copy" | null>(
    null,
  );
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");
  const [browserReady, setBrowserReady] = useState(false);
  const [annualTotals, setAnnualTotals] =
    useState<AnnualProcessingTotals>(EMPTY_ANNUAL_TOTALS);
  const [annualTotalsOpen, setAnnualTotalsOpen] = useState(false);
  const [annualTotalsLoading, setAnnualTotalsLoading] = useState(false);
  const [annualTotalsError, setAnnualTotalsError] = useState("");
  const [cropDamageAmount, setCropDamageAmount] = useState("");
  const [addingCropDamage, setAddingCropDamage] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  async function loadNotifications() {
    setNotificationsLoading(true);
    setNotificationsError("");

    const result = await supabase
      .from("admin_notifications")
      .select("id, event_type, title, message, link, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(40);

    if (result.error) {
      console.error("Unable to load admin notifications:", result.error);
      setNotificationsError(
        result.error.code === "42P01"
          ? "The notification table has not been set up in Supabase yet."
          : "Notifications could not be loaded. Refresh and try again.",
      );
    } else {
      setNotifications((result.data ?? []) as AdminNotification[]);
    }

    setNotificationsLoading(false);
  }

  async function markNotificationRead(id: string) {
    const readAt = new Date().toISOString();
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? { ...notification, read_at: notification.read_at || readAt }
          : notification,
      ),
    );

    const { error } = await supabase
      .from("admin_notifications")
      .update({ read_at: readAt })
      .eq("id", id)
      .is("read_at", null);

    if (error) console.error("Unable to mark notification read:", error);
  }

  async function markAllNotificationsRead() {
    const readAt = new Date().toISOString();
    const unreadIds = notifications
      .filter((notification) => !notification.read_at)
      .map((notification) => notification.id);

    if (unreadIds.length === 0) return;

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read_at: notification.read_at || readAt,
      })),
    );

    const { error } = await supabase
      .from("admin_notifications")
      .update({ read_at: readAt })
      .in("id", unreadIds);

    if (error) console.error("Unable to mark notifications read:", error);
  }

  async function loadAnnualProcessingTotals() {
    setAnnualTotalsLoading(true);
    setAnnualTotalsError("");

    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1).toISOString();
    const nextYearStart = new Date(currentYear + 1, 0, 1).toISOString();

    const [appointmentResult, animalResult, deerResult, manualResult] =
      await Promise.all([
        supabase.from("appointments").select("*").limit(5000),
        supabase
          .from("animals")
          .select("id, appointment_id, status")
          .limit(10000),
        supabase
          .from("deer_cut_sheets")
          .select("id, created_at")
          .gte("created_at", yearStart)
          .lt("created_at", nextYearStart)
          .limit(10000),
        supabase
          .from("annual_manual_animal_counts")
          .select("count")
          .eq("year", currentYear)
          .eq("category", "crop_damage_deer")
          .maybeSingle(),
      ]);

    if (appointmentResult.error || animalResult.error) {
      console.error(
        "Unable to load annual livestock totals:",
        appointmentResult.error || animalResult.error,
      );
      setAnnualTotalsError(
        "The yearly livestock totals could not be loaded. Refresh and try again.",
      );
    }

    if (deerResult.error) {
      console.error("Unable to load the annual deer total:", deerResult.error);
    }

    if (manualResult.error) {
      console.warn(
        "Unable to load the crop-damage deer total:",
        manualResult.error,
      );
      setAnnualTotalsError(
        "Run the annual processing counter SQL in Supabase to enable Crop Damage Deer.",
      );
    }

    const appointmentSpecies = new Map<
      string,
      keyof Pick<AnnualProcessingTotals, "beef" | "pork" | "sheep" | "goat">
    >();

    for (const appointment of (appointmentResult.data ??
      []) as AppointmentRecord[]) {
      const appointmentDate = getAppointmentDate(appointment);
      const species = normalizeAnnualSpecies(getAppointmentAnimal(appointment));
      if (
        appointment.id !== undefined &&
        appointmentDate?.getFullYear() === currentYear &&
        species
      ) {
        appointmentSpecies.set(String(appointment.id), species);
      }
    }

    const nextTotals: AnnualProcessingTotals = {
      ...EMPTY_ANNUAL_TOTALS,
      deer: deerResult.data?.length ?? 0,
      cropDamageDeer:
        typeof manualResult.data?.count === "number"
          ? manualResult.data.count
          : Number(manualResult.data?.count ?? 0),
    };

    for (const animal of (animalResult.data ?? []) as Array<
      Record<string, unknown>
    >) {
      if (!isProcessedAnimalStatus(animal.status)) continue;
      const species = appointmentSpecies.get(String(animal.appointment_id));
      if (species) nextTotals[species] += 1;
    }

    setAnnualTotals(nextTotals);
    setAnnualTotalsLoading(false);
  }

  async function addCropDamageDeer() {
    const amount = Number.parseInt(cropDamageAmount, 10);
    if (!Number.isInteger(amount) || amount <= 0) {
      setAnnualTotalsError("Enter a whole number greater than zero.");
      return;
    }

    setAddingCropDamage(true);
    setAnnualTotalsError("");

    const { data, error } = await supabase.rpc(
      "increment_annual_manual_animal_count",
      {
        p_year: new Date().getFullYear(),
        p_category: "crop_damage_deer",
        p_amount: amount,
      },
    );

    if (error) {
      console.error("Unable to add crop-damage deer:", error);
      setAnnualTotalsError(
        "Crop Damage Deer could not be updated. Confirm the annual counter SQL was run in Supabase.",
      );
      setAddingCropDamage(false);
      return;
    }

    const updatedCount = Number(data ?? annualTotals.cropDamageDeer + amount);
    setAnnualTotals((current) => ({
      ...current,
      cropDamageDeer: Number.isFinite(updatedCount)
        ? updatedCount
        : current.cropDamageDeer + amount,
    }));
    setCropDamageAmount("");
    setAddingCropDamage(false);
  }

  async function loadAppointments() {
    setLoading(true);
    setLoadError("");

    const result = await supabase
      .from("appointments")
      .select("*")
      .neq("booking_type", "fair")
      .order("created_at", { ascending: false })
      .limit(500);

    if (result.error) {
      console.error("Unable to load appointments:", result.error);
      setLoadError(
        "The dashboard loaded, but appointments could not be retrieved.",
      );
      setAppointments([]);
      setLoading(false);
      return;
    }

    const appointmentRows = (result.data ?? []) as AppointmentRecord[];
    const appointmentIds = appointmentRows
      .map((row) => row.id)
      .filter((id): id is string | number => id !== undefined);
    const producerIds = appointmentRows
      .map((row) => row.customer_id)
      .filter(
        (id): id is string | number =>
          typeof id === "string" || typeof id === "number",
      );

    const [producerResult, animalResult] = await Promise.all([
      producerIds.length > 0
        ? supabase
            .from("customers")
            .select("id, name, phone")
            .in("id", producerIds)
        : Promise.resolve({ data: [], error: null }),
      appointmentIds.length > 0
        ? supabase
            .from("animals")
            .select("id, appointment_id, animal_number, hanging_weight, status")
            .in("appointment_id", appointmentIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (producerResult.error)
      console.error("Unable to load producers:", producerResult.error);
    if (animalResult.error)
      console.error("Unable to load animals:", animalResult.error);

    const animals = (animalResult.data ?? []) as Array<Record<string, unknown>>;
    const animalIds = animals
      .map((animal) => animal.id)
      .filter(
        (id): id is string | number =>
          typeof id === "string" || typeof id === "number",
      );

    const cutSheetResult =
      animalIds.length > 0
        ? await supabase
            .from("cut_sheets")
            .select(
              "id, animal_id, customer_id, form_data, secure_token, unlocked, contact_method",
            )
            .in("animal_id", animalIds)
        : { data: [], error: null };

    if (cutSheetResult.error)
      console.error("Unable to load beef owners:", cutSheetResult.error);

    const cutSheets = (cutSheetResult.data ?? []) as Array<
      Record<string, unknown>
    >;
    const ownerIds = cutSheets
      .map((sheet) => sheet.customer_id)
      .filter(
        (id): id is string | number =>
          typeof id === "string" || typeof id === "number",
      );

    const ownerResult =
      ownerIds.length > 0
        ? await supabase
            .from("customers")
            .select("id, name, phone")
            .in("id", ownerIds)
        : { data: [], error: null };

    if (ownerResult.error)
      console.error("Unable to load owner names:", ownerResult.error);

    const producersById = new Map<string, Record<string, unknown>>();
    for (const producer of (producerResult.data ?? []) as Array<
      Record<string, unknown>
    >) {
      producersById.set(String(producer.id), producer);
    }

    const ownersById = new Map<string, Record<string, unknown>>();
    for (const owner of (ownerResult.data ?? []) as Array<
      Record<string, unknown>
    >) {
      ownersById.set(String(owner.id), owner);
    }

    const animalToAppointment = new Map<string, string>();
    for (const animal of animals) {
      if (animal.id !== undefined && animal.appointment_id !== undefined) {
        animalToAppointment.set(
          String(animal.id),
          String(animal.appointment_id),
        );
      }
    }

    const ownerContactsByAppointment = new Map<string, OwnerContact[]>();
    for (const sheet of cutSheets) {
      const appointmentId = animalToAppointment.get(String(sheet.animal_id));
      if (!appointmentId) continue;

      const owner = ownersById.get(String(sheet.customer_id));
      const formData =
        sheet.form_data && typeof sheet.form_data === "object"
          ? (sheet.form_data as Record<string, unknown>)
          : {};
      const ownerName =
        typeof owner?.name === "string" && owner.name.trim()
          ? owner.name.trim()
          : typeof formData.customer_name === "string"
            ? formData.customer_name.trim()
            : "";

      const ownerPhone =
        typeof owner?.phone === "string" && owner.phone.trim()
          ? owner.phone.trim()
          : getString(formData as AppointmentRecord, [
              "customer_phone",
              "phone",
              "phone_number",
            ]);

      if (!ownerName) continue;
      const customerId = String(sheet.customer_id ?? sheet.id ?? ownerName);
      const current = ownerContactsByAppointment.get(appointmentId) ?? [];
      const existingContact = current.find(
        (contact) => contact.customerId === customerId,
      );

      if (existingContact) {
        if (!existingContact.phone && ownerPhone) {
          existingContact.phone = ownerPhone;
        }
      } else {
        current.push({ customerId, name: ownerName, phone: ownerPhone });
      }

      ownerContactsByAppointment.set(appointmentId, current);
    }

    const primaryAnimalByAppointment = new Map<
      string,
      Record<string, unknown>
    >();
    for (const animal of animals) {
      const appointmentId = String(animal.appointment_id ?? "");
      if (!appointmentId || primaryAnimalByAppointment.has(appointmentId))
        continue;
      primaryAnimalByAppointment.set(appointmentId, animal);
    }

    const cutSheetByAppointment = new Map<string, Record<string, unknown>>();
    for (const sheet of cutSheets) {
      const appointmentId = animalToAppointment.get(String(sheet.animal_id));
      if (!appointmentId || cutSheetByAppointment.has(appointmentId)) continue;
      cutSheetByAppointment.set(appointmentId, sheet);
    }

    const enrichedAppointments = appointmentRows.map((appointment) => {
      const producer = producersById.get(String(appointment.customer_id));
      const primaryAnimal = primaryAnimalByAppointment.get(
        String(appointment.id),
      );
      const cutSheet = cutSheetByAppointment.get(String(appointment.id));
      const cutSheetCustomer = ownersById.get(
        String(cutSheet?.customer_id ?? ""),
      );
      const ownerContacts =
        ownerContactsByAppointment.get(String(appointment.id)) ?? [];

      return {
        ...appointment,
        customer_name: typeof producer?.name === "string" ? producer.name : "",
        phone: typeof producer?.phone === "string" ? producer.phone : "",
        email: typeof producer?.email === "string" ? producer.email : "",
        owner_names: ownerContacts.map((contact) => contact.name),
        owner_contacts: ownerContacts,
        animal_id: primaryAnimal?.id,
        hanging_weight: primaryAnimal?.hanging_weight ?? "",
        animal_status: primaryAnimal?.status ?? "",
        cut_sheet_id: cutSheet?.id,
        cut_sheet_token: cutSheet?.secure_token ?? "",
        cut_sheet_unlocked: Boolean(cutSheet?.unlocked),
        cut_sheet_contact_method: cutSheet?.contact_method ?? "",
        cut_sheet_customer_id: cutSheet?.customer_id ?? appointment.customer_id,
        cut_sheet_customer_name:
          typeof cutSheetCustomer?.name === "string"
            ? cutSheetCustomer.name
            : "",
        cut_sheet_customer_phone:
          typeof cutSheetCustomer?.phone === "string"
            ? cutSheetCustomer.phone
            : "",
        cut_sheet_customer_email:
          typeof cutSheetCustomer?.email === "string"
            ? cutSheetCustomer.email
            : "",
      };
    });

    setAppointments(enrichedAppointments);

    setLoading(false);
  }

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (!active) return;
      if (authError || !user) {
        router.replace("/login");
        return;
      }

      setAuthChecking(false);
      await Promise.all([
        loadAppointments(),
        loadNotifications(),
        loadAnnualProcessingTotals(),
      ]);
    }

    loadDashboard();
    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    setBrowserReady(true);
  }, []);

  useEffect(() => {
    if (authChecking) return;

    const channel = supabase
      .channel("admin-notification-feed")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "admin_notifications",
        },
        () => {
          void loadNotifications();
        },
      )
      .subscribe();

    const intervalId = window.setInterval(() => {
      void loadNotifications();
      void loadAnnualProcessingTotals();
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
      void supabase.removeChannel(channel);
    };
  }, [authChecking]);

  useEffect(() => {
    if (!selectedAppointment) return;

    const scrollY = window.scrollY;
    const previousBodyStyles = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
      overflow: document.body.style.overflow,
    };

    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedAppointment(null);
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.position = previousBodyStyles.position;
      document.body.style.top = previousBodyStyles.top;
      document.body.style.left = previousBodyStyles.left;
      document.body.style.right = previousBodyStyles.right;
      document.body.style.width = previousBodyStyles.width;
      document.body.style.overflow = previousBodyStyles.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [selectedAppointment?.id]);

  const unreadNotificationCount = notifications.filter(
    (notification) => !notification.read_at,
  ).length;

  const annualProcessedTotal =
    annualTotals.beef +
    annualTotals.pork +
    annualTotals.sheep +
    annualTotals.goat +
    annualTotals.deer +
    annualTotals.cropDamageDeer;

  const stats = useMemo<DashboardStats>(() => {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime();
    const tomorrowStart = todayStart + 24 * 60 * 60 * 1000;
    let today = 0;
    let upcoming = 0;
    let completed = 0;

    for (const appointment of appointments) {
      const date = getAppointmentDate(appointment);
      const status = getAppointmentStatus(appointment).toLowerCase();
      if (
        status.includes("complete") ||
        status.includes("picked") ||
        status.includes("finished")
      )
        completed += 1;
      if (date) {
        const timestamp = date.getTime();
        if (timestamp >= todayStart && timestamp < tomorrowStart) today += 1;
        if (timestamp >= todayStart) upcoming += 1;
      }
    }

    return { total: appointments.length, today, upcoming, completed };
  }, [appointments]);

  const calendarDays = useMemo(
    () => buildCalendarDays(calendarMonth),
    [calendarMonth],
  );

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

  function openAppointment(appointment: AppointmentRecord) {
    setSelectedAppointment(appointment);
    const currentWeight = appointment.hanging_weight;
    setHangingWeight(
      typeof currentWeight === "number" || typeof currentWeight === "string"
        ? String(currentWeight)
        : "",
    );
    setActionMessage("");
  }

  async function saveHangingWeight() {
    if (!selectedAppointment?.animal_id || savingWeight) return;

    const numericWeight = Number.parseFloat(hangingWeight);
    if (
      !hangingWeight.trim() ||
      Number.isNaN(numericWeight) ||
      numericWeight <= 0
    ) {
      setActionMessage("Enter a valid hanging weight greater than zero.");
      return;
    }

    setSavingWeight(true);
    setActionMessage("");

    const { error } = await supabase
      .from("animals")
      .update({
        hanging_weight: numericWeight,
        status: selectedAppointment.cut_sheet_unlocked
          ? "waiting_on_cut_sheet"
          : "weight_entered",
      })
      .eq("id", selectedAppointment.animal_id);

    if (error) {
      console.error("Unable to save hanging weight:", error);
      setActionMessage(`Could not save the hanging weight: ${error.message}`);
      setSavingWeight(false);
      return;
    }

    const updatedAppointment = {
      ...selectedAppointment,
      hanging_weight: numericWeight,
      animal_status: selectedAppointment.cut_sheet_unlocked
        ? "waiting_on_cut_sheet"
        : "weight_entered",
    };

    setSelectedAppointment(updatedAppointment);
    setAppointments((current) =>
      current.map((appointment) =>
        String(appointment.id) === String(selectedAppointment.id)
          ? updatedAppointment
          : appointment,
      ),
    );
    setActionMessage("Hanging weight saved.");
    setSavingWeight(false);
  }

  function getCutSheetLink(appointment: AppointmentRecord) {
    const token = String(appointment.cut_sheet_token || "");
    if (!token) return "";
    return typeof window === "undefined"
      ? `/cut-sheet/${token}`
      : `${window.location.origin}/cut-sheet/${token}`;
  }

  function getMessageCustomerName(appointment: AppointmentRecord) {
    return (
      getString(appointment, ["cut_sheet_customer_name"]) ||
      getStringList(appointment, "owner_names")[0] ||
      getAppointmentName(appointment)
    );
  }

  function getMessageCustomerPhone(appointment: AppointmentRecord) {
    return getString(appointment, [
      "cut_sheet_customer_phone",
      "phone",
      "phone_number",
      "customer_phone",
    ]);
  }

  async function copyToClipboard(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = value;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const copied = document.execCommand("copy");
      document.body.removeChild(textArea);
      return copied;
    }
  }

  function buildCutSheetMessage(
    appointment: AppointmentRecord,
    numericWeight: number,
  ) {
    const customerName = getMessageCustomerName(appointment);
    return (
      `Hello ${customerName}, your hanging weight is ${numericWeight} lbs. ` +
      `Your cut sheet is ready. Please complete it here: ${getCutSheetLink(appointment)}`
    );
  }

  async function copyCutSheetMessage() {
    if (!selectedAppointment) return;

    const numericWeight = Number.parseFloat(hangingWeight);
    if (
      !hangingWeight.trim() ||
      Number.isNaN(numericWeight) ||
      numericWeight <= 0
    ) {
      setActionMessage(
        "Save a valid hanging weight before copying the cut-sheet message.",
      );
      return;
    }

    if (!getCutSheetLink(selectedAppointment)) {
      setActionMessage(
        "Could not copy the message because this cut sheet has no private link.",
      );
      return;
    }

    const copied = await copyToClipboard(
      buildCutSheetMessage(selectedAppointment, numericWeight),
    );
    const phone = getMessageCustomerPhone(selectedAppointment);
    setActionMessage(
      copied
        ? `Cut-sheet message copied. Paste it into Messages${phone ? ` for ${phone}` : ""} and send it.`
        : "Could not copy the cut-sheet message. Select and copy it manually.",
    );
  }

  async function unlockCutSheet(copyMessage: boolean) {
    if (!selectedAppointment?.cut_sheet_id || unlockingCutSheet) return;

    const numericWeight = Number.parseFloat(hangingWeight);
    if (
      !hangingWeight.trim() ||
      Number.isNaN(numericWeight) ||
      numericWeight <= 0
    ) {
      setActionMessage(
        "Save a valid hanging weight before unlocking the cut sheet.",
      );
      return;
    }

    const mode = copyMessage ? "copy" : "no-copy";
    setUnlockingCutSheet(mode);
    setActionMessage("");

    const contactMethod = copyMessage ? "text" : "call";
    const { error: cutSheetError } = await supabase
      .from("cut_sheets")
      .update({
        unlocked: true,
        contact_method: contactMethod,
      })
      .eq("id", selectedAppointment.cut_sheet_id);

    if (cutSheetError) {
      console.error("Unable to unlock cut sheet:", cutSheetError);
      setActionMessage(
        `Could not unlock the cut sheet: ${cutSheetError.message}`,
      );
      setUnlockingCutSheet(null);
      return;
    }

    const { error: animalError } = await supabase
      .from("animals")
      .update({
        hanging_weight: numericWeight,
        status: "waiting_on_cut_sheet",
      })
      .eq("id", selectedAppointment.animal_id);

    if (animalError) {
      console.error("Unable to update animal status:", animalError);
    }

    const updatedAppointment = {
      ...selectedAppointment,
      hanging_weight: numericWeight,
      animal_status: "waiting_on_cut_sheet",
      cut_sheet_unlocked: true,
      cut_sheet_contact_method: contactMethod,
    };

    setSelectedAppointment(updatedAppointment);
    setAppointments((current) =>
      current.map((appointment) =>
        String(appointment.id) === String(selectedAppointment.id)
          ? updatedAppointment
          : appointment,
      ),
    );

    if (copyMessage) {
      const copied = await copyToClipboard(
        buildCutSheetMessage(updatedAppointment, numericWeight),
      );
      const phone = getMessageCustomerPhone(updatedAppointment);
      setActionMessage(
        copied
          ? `Cut sheet unlocked and message copied. Paste it into Messages${phone ? ` for ${phone}` : ""} and send it.`
          : "Cut sheet unlocked, but the message could not be copied. Use Copy Cut Sheet Message to try again.",
      );
    } else {
      setActionMessage("Cut sheet unlocked without copying a message.");
    }
    setUnlockingCutSheet(null);
  }

  async function markReadyForPickup(copyMessage: boolean) {
    if (!selectedAppointment?.animal_id || pickupAction) return;

    const mode = copyMessage ? "copy" : "no-copy";
    setPickupAction(mode);
    setActionMessage("");

    const { error: animalError } = await supabase
      .from("animals")
      .update({ status: "ready_for_pickup" })
      .eq("id", selectedAppointment.animal_id);

    if (animalError) {
      console.error("Unable to mark animal ready for pickup:", animalError);
      setActionMessage(
        `Could not mark the animal ready for pickup: ${animalError.message}`,
      );
      setPickupAction(null);
      return;
    }

    let copiedPickupMessage = false;

    if (copyMessage) {
      const customerName = getMessageCustomerName(selectedAppointment);

      const defaultMessage =
        `Hello ${customerName}, your animal is processed and ready for pickup at ` +
        `Apex Custom Butchering. Please give us two days to get your meat completely ` +
        `frozen. If you could bring coolers or boxes to put your meat in, that would ` +
        `be great. We are looking forward to seeing you soon!`;

      let textMessage = defaultMessage;

      const { data: settingsData, error: settingsError } = await supabase
        .from("shop_settings")
        .select("key, value")
        .in("key", [
          "ready_for_pickup_message",
          "pickup_message",
          "pickup_text_message",
        ]);

      if (!settingsError && Array.isArray(settingsData)) {
        const savedSetting = settingsData.find((item) => {
          const value = item?.value;
          return typeof value === "string" && Boolean(value.trim());
        });

        if (savedSetting && typeof savedSetting.value === "string") {
          textMessage = savedSetting.value
            .replaceAll("[Customer Name]", customerName)
            .replaceAll("{{customer_name}}", customerName);
        }
      }

      copiedPickupMessage = await copyToClipboard(textMessage);
    }

    const updatedAppointment = {
      ...selectedAppointment,
      animal_status: "ready_for_pickup",
    };

    setSelectedAppointment(updatedAppointment);
    setAppointments((current) =>
      current.map((appointment) =>
        String(appointment.id) === String(selectedAppointment.id)
          ? updatedAppointment
          : appointment,
      ),
    );

    const phone = getMessageCustomerPhone(updatedAppointment);
    setActionMessage(
      copyMessage
        ? copiedPickupMessage
          ? `Animal marked ready for pickup and message copied. Paste it into Messages${phone ? ` for ${phone}` : ""} and send it.`
          : "Animal marked ready for pickup, but the message could not be copied."
        : "Animal marked ready for pickup without copying a message.",
    );
    await loadAnnualProcessingTotals();
    setPickupAction(null);
  }

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  async function handleDeleteBooking() {
    if (!selectedAppointment?.id || deleting) return;

    const name = getAppointmentName(selectedAppointment);
    const confirmed = window.confirm(
      `Delete the booking for ${name}? This cannot be undone.`,
    );
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

    setAppointments((current) =>
      current.filter(
        (appointment) =>
          String(appointment.id) !== String(selectedAppointment.id),
      ),
    );
    setSelectedAppointment(null);
    setActionMessage("Booking deleted successfully.");
    setDeleting(false);
  }

  if (authChecking) {
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
      <header className="border-b border-white/10 bg-stone-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.32em] text-red-400">
              Apex Custom Butchering
            </p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-tight">
              Admin Dashboard
            </h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen((open) => !open)}
                className="relative inline-flex items-center justify-center gap-2 rounded-md border border-white/25 px-4 py-3 text-sm font-bold transition hover:bg-white hover:text-stone-950"
                aria-expanded={notificationsOpen}
                aria-controls="admin-notification-list"
                aria-label={`Notifications, ${unreadNotificationCount} unread`}
              >
                <BellIcon />
                Notifications
                {unreadNotificationCount > 0 ? (
                  <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-red-700 px-1.5 py-0.5 text-xs font-black text-white">
                    {unreadNotificationCount > 99
                      ? "99+"
                      : unreadNotificationCount}
                  </span>
                ) : null}
              </button>

              {notificationsOpen ? (
                <div
                  id="admin-notification-list"
                  className="absolute left-0 z-[80] mt-2 w-[min(92vw,26rem)] overflow-hidden rounded-xl border border-stone-200 bg-white text-stone-950 shadow-2xl sm:left-auto sm:right-0"
                >
                  <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
                    <div>
                      <p className="font-black uppercase tracking-tight">
                        Notifications
                      </p>
                      <p className="text-xs text-stone-500">
                        {unreadNotificationCount} unread
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => void loadNotifications()}
                        disabled={notificationsLoading}
                        className="text-xs font-bold text-stone-600 disabled:text-stone-400"
                      >
                        Refresh
                      </button>
                      <button
                        type="button"
                        onClick={() => void markAllNotificationsRead()}
                        disabled={unreadNotificationCount === 0}
                        className="text-xs font-bold text-red-800 disabled:text-stone-400"
                      >
                        Mark all read
                      </button>
                    </div>
                  </div>

                  <div
                    className="max-h-[min(24rem,65dvh)] overflow-y-auto"
                    style={{ WebkitOverflowScrolling: "touch" }}
                  >
                    {notificationsError ? (
                      <p className="bg-amber-50 px-4 py-5 text-sm font-semibold text-amber-950">
                        {notificationsError}
                      </p>
                    ) : notificationsLoading && notifications.length === 0 ? (
                      <p className="px-4 py-8 text-center text-sm text-stone-500">
                        Loading notifications...
                      </p>
                    ) : notifications.length === 0 ? (
                      <p className="px-4 py-8 text-center text-sm text-stone-500">
                        No notifications yet.
                      </p>
                    ) : (
                      notifications.map((notification) => (
                        <Link
                          key={notification.id}
                          href={notification.link || "/admin"}
                          onClick={() => {
                            void markNotificationRead(notification.id);
                            setNotificationsOpen(false);
                          }}
                          className={`block border-b border-stone-100 px-4 py-4 transition hover:bg-stone-50 ${notification.read_at ? "bg-white" : "bg-red-50"}`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${notification.read_at ? "bg-stone-300" : "bg-red-700"}`}
                            />
                            <span>
                              <span className="block text-sm font-black">
                                {notification.title}
                              </span>
                              <span className="mt-1 block text-sm leading-5 text-stone-600">
                                {notification.message}
                              </span>
                              <span className="mt-2 block text-xs font-semibold text-stone-400">
                                {new Date(
                                  notification.created_at,
                                ).toLocaleString()}
                              </span>
                            </span>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-md border border-white/25 px-4 py-3 text-sm font-bold transition hover:bg-white hover:text-stone-950"
            >
              View Website
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-red-800 px-4 py-3 text-sm font-bold transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogoutIcon />
              {signingOut ? "Signing Out..." : "Sign Out"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:px-12">
        <section>
          <button
            type="button"
            onClick={() => setAnnualTotalsOpen((open) => !open)}
            className="flex w-full touch-manipulation items-center justify-between gap-5 rounded-xl border border-red-200 bg-white px-6 py-5 text-left shadow-sm transition hover:border-red-700 hover:shadow-md"
            aria-expanded={annualTotalsOpen}
            aria-controls="annual-processing-breakdown"
          >
            <span>
              <span className="block text-xs font-black uppercase tracking-[0.24em] text-red-800">
                {new Date().getFullYear()} Shop Total
              </span>
              <span className="mt-1 block text-xl font-black uppercase tracking-tight text-stone-950">
                Animals Processed This Year
              </span>
              <span className="mt-1 block text-sm font-semibold text-stone-500">
                Click to view the species breakdown.
              </span>
            </span>

            <span className="flex shrink-0 items-center gap-4">
              <span className="text-4xl font-black text-red-800">
                {annualTotalsLoading ? "…" : annualProcessedTotal}
              </span>
              <span
                className={`text-2xl font-black transition ${annualTotalsOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              >
                ⌄
              </span>
            </span>
          </button>

          {annualTotalsOpen ? (
            <div
              id="annual-processing-breakdown"
              className="mt-3 rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight">
                    {new Date().getFullYear()} Processed Animals
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-stone-500">
                    Livestock totals update when an animal is marked Ready for
                    Pickup. Deer are counted from Deer Drop-Off.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void loadAnnualProcessingTotals()}
                  disabled={annualTotalsLoading}
                  className="rounded-md border border-stone-300 px-4 py-2 text-sm font-bold transition hover:border-stone-950 disabled:opacity-50"
                >
                  {annualTotalsLoading ? "Refreshing..." : "Refresh Totals"}
                </button>
              </div>

              {annualTotalsError ? (
                <p className="mt-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-950">
                  {annualTotalsError}
                </p>
              ) : null}

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {[
                  ["Beef", annualTotals.beef],
                  ["Pigs", annualTotals.pork],
                  ["Sheep", annualTotals.sheep],
                  ["Goats", annualTotals.goat],
                  ["Deer", annualTotals.deer],
                ].map(([label, value]) => (
                  <article
                    key={String(label)}
                    className="rounded-lg border border-stone-200 bg-stone-50 p-4"
                  >
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">
                      {label}
                    </p>
                    <p className="mt-2 text-3xl font-black text-stone-950">
                      {value}
                    </p>
                  </article>
                ))}
              </div>

              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-5">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-red-800">
                      Crop Damage Deer
                    </p>
                    <p className="mt-2 text-4xl font-black text-stone-950">
                      {annualTotals.cropDamageDeer}
                    </p>
                  </div>

                  <div className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-xl">
                    <label className="min-w-0 flex-1">
                      <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-stone-600">
                        Number to Add
                      </span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        inputMode="numeric"
                        value={cropDamageAmount}
                        onChange={(event) =>
                          setCropDamageAmount(event.target.value)
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            void addCropDamageDeer();
                          }
                        }}
                        placeholder="Enter number"
                        className="w-full rounded-md border border-red-200 bg-white px-4 py-3 font-bold outline-none focus:border-red-800 focus:ring-2 focus:ring-red-100"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => void addCropDamageDeer()}
                      disabled={addingCropDamage}
                      className="rounded-md bg-red-800 px-6 py-3 font-bold text-white transition hover:bg-red-700 disabled:opacity-50 sm:self-end"
                    >
                      {addingCropDamage ? "Adding..." : "Add to Total"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <section className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Total Loaded", stats.total],
            ["Today", stats.today],
            ["Upcoming", stats.upcoming],
            ["Completed", stats.completed],
          ].map(([label, value]) => (
            <article
              key={String(label)}
              className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm"
            >
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-stone-500">
                {label}
              </p>
              <p className="mt-3 text-4xl font-black">{value}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <Link
            href="/schedule"
            className="group rounded-lg border border-stone-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-red-800 hover:shadow-md"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-800 text-white">
              <CalendarIcon />
            </div>
            <h2 className="mt-5 text-xl font-black uppercase tracking-tight">
              New Appointment
            </h2>
            <p className="mt-2 leading-7 text-stone-600">
              Open the public scheduling form to create or test a booking.
            </p>
          </Link>

          <Link
            href="/admin/settings"
            className="group rounded-lg border border-stone-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-red-800 hover:shadow-md"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-800 text-white">
              <SettingsIcon />
            </div>
            <h2 className="mt-5 text-xl font-black uppercase tracking-tight">
              Shop Settings
            </h2>
            <p className="mt-2 leading-7 text-stone-600">
              Manage capacity, business details, closures, processing days, and
              appointment times.
            </p>
          </Link>

          <Link
            href="/admin/settings#gallery"
            className="group rounded-lg border border-stone-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-red-800 hover:shadow-md"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-800 text-white">
              <GalleryIcon />
            </div>
            <h2 className="mt-5 text-xl font-black uppercase tracking-tight">
              Homepage Gallery
            </h2>
            <p className="mt-2 leading-7 text-stone-600">
              Change the gallery title and manage the images shown on the
              homepage.
            </p>
          </Link>

          <Link
            href="/admin/customers"
            className="group rounded-lg border border-stone-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-red-800 hover:shadow-md"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-800 text-white">
              <CustomersIcon />
            </div>
            <h2 className="mt-5 text-xl font-black uppercase tracking-tight">
              Customers
            </h2>
            <p className="mt-2 leading-7 text-stone-600">
              Search customers and review scheduled, fair, deer, and cut-sheet
              history.
            </p>
          </Link>

          <Link
            href="/admin/cut-sheets"
            className="group rounded-lg border border-stone-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-red-800 hover:shadow-md"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-800 text-white">
              <CutSheetIcon />
            </div>
            <h2 className="mt-5 text-xl font-black uppercase tracking-tight">
              Cut Sheets
            </h2>
            <p className="mt-2 leading-7 text-stone-600">
              Review waiting, submitted, and previously printed customer cut
              sheets.
            </p>
          </Link>

          <Link
            href="/admin/deer-dropoff"
            className="group rounded-lg border border-stone-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-red-800 hover:shadow-md"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-800 text-white">
              <CutSheetIcon />
            </div>
            <h2 className="mt-5 text-xl font-black uppercase tracking-tight">
              Deer Drop-Off
            </h2>
            <p className="mt-2 leading-7 text-stone-600">
              Enter a customer&apos;s name and phone number, create their deer
              cut sheet, and copy the text message.
            </p>
          </Link>

          <Link
            href="/admin/fair-animals"
            className="group rounded-lg border border-stone-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-red-800 hover:shadow-md"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-800 text-white">
              <CutSheetIcon />
            </div>
            <h2 className="mt-5 text-xl font-black uppercase tracking-tight">
              Fair Animals
            </h2>
            <p className="mt-2 leading-7 text-stone-600">
              Enter a fair customer, choose the animal, and open the cut sheet.
            </p>
          </Link>

          <Link
            href="/admin/meat-requests"
            className="group rounded-lg border border-stone-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-red-800 hover:shadow-md"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-800 text-white">
              <CutSheetIcon />
            </div>
            <h2 className="mt-5 text-xl font-black uppercase tracking-tight">
              Meat Requests
            </h2>
            <p className="mt-2 leading-7 text-stone-600">
              Review new quarter, half, and whole beef requests along with
              requested roaster-pig sizes.
            </p>
          </Link>
        </section>

        {actionMessage ? (
          <div
            className={`mt-8 rounded-md border px-5 py-4 font-semibold ${actionMessage.startsWith("Could not") ? "border-red-300 bg-red-50 text-red-900" : "border-emerald-300 bg-emerald-50 text-emerald-900"}`}
          >
            {actionMessage}
          </div>
        ) : null}

        <section className="mt-8 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-stone-200 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-800">
                Scheduling
              </p>
              <h2 className="mt-1 text-2xl font-black uppercase tracking-tight">
                {new Intl.DateTimeFormat("en-US", {
                  month: "long",
                  year: "numeric",
                }).format(calendarMonth)}
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setCalendarMonth(
                    (current) =>
                      new Date(
                        current.getFullYear(),
                        current.getMonth() - 1,
                        1,
                      ),
                  )
                }
                className="rounded-md border border-stone-300 px-4 py-2 text-sm font-bold transition hover:border-stone-900"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  setCalendarMonth(
                    new Date(now.getFullYear(), now.getMonth(), 1),
                  );
                }}
                className="rounded-md border border-stone-300 px-4 py-2 text-sm font-bold transition hover:border-stone-900"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() =>
                  setCalendarMonth(
                    (current) =>
                      new Date(
                        current.getFullYear(),
                        current.getMonth() + 1,
                        1,
                      ),
                  )
                }
                className="rounded-md border border-stone-300 px-4 py-2 text-sm font-bold transition hover:border-stone-900"
              >
                Next
              </button>
              <button
                type="button"
                onClick={loadAppointments}
                disabled={loading}
                className="rounded-md bg-stone-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-800 disabled:opacity-60"
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          {loadError ? (
            <div className="m-6 rounded-md border border-amber-300 bg-amber-50 px-5 py-4 text-amber-900">
              <p className="font-bold">Appointments could not be loaded.</p>
              <p className="mt-1 text-sm">
                Confirm the table is named <code>appointments</code> and that
                the signed-in administrator has permission to read it.
              </p>
            </div>
          ) : null}

          {loading ? (
            <div className="px-6 py-14 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-red-800" />
              <p className="mt-4 font-semibold text-stone-600">
                Loading appointments...
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                <div className="grid grid-cols-7 border-b border-stone-200 bg-stone-50">
                  {WEEKDAYS.map((weekday) => (
                    <div
                      key={weekday}
                      className="px-3 py-3 text-center text-xs font-black uppercase tracking-[0.16em] text-stone-500"
                    >
                      {weekday}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7">
                  {calendarDays.map((day) => {
                    const dayAppointments =
                      appointmentsByDay.get(dateKey(day)) ?? [];
                    const inCurrentMonth =
                      day.getMonth() === calendarMonth.getMonth();
                    const isToday = sameDay(day, new Date());

                    return (
                      <div
                        key={dateKey(day)}
                        className={`min-h-36 border-b border-r border-stone-200 p-2 ${inCurrentMonth ? "bg-white" : "bg-stone-50"}`}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span
                            className={`flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-sm font-black ${isToday ? "bg-red-800 text-white" : inCurrentMonth ? "text-stone-900" : "text-stone-400"}`}
                          >
                            {day.getDate()}
                          </span>
                          {dayAppointments.length > 0 ? (
                            <span className="text-xs font-bold text-stone-400">
                              {dayAppointments.length}
                            </span>
                          ) : null}
                        </div>

                        <div className="space-y-1.5">
                          {dayAppointments.map((appointment, index) => {
                            const name = getAppointmentName(appointment);
                            const animal = getAppointmentAnimal(appointment);
                            const appointmentDate =
                              getAppointmentDate(appointment);
                            const time = formatTime(
                              appointment,
                              appointmentDate,
                            );
                            const appointmentKey =
                              appointment.id !== undefined
                                ? String(appointment.id)
                                : `${dateKey(day)}-${index}`;

                            return (
                              <button
                                key={appointmentKey}
                                type="button"
                                onClick={() => openAppointment(appointment)}
                                className={`block w-full touch-manipulation rounded-md border px-2 py-2 text-left text-xs font-semibold transition ${animalClasses(animal)}`}
                              >
                                <span className="block truncate font-black">
                                  {name}
                                </span>
                                <span className="mt-0.5 block truncate opacity-80">
                                  {animal}
                                  {time ? ` · ${time}` : ""}
                                </span>
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

      {browserReady && selectedAppointment
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-stone-950/70 p-4 sm:items-center"
              role="dialog"
              aria-modal="true"
              aria-label="Booking details"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  setSelectedAppointment(null);
                }
              }}
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <div
                className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl"
                onMouseDown={(event) => event.stopPropagation()}
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                <div className="flex items-start justify-between border-b border-stone-200 px-6 py-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-800">
                      Booking Details
                    </p>
                    <h2 className="mt-1 text-2xl font-black">
                      {getAppointmentName(selectedAppointment)}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedAppointment(null)}
                    className="rounded-md px-3 py-2 text-xl font-black text-stone-500 transition hover:bg-stone-100 hover:text-stone-950"
                    aria-label="Close booking details"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-5 px-6 py-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-500">
                        Animal
                      </p>
                      <p className="mt-1 font-bold">
                        {getAppointmentAnimal(selectedAppointment)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-500">
                        Status
                      </p>
                      <span
                        className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] ${statusClasses(getAppointmentStatus(selectedAppointment))}`}
                      >
                        {getAppointmentStatus(selectedAppointment)}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-500">
                        Date
                      </p>
                      <p className="mt-1 font-bold">
                        {formatDate(getAppointmentDate(selectedAppointment))}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-500">
                        Time
                      </p>
                      <p className="mt-1 font-bold">
                        {formatTime(
                          selectedAppointment,
                          getAppointmentDate(selectedAppointment),
                        ) || "Not listed"}
                      </p>
                    </div>
                  </div>

                  {getOwnerContacts(selectedAppointment).length > 0 ? (
                    <div className="rounded-lg bg-red-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-800">
                        Beef Owner
                        {getOwnerContacts(selectedAppointment).length === 1
                          ? ""
                          : "s"}
                      </p>
                      <div className="mt-2 space-y-3">
                        {getOwnerContacts(selectedAppointment).map(
                          (ownerContact) => (
                            <div key={ownerContact.customerId}>
                              <p className="font-black text-stone-950">
                                {ownerContact.name}
                              </p>
                              {ownerContact.phone ? (
                                <a
                                  href={`tel:${ownerContact.phone}`}
                                  className="mt-1 inline-block font-bold text-red-800 underline decoration-red-300 underline-offset-4"
                                >
                                  {ownerContact.phone}
                                </a>
                              ) : (
                                <p className="mt-1 text-sm font-semibold text-stone-500">
                                  No phone number listed
                                </p>
                              )}
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-amber-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-800">
                        Beef Owner
                      </p>
                      <p className="mt-1 font-bold text-amber-950">
                        No customer share name was found for this booking.
                      </p>
                    </div>
                  )}

                  <div className="rounded-lg border border-stone-200 bg-stone-50 p-5">
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-[0.16em] text-stone-600">
                        Hanging Weight (lbs)
                      </span>
                      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={hangingWeight}
                          onChange={(event) =>
                            setHangingWeight(event.target.value)
                          }
                          placeholder="Enter hanging weight"
                          className="min-w-0 flex-1 rounded-md border border-stone-300 bg-white px-4 py-3 font-bold outline-none focus:border-red-800 focus:ring-2 focus:ring-red-100"
                        />
                        <button
                          type="button"
                          onClick={saveHangingWeight}
                          disabled={
                            savingWeight ||
                            selectedAppointment.animal_id === undefined
                          }
                          className="rounded-md bg-stone-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {savingWeight ? "Saving..." : "Save Hanging Weight"}
                        </button>
                      </div>
                    </label>
                  </div>

                  <div className="rounded-lg border border-red-200 bg-red-50 p-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-800">
                          Customer Cut Sheet
                        </p>
                        <p className="mt-1 font-bold text-stone-950">
                          {selectedAppointment.cut_sheet_unlocked
                            ? "Unlocked"
                            : "Locked"}
                        </p>
                      </div>
                      {selectedAppointment.cut_sheet_token ? (
                        <a
                          href={`/cut-sheet/${String(selectedAppointment.cut_sheet_token)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-bold text-red-900 transition hover:bg-red-100"
                        >
                          View Cut Sheet Link
                        </a>
                      ) : null}
                    </div>

                    {selectedAppointment.cut_sheet_id ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() =>
                            selectedAppointment.cut_sheet_unlocked
                              ? copyCutSheetMessage()
                              : unlockCutSheet(true)
                          }
                          disabled={Boolean(unlockingCutSheet)}
                          className="rounded-md bg-red-800 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {unlockingCutSheet === "copy"
                            ? "Unlocking..."
                            : selectedAppointment.cut_sheet_unlocked
                              ? "Copy Cut Sheet Message"
                              : "Unlock + Copy Message"}
                        </button>
                        <button
                          type="button"
                          onClick={() => unlockCutSheet(false)}
                          disabled={
                            Boolean(unlockingCutSheet) ||
                            Boolean(selectedAppointment.cut_sheet_unlocked)
                          }
                          className="rounded-md border border-stone-300 bg-white px-4 py-3 text-sm font-bold text-stone-900 transition hover:border-stone-950 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {unlockingCutSheet === "no-copy"
                            ? "Unlocking..."
                            : selectedAppointment.cut_sheet_unlocked
                              ? "Already Unlocked"
                              : "Unlock Without Copying"}
                        </button>
                      </div>
                    ) : (
                      <p className="mt-4 rounded-md bg-amber-100 px-4 py-3 text-sm font-bold text-amber-950">
                        No cut sheet is connected to this appointment.
                      </p>
                    )}
                  </div>

                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">
                        Ready for Pickup
                      </p>
                      <p className="mt-1 text-sm font-semibold text-stone-700">
                        Mark the animal ready and optionally copy the customer
                        message for manual sending.
                      </p>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => markReadyForPickup(true)}
                        disabled={
                          Boolean(pickupAction) ||
                          selectedAppointment.animal_id === undefined
                        }
                        className="rounded-md bg-emerald-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {pickupAction === "copy"
                          ? "Saving..."
                          : "Ready for Pickup + Copy Message"}
                      </button>
                      <button
                        type="button"
                        onClick={() => markReadyForPickup(false)}
                        disabled={
                          Boolean(pickupAction) ||
                          selectedAppointment.animal_id === undefined
                        }
                        className="rounded-md border border-emerald-300 bg-white px-4 py-3 text-sm font-bold text-emerald-900 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {pickupAction === "no-copy"
                          ? "Saving..."
                          : "Ready for Pickup Without Copying"}
                      </button>
                    </div>
                  </div>

                  {getMessageCustomerPhone(selectedAppointment) ? (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-500">
                        Message Phone
                      </p>
                      <p className="mt-1 font-bold">
                        {getMessageCustomerPhone(selectedAppointment)}
                      </p>
                    </div>
                  ) : null}

                  {getString(selectedAppointment, [
                    "email",
                    "customer_email",
                  ]) ? (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-500">
                        Email
                      </p>
                      <p className="mt-1 break-all font-bold">
                        {getString(selectedAppointment, [
                          "email",
                          "customer_email",
                        ])}
                      </p>
                    </div>
                  ) : null}

                  {getString(selectedAppointment, [
                    "notes",
                    "customer_notes",
                    "special_instructions",
                    "comments",
                  ]) ? (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-500">
                        Notes
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-stone-700">
                        {getString(selectedAppointment, [
                          "notes",
                          "customer_notes",
                          "special_instructions",
                          "comments",
                        ])}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-stone-200 px-6 py-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedAppointment(null)}
                    className="rounded-md border border-stone-300 px-5 py-3 text-sm font-bold transition hover:border-stone-950"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteBooking}
                    disabled={deleting || selectedAppointment.id === undefined}
                    className="rounded-md bg-red-800 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deleting ? "Deleting..." : "Delete Booking"}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </main>
  );
}
