"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type DbRow = Record<string, unknown>;

type HistoryItem = {
  id: string;
  kind: "scheduled" | "fair" | "deer";
  animalType: string;
  date: string;
  cutSheetUrl: string;
  submittedAt: string;
  printedAt: string;
  hangingWeight: string;
  details: string;
};

type CustomerProfile = {
  key: string;
  name: string;
  phone: string;
  customerIds: string[];
  history: HistoryItem[];
};

type AnimalAssignment = {
  id: string;
  appointmentId: string;
  animalNumber: number;
  animalType: string;
  dropoffDate: string;
  producerName: string;
  producerPhone: string;
};

function asString(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function customerKey(name: string, phone: string) {
  const digits = normalizePhone(phone);
  if (digits) return `phone:${digits}`;
  return `name:${normalizeName(name)}`;
}

function formatDate(value: string) {
  if (!value) return "Date not listed";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function titleCase(value: string) {
  if (!value) return "Animal";
  return value
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function firstNonEmpty(...values: unknown[]) {
  for (const value of values) {
    const text = asString(value).trim();
    if (text) return text;
  }
  return "";
}

export default function CustomersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CustomerProfile | null>(null);
  const [assignments, setAssignments] = useState<AnimalAssignment[]>([]);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [assignmentSaving, setAssignmentSaving] = useState(false);
  const [assignmentMessage, setAssignmentMessage] = useState("");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerPortion, setNewCustomerPortion] = useState<"whole" | "halves" | "quarters">("whole");

  async function loadAnimalAssignments() {
    setAssignmentLoading(true);
    setAssignmentMessage("");

    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id,
        animal_type,
        dropoff_date,
        customers (name, phone),
        animals (id, animal_number, animal_type)
      `)
      .order("dropoff_date", { ascending: false });

    if (error) {
      console.error(error);
      setAssignmentMessage(`Could not load animals: ${error.message}`);
      setAssignments([]);
      setAssignmentLoading(false);
      return;
    }

    const rows: AnimalAssignment[] = [];
    for (const appointment of data ?? []) {
      const customer = Array.isArray(appointment.customers)
        ? appointment.customers[0]
        : appointment.customers;

      for (const animal of appointment.animals ?? []) {
        rows.push({
          id: String(animal.id),
          appointmentId: String(appointment.id),
          animalNumber: Number(animal.animal_number ?? 1),
          animalType: String(animal.animal_type ?? appointment.animal_type ?? "animal"),
          dropoffDate: String(appointment.dropoff_date ?? ""),
          producerName: String(customer?.name ?? "Unknown producer"),
          producerPhone: String(customer?.phone ?? ""),
        });
      }
    }

    setAssignments(rows);
    setAssignmentLoading(false);
  }

  useEffect(() => {
    let active = true;

    async function initialize() {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!active) return;
      if (authError || !user) {
        router.replace("/login");
        return;
      }

      await Promise.all([loadCustomers(), loadAnimalAssignments()]);
    }

    void initialize();
    return () => {
      active = false;
    };
  }, [router]);

  async function loadCustomers() {
    setLoading(true);
    setMessage("");

    const [customerResult, appointmentResult, animalResult, cutSheetResult, deerResult] =
      await Promise.all([
        supabase.from("customers").select("id, name, phone"),
        supabase
          .from("appointments")
          .select("id, customer_id, booking_type, animal_type, dropoff_date, created_at"),
        supabase
          .from("animals")
          .select("id, appointment_id, animal_type, animal_number, hanging_weight, kill_date"),
        supabase
          .from("cut_sheets")
          .select(
            "id, animal_id, customer_id, animal_type, secure_token, submitted_at, printed_at, form_data",
          ),
        supabase
          .from("deer_cut_sheets")
          .select(
            "id, secure_token, customer_name, phone, submitted_at, printed_at, created_at, form_data",
          ),
      ]);

    const failures = [
      ["customers", customerResult.error],
      ["appointments", appointmentResult.error],
      ["animals", animalResult.error],
      ["cut sheets", cutSheetResult.error],
      ["deer cut sheets", deerResult.error],
    ].filter(([, error]) => Boolean(error));

    if (failures.length) {
      console.error("Customer history load errors:", failures);
      setMessage(
        `Some customer history could not be loaded: ${failures
          .map(([label]) => label)
          .join(", ")}.`,
      );
    }

    const customerRows = (customerResult.data ?? []) as DbRow[];
    const appointmentRows = (appointmentResult.data ?? []) as DbRow[];
    const animalRows = (animalResult.data ?? []) as DbRow[];
    const cutSheetRows = (cutSheetResult.data ?? []) as DbRow[];
    const deerRows = (deerResult.data ?? []) as DbRow[];

    const profiles = new Map<string, CustomerProfile>();
    const customerIdToKey = new Map<string, string>();

    function ensureProfile(name: string, phone: string) {
      const cleanName = name.trim() || "Customer";
      const cleanPhone = phone.trim();
      const key = customerKey(cleanName, cleanPhone);

      const existing = profiles.get(key);
      if (existing) {
        if (!existing.phone && cleanPhone) existing.phone = cleanPhone;
        if ((!existing.name || existing.name === "Customer") && cleanName) {
          existing.name = cleanName;
        }
        return existing;
      }

      const created: CustomerProfile = {
        key,
        name: cleanName,
        phone: cleanPhone,
        customerIds: [],
        history: [],
      };
      profiles.set(key, created);
      return created;
    }

    for (const row of customerRows) {
      const id = asString(row.id);
      const profile = ensureProfile(asString(row.name), asString(row.phone));
      if (id && !profile.customerIds.includes(id)) profile.customerIds.push(id);
      if (id) customerIdToKey.set(id, profile.key);
    }

    const appointmentsById = new Map<string, DbRow>();
    for (const row of appointmentRows) appointmentsById.set(asString(row.id), row);

    const animalsById = new Map<string, DbRow>();
    const animalsByAppointment = new Map<string, DbRow[]>();
    for (const row of animalRows) {
      const animalId = asString(row.id);
      const appointmentId = asString(row.appointment_id);
      if (animalId) animalsById.set(animalId, row);
      if (appointmentId) {
        const list = animalsByAppointment.get(appointmentId) ?? [];
        list.push(row);
        animalsByAppointment.set(appointmentId, list);
      }
    }

    // Scheduled and fair history. This gives the customer a history entry even if
    // a cut sheet was never submitted.
    for (const appointment of appointmentRows) {
      const customerId = asString(appointment.customer_id);
      const key = customerIdToKey.get(customerId);
      if (!key) continue;
      const profile = profiles.get(key);
      if (!profile) continue;

      const appointmentId = asString(appointment.id);
      const bookingType = asString(appointment.booking_type).toLowerCase();
      const isFair = bookingType === "fair";
      const relatedAnimals = animalsByAppointment.get(appointmentId) ?? [];

      if (!relatedAnimals.length) {
        profile.history.push({
          id: `appointment:${appointmentId}`,
          kind: isFair ? "fair" : "scheduled",
          animalType: firstNonEmpty(appointment.animal_type, "animal"),
          date: firstNonEmpty(appointment.dropoff_date, appointment.created_at),
          cutSheetUrl: "",
          submittedAt: "",
          printedAt: "",
          hangingWeight: "",
          details: isFair ? "Fair animal" : "Scheduled processing",
        });
      }
    }

    // Livestock cut sheets. These are tied directly to customers and animals.
    for (const sheet of cutSheetRows) {
      const customerId = asString(sheet.customer_id);
      let key = customerIdToKey.get(customerId);

      const formData =
        sheet.form_data && typeof sheet.form_data === "object"
          ? (sheet.form_data as DbRow)
          : {};

      if (!key) {
        const name = firstNonEmpty(formData.customer_name, "Customer");
        const phone = firstNonEmpty(formData.phone_number, formData.phone);
        const profile = ensureProfile(name, phone);
        key = profile.key;
      }

      const profile = profiles.get(key);
      if (!profile) continue;

      const animal = animalsById.get(asString(sheet.animal_id));
      const appointment = animal
        ? appointmentsById.get(asString(animal.appointment_id))
        : undefined;
      const bookingType = asString(appointment?.booking_type).toLowerCase();
      const isFair = bookingType === "fair" || formData.fair_animal === true;
      const animalType = firstNonEmpty(
        sheet.animal_type,
        animal?.animal_type,
        appointment?.animal_type,
        "animal",
      );
      const token = asString(sheet.secure_token);

      profile.history.push({
        id: `cut:${asString(sheet.id)}`,
        kind: isFair ? "fair" : "scheduled",
        animalType,
        date: firstNonEmpty(
          appointment?.dropoff_date,
          sheet.submitted_at,
          appointment?.created_at,
        ),
        cutSheetUrl: token ? `/cut-sheet/${token}` : "",
        submittedAt: asString(sheet.submitted_at),
        printedAt: asString(sheet.printed_at),
        hangingWeight: firstNonEmpty(animal?.hanging_weight),
        details: isFair ? "Fair animal" : "Scheduled processing",
      });
    }

    // Deer is stored separately from the customers table, so match it by phone/name.
    // Deer-only customers are still added to this directory.
    for (const deer of deerRows) {
      const name = asString(deer.customer_name);
      const phone = asString(deer.phone);
      const profile = ensureProfile(name, phone);
      const token = asString(deer.secure_token);

      profile.history.push({
        id: `deer:${asString(deer.id)}`,
        kind: "deer",
        animalType: "deer",
        date: firstNonEmpty(deer.created_at, deer.submitted_at),
        cutSheetUrl: token ? `/deer-cut-sheet/${token}` : "",
        submittedAt: asString(deer.submitted_at),
        printedAt: asString(deer.printed_at),
        hangingWeight: "",
        details: "Deer drop-off",
      });
    }

    const finalProfiles = Array.from(profiles.values())
      .map((profile) => ({
        ...profile,
        history: profile.history
          .filter(
            (item, index, all) =>
              all.findIndex((candidate) => candidate.id === item.id) === index,
          )
          .sort((a, b) => {
            const aTime = a.date ? new Date(a.date).getTime() : 0;
            const bTime = b.date ? new Date(b.date).getTime() : 0;
            return bTime - aTime;
          }),
      }))
      .filter((profile) => profile.history.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name));

    setCustomers(finalProfiles);
    setLoading(false);
  }

  async function addCustomerToAnimal() {
    if (assignmentSaving) return;

    const assignment = assignments.find((item) => item.id === selectedAssignmentId);
    if (!assignment) {
      setAssignmentMessage("Choose the animal this customer belongs to.");
      return;
    }

    const name = newCustomerName.trim();
    const phone = newCustomerPhone.trim();

    if (!name || !phone) {
      setAssignmentMessage("Enter the customer's name and phone number.");
      return;
    }

    setAssignmentSaving(true);
    setAssignmentMessage("Adding customer and creating their cut sheet...");

    try {
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .insert({ name, phone, email: null })
        .select("id")
        .single();

      if (customerError || !customer?.id) {
        throw new Error(customerError?.message || "Could not create the customer.");
      }

      const { data: cutSheet, error: cutSheetError } = await supabase
        .from("cut_sheets")
        .insert({
          animal_id: assignment.id,
          customer_id: customer.id,
          animal_type: assignment.animalType.toLowerCase(),
          unlocked: true,
          text_sent: false,
          contact_method: "call",
          form_data: {
            customer_name: name,
            phone_number: phone,
            farmer_name: assignment.producerName,
            ...(assignment.animalType.toLowerCase() === "beef"
              ? {
                  portion_whole: newCustomerPortion === "whole",
                  portion_half: newCustomerPortion === "halves",
                  portion_quarter: newCustomerPortion === "quarters",
                }
              : {}),
          },
        })
        .select("secure_token")
        .single();

      if (cutSheetError || !cutSheet?.secure_token) {
        await supabase.from("customers").delete().eq("id", customer.id);
        throw new Error(cutSheetError?.message || "Could not create the customer's cut sheet.");
      }

      setAssignmentMessage(
        `${name} was added to ${assignment.producerName}'s ${assignment.animalType} #${assignment.animalNumber}. Their cut sheet is now available on the customer portal.`
      );
      setNewCustomerName("");
      setNewCustomerPhone("");
      setSelectedAssignmentId("");
      setAssignmentSearch("");
      setNewCustomerPortion("whole");
      await loadCustomers();
    } catch (error) {
      console.error(error);
      setAssignmentMessage(
        error instanceof Error ? error.message : "Could not add the customer."
      );
    } finally {
      setAssignmentSaving(false);
    }
  }

  const selectedAssignment = assignments.find((item) => item.id === selectedAssignmentId) ?? null;

  const currentBeefAssignments = useMemo(() => {
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    return assignments.filter((assignment) => {
      if (assignment.animalType.toLowerCase() !== "beef") return false;
      if (!assignment.dropoffDate || assignment.dropoffDate < todayKey) return false;

      const query = assignmentSearch.trim().toLowerCase();
      if (!query) return true;

      const haystack = [
        assignment.producerName,
        assignment.producerPhone,
        `beef ${assignment.animalNumber}`,
        String(assignment.animalNumber),
        assignment.dropoffDate,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [assignments, assignmentSearch]);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return customers;
    const digits = normalizePhone(query);

    return customers.filter((customer) => {
      const nameMatch = customer.name.toLowerCase().includes(query);
      const phoneMatch = digits
        ? normalizePhone(customer.phone).includes(digits)
        : customer.phone.toLowerCase().includes(query);
      const historyMatch = customer.history.some(
        (item) =>
          item.animalType.toLowerCase().includes(query) ||
          item.details.toLowerCase().includes(query),
      );
      return nameMatch || phoneMatch || historyMatch;
    });
  }, [customers, search]);

  return (
    <main className="min-h-screen bg-stone-100 text-stone-950">
      <header className="bg-stone-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-red-400">
              Apex Custom Butchering
            </p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-tight">
              Customers
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => { void loadCustomers(); void loadAnimalAssignments(); }}
              disabled={loading || assignmentLoading}
              className="rounded-md border border-white/25 px-4 py-3 text-sm font-bold hover:bg-white hover:text-stone-950 disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
            <Link
              href="/admin"
              className="rounded-md bg-red-800 px-4 py-3 text-sm font-bold hover:bg-red-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:px-12">
        <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-800">Add Customer to an Animal</p>
            <h2 className="mt-1 text-2xl font-black uppercase tracking-tight">Customer Cut-Sheet Assignment</h2>
            <p className="mt-2 max-w-3xl text-stone-600">
              Choose the producer's animal, then add the customer who owns that portion. This creates the customer's cut sheet and ties it to that exact animal.
            </p>
          </div>
          {assignmentMessage ? (
            <div className="mt-5 rounded-md border border-stone-300 bg-stone-50 px-4 py-3 font-semibold">{assignmentMessage}</div>
          ) : null}
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <label className="block">
                <span className="text-sm font-black uppercase tracking-wide">Search Current Beef</span>
                <input
                  type="search"
                  value={assignmentSearch}
                  onChange={(event) => {
                    setAssignmentSearch(event.target.value);
                    setSelectedAssignmentId("");
                  }}
                  placeholder="Search producer or beef #..."
                  className="mt-2 w-full rounded-md border border-stone-300 bg-white px-4 py-3 font-semibold outline-none focus:border-red-800 focus:ring-2 focus:ring-red-100"
                />
              </label>
              <p className="mt-2 text-sm font-semibold text-stone-500">
                Only current and future beef is shown. Old beef is automatically left out.
              </p>

              <label className="mt-4 block">
                <span className="text-sm font-black uppercase tracking-wide">Which Beef?</span>
                <select
                  value={selectedAssignmentId}
                  onChange={(event) => setSelectedAssignmentId(event.target.value)}
                  className="mt-2 w-full rounded-md border border-stone-300 bg-white px-4 py-3 font-semibold"
                  disabled={assignmentLoading}
                >
                  <option value="">
                    {assignmentLoading ? "Loading current beef..." : currentBeefAssignments.length ? "Select producer / beef" : "No current beef found"}
                  </option>
                  {currentBeefAssignments.map((assignment) => (
                    <option key={assignment.id} value={assignment.id}>
                      {assignment.producerName} — Beef #{assignment.animalNumber} — {assignment.dropoffDate}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block">
              <span className="text-sm font-black uppercase tracking-wide">Customer Name</span>
              <input value={newCustomerName} onChange={(event) => setNewCustomerName(event.target.value)} placeholder="Ryan Smith" className="mt-2 w-full rounded-md border border-stone-300 px-4 py-3" />
            </label>
            <label className="block">
              <span className="text-sm font-black uppercase tracking-wide">Customer Phone</span>
              <input type="tel" value={newCustomerPhone} onChange={(event) => setNewCustomerPhone(event.target.value)} placeholder="989-555-1234" className="mt-2 w-full rounded-md border border-stone-300 px-4 py-3" />
            </label>
            {selectedAssignment?.animalType.toLowerCase() === "beef" ? (
              <label className="block lg:col-span-2">
                <span className="text-sm font-black uppercase tracking-wide">Beef Portion</span>
                <select value={newCustomerPortion} onChange={(event) => setNewCustomerPortion(event.target.value as "whole" | "halves" | "quarters")} className="mt-2 w-full rounded-md border border-stone-300 bg-white px-4 py-3">
                  <option value="whole">Whole</option>
                  <option value="halves">Half</option>
                  <option value="quarters">Quarter</option>
                </select>
              </label>
            ) : null}
          </div>
          <button type="button" onClick={addCustomerToAnimal} disabled={assignmentSaving} className="mt-6 rounded-md bg-red-800 px-6 py-3 font-black text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
            {assignmentSaving ? "Adding Customer..." : "Add Customer & Create Cut Sheet"}
          </button>
        </section>

        <section className="mt-8 rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-800">
                Customer Directory
              </p>
              <h2 className="mt-1 text-2xl font-black uppercase tracking-tight">
                {customers.length} Customers
              </h2>
            </div>

            <label className="w-full lg:max-w-md">
              <span className="sr-only">Search customers</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, phone, deer, beef, pork..."
                className="w-full rounded-md border border-stone-300 bg-white px-4 py-3 font-semibold outline-none focus:border-red-800 focus:ring-2 focus:ring-red-100"
              />
            </label>
          </div>

          {message ? (
            <div className="mt-5 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 font-semibold text-amber-950">
              {message}
            </div>
          ) : null}

          {loading ? (
            <div className="py-16 text-center font-bold text-stone-600">
              Loading customers...
            </div>
          ) : filteredCustomers.length ? (
            <div className="mt-6 divide-y divide-stone-200 overflow-hidden rounded-lg border border-stone-200">
              {filteredCustomers.map((customer) => {
                const kinds = Array.from(
                  new Set(customer.history.map((item) => item.details)),
                );

                return (
                  <button
                    key={customer.key}
                    type="button"
                    onClick={() => setSelected(customer)}
                    className="flex w-full flex-col gap-3 bg-white px-5 py-5 text-left transition hover:bg-stone-50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-lg font-black">{customer.name}</p>
                      <p className="mt-1 font-semibold text-stone-600">
                        {customer.phone || "No phone number listed"}
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-sm font-bold text-stone-700">
                        {customer.history.length} processing record
                        {customer.history.length === 1 ? "" : "s"}
                      </p>
                      <p className="mt-1 text-sm text-stone-500">
                        {kinds.join(" · ")}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center">
              <p className="font-bold text-stone-700">No customers found.</p>
            </div>
          )}
        </section>
      </div>

      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Customer details for ${selected.name}`}
        >
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-stone-200 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-800">
                  Customer
                </p>
                <h2 className="mt-1 text-3xl font-black">{selected.name}</h2>
                <p className="mt-1 font-semibold text-stone-600">
                  {selected.phone || "No phone number listed"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-md px-3 py-2 text-2xl font-black text-stone-500 hover:bg-stone-100 hover:text-stone-950"
                aria-label="Close customer details"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500">
                Processing & Cut Sheet History
              </p>

              <div className="mt-4 space-y-4">
                {selected.history.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-lg border border-stone-200 bg-stone-50 p-5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-red-900">
                            {item.kind === "deer"
                              ? "Deer Drop-Off"
                              : item.kind === "fair"
                                ? "Fair Animal"
                                : "Scheduled"}
                          </span>
                          <span className="font-black">
                            {titleCase(item.animalType)}
                          </span>
                        </div>

                        <p className="mt-3 text-sm font-semibold text-stone-600">
                          {formatDate(item.date)}
                        </p>

                        {item.hangingWeight ? (
                          <p className="mt-1 text-sm font-semibold text-stone-600">
                            Hanging weight: {item.hangingWeight} lbs
                          </p>
                        ) : null}

                        {item.submittedAt ? (
                          <p className="mt-1 text-sm text-stone-500">
                            Cut sheet submitted {formatDate(item.submittedAt)}
                          </p>
                        ) : null}

                        {item.printedAt ? (
                          <p className="mt-1 text-sm text-stone-500">
                            Printed {formatDate(item.printedAt)}
                          </p>
                        ) : null}
                      </div>

                      {item.cutSheetUrl ? (
                        <a
                          href={item.cutSheetUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex shrink-0 items-center justify-center rounded-md bg-red-800 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
                        >
                          Open Cut Sheet
                        </a>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="flex justify-end border-t border-stone-200 px-6 py-5">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-md border border-stone-300 px-5 py-3 text-sm font-bold hover:border-stone-950"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}