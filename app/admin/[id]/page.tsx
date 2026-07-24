"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../supabase";

type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
};

type Animal = {
  id: string;
  status: string;
  hanging_weight: number | null;
  kill_date: string | null;
};

type Appointment = {
  id: string;
  animal_type: string;
  booking_type: string;
  dropoff_date: string;
  dropoff_time: string;
  customers: Customer | null;
  animals: Animal[];
};

type CutSheet = {
  id: string;
  secure_token: string;
  unlocked: boolean;
  text_sent: boolean;
  contact_method: "text" | "call" | "none";
};


type HistoryAnimal = {
  id: string;
  status: string;
};

type HistoryAppointment = {
  id: string;
  animal_type: string;
  dropoff_date: string;
  dropoff_time: string;
  animals: HistoryAnimal[];
};

type HistoryCutSheet = {
  id: string;
  animal_id: string;
  animal_type: string;
  secure_token: string;
  submitted_at: string | null;
  form_data: Record<string, string | boolean> | null;
};


function createReadyMessage(customerName: string) {
  return (
    `Hello ${customerName || "Customer"}, your animal is processed and ready ` +
    `for pickup at Apex Custom Butchering. Please give us two days to get ` +
    `your meat completely frozen. If you could bring coolers or boxes to put ` +
    `your meat in, that would be great. We're looking forward to seeing you soon!`
  );
}

export default function AppointmentDetailPage() {
  const params = useParams();
  const appointmentId = params.id as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [cutSheet, setCutSheet] = useState<CutSheet | null>(null);

  const [loading, setLoading] = useState(true);
  const [hangingWeight, setHangingWeight] = useState("");
  const [killDate, setKillDate] = useState("");
  const [status, setStatus] = useState("scheduled");
  const [message, setMessage] = useState("");
  const [readyMessage, setReadyMessage] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [history, setHistory] = useState<HistoryAppointment[]>([]);
  const [historyCutSheets, setHistoryCutSheets] = useState<HistoryCutSheet[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyMessage, setHistoryMessage] = useState("");

  async function loadCustomerHistory(customer: Customer) {
    if (!customer.phone) {
      setHistory([]);
      setHistoryCutSheets([]);
      return;
    }

    setHistoryLoading(true);
    setHistoryMessage("");

    const { data: matchingCustomers, error: customerError } =
      await supabase
        .from("customers")
        .select("id")
        .eq("phone", customer.phone);

    if (customerError) {
      console.error(customerError);
      setHistoryMessage(`History error: ${customerError.message}`);
      setHistoryLoading(false);
      return;
    }

    const customerIds = (matchingCustomers || []).map(
      (item: { id: string }) => item.id
    );

    if (customerIds.length === 0) {
      setHistory([]);
      setHistoryCutSheets([]);
      setHistoryLoading(false);
      return;
    }

    const { data: appointmentRows, error: appointmentError } =
      await supabase
        .from("appointments")
        .select(`
          id,
          animal_type,
          dropoff_date,
          dropoff_time,
          animals (
            id,
            status
          )
        `)
        .in("customer_id", customerIds)
        .order("dropoff_date", { ascending: false })
        .order("dropoff_time", { ascending: false });

    if (appointmentError) {
      console.error(appointmentError);
      setHistoryMessage(`History error: ${appointmentError.message}`);
      setHistoryLoading(false);
      return;
    }

    const loadedHistory =
      (appointmentRows || []) as unknown as HistoryAppointment[];

    setHistory(loadedHistory);

    const animalIds = loadedHistory.flatMap((item) =>
      (item.animals || []).map((animal) => animal.id)
    );

    if (animalIds.length === 0) {
      setHistoryCutSheets([]);
      setHistoryLoading(false);
      return;
    }

    const { data: cutSheetRows, error: cutSheetError } =
      await supabase
        .from("cut_sheets")
        .select(`
          id,
          animal_id,
          animal_type,
          secure_token,
          submitted_at,
          form_data
        `)
        .in("animal_id", animalIds);

    if (cutSheetError) {
      console.error(cutSheetError);
      setHistoryMessage(`Cut-sheet history error: ${cutSheetError.message}`);
    } else {
      setHistoryCutSheets(
        (cutSheetRows || []) as HistoryCutSheet[]
      );
    }

    setHistoryLoading(false);
  }

  useEffect(() => {
    async function loadAppointment() {
      setLoading(true);

      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          animal_type,
          booking_type,
          dropoff_date,
          dropoff_time,
          customers (
            id,
            name,
            phone,
            email
          ),
          animals (
            id,
            status,
            hanging_weight,
            kill_date
          )
        `)
        .eq("id", appointmentId)
        .single();

      if (error) {
        console.error(error);
        setMessage(`Appointment error: ${error.message}`);
        setLoading(false);
        return;
      }

      const loadedAppointment = data as unknown as Appointment;
      setAppointment(loadedAppointment);
      setReadyMessage(
        createReadyMessage(
          loadedAppointment.customers?.name || "Customer"
        )
      );

      if (loadedAppointment.customers) {
        await loadCustomerHistory(loadedAppointment.customers);
      }

      const animal = loadedAppointment.animals?.[0];

      if (animal) {
        let currentStatus = animal.status || "scheduled";

        if (currentStatus === "cut_sheet_submitted") {
          const { error: processingError } = await supabase
            .from("animals")
            .update({ status: "in_processing" })
            .eq("id", animal.id);

          if (processingError) {
            console.error(processingError);
            setMessage(
              `Could not automatically start processing: ${processingError.message}`
            );
          } else {
            currentStatus = "in_processing";
            animal.status = "in_processing";
            setMessage(
              "Cut sheet opened. Status automatically changed to In Processing."
            );
          }
        }

        setHangingWeight(animal.hanging_weight?.toString() || "");
        setKillDate(animal.kill_date || "");
        setStatus(currentStatus);

        const { data: savedCutSheet, error: cutSheetError } = await supabase
          .from("cut_sheets")
          .select(`
            id,
            secure_token,
            unlocked,
            text_sent,
            contact_method
          `)
          .eq("animal_id", animal.id)
          .maybeSingle();

        if (cutSheetError) {
          console.error(cutSheetError);
        } else if (savedCutSheet) {
          setCutSheet(savedCutSheet as CutSheet);
        }
      }

      setLoading(false);
    }

    if (appointmentId) {
      loadAppointment();
    }
  }, [appointmentId]);

  async function updateAnimal(
    updates: Partial<Pick<Animal, "status" | "hanging_weight" | "kill_date">>,
    successMessage: string
  ) {
    const animal = appointment?.animals?.[0];

    if (!animal) {
      setMessage("No animal record was found.");
      return false;
    }

    setMessage("Saving...");

    const { error } = await supabase
      .from("animals")
      .update(updates)
      .eq("id", animal.id);

    if (error) {
      console.error(error);
      setMessage(`Animal error: ${error.message}`);
      return false;
    }

    setStatus(updates.status || status);

    setAppointment((current) => {
      if (!current) return current;

      return {
        ...current,
        animals: current.animals.map((item) =>
          item.id === animal.id ? { ...item, ...updates } : item
        ),
      };
    });

    setMessage(successMessage);
    return true;
  }

  async function saveShopInformation() {
    const numericWeight = hangingWeight
      ? Number.parseFloat(hangingWeight)
      : null;

    if (hangingWeight && Number.isNaN(numericWeight)) {
      setMessage("Hanging weight must be a number.");
      return;
    }

    const nextStatus =
      status === "scheduled" && killDate
        ? "killed"
        : status;

    const saved = await updateAnimal(
      {
        hanging_weight: numericWeight,
        kill_date: killDate || null,
        status: nextStatus,
      },
      nextStatus !== status
        ? "Processing information saved. Status changed to killed."
        : "Processing information saved."
    );

    if (saved) {
      setStatus(nextStatus);
    }
  }

  async function getOrCreateCutSheet(): Promise<CutSheet | null> {
    if (cutSheet) return cutSheet;

    const animal = appointment?.animals?.[0];
    const customer = appointment?.customers;

    if (!animal || !customer || !appointment) {
      setMessage("Animal or customer information is missing.");
      return null;
    }

    const { data, error } = await supabase
      .from("cut_sheets")
      .insert({
        animal_id: animal.id,
        customer_id: customer.id,
        animal_type: appointment.animal_type,
        form_data: {},
        unlocked: false,
        text_sent: false,
        contact_method: "none",
      })
      .select(`
        id,
        secure_token,
        unlocked,
        text_sent,
        contact_method
      `)
      .single();

    if (error) {
      console.error(error);
      setMessage(`Cut-sheet error: ${error.message}`);
      return null;
    }

    const createdCutSheet = data as CutSheet;
    setCutSheet(createdCutSheet);

    return createdCutSheet;
  }

  async function unlockCutSheet(sendText: boolean) {
    const customer = appointment?.customers;
    const animal = appointment?.animals?.[0];

    if (!customer || !animal) {
      setMessage("Customer or animal information is missing.");
      return;
    }

    if (!hangingWeight) {
      setMessage("Enter the hanging weight before unlocking the cut sheet.");
      return;
    }

    const savedSheet = await getOrCreateCutSheet();

    if (!savedSheet) return;

    setMessage("Unlocking cut sheet...");

    const contactMethod = sendText ? "text" : "call";

    const { error: updateError } = await supabase
      .from("cut_sheets")
      .update({
        unlocked: true,
        contact_method: contactMethod,
      })
      .eq("id", savedSheet.id);

    if (updateError) {
      console.error(updateError);
      setMessage(`Cut-sheet error: ${updateError.message}`);
      return;
    }

    const cutSheetLink =
      typeof window === "undefined"
        ? `/cut-sheet/${savedSheet.secure_token}`
        : `${window.location.origin}/cut-sheet/${savedSheet.secure_token}`;

    if (sendText) {
      const textMessage =
        `APEX Custom Butchering: Your animal has been received. ` +
        `Hanging weight: ${hangingWeight} lbs. ` +
        `Complete your cut order here: ${cutSheetLink}`;

      const { error: notificationError } = await supabase
        .from("notifications")
        .insert({
          customer_id: customer.id,
          notification_type: "cut_sheet_link",
          message: textMessage,
          sent: false,
        });

      if (notificationError) {
        console.error(notificationError);
        setMessage(
          `The cut sheet was unlocked, but the text could not be queued: ${notificationError.message}`
        );
        return;
      }
    }

    await updateAnimal(
      {
        hanging_weight: Number.parseFloat(hangingWeight),
        status: "waiting_on_cut_sheet",
      },
      sendText
        ? "Cut sheet unlocked and text queued."
        : "Cut sheet unlocked. Customer marked for a phone call."
    );

    setCutSheet({
      ...savedSheet,
      unlocked: true,
      contact_method: contactMethod,
    });
  }

  async function copyToClipboard(
    value: string,
    successMessage: string
  ) {
    if (!value.trim()) {
      setCopyMessage("There is nothing to copy.");
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setCopyMessage(successMessage);
    } catch (error) {
      console.error(error);
      setCopyMessage(
        "Copying was blocked by the browser. Select the text and copy it manually."
      );
    }
  }

  async function markReadyForPickup() {
    const saved = await updateAnimal(
      {
        status: "ready_for_pickup",
      },
      "Animal marked ready for pickup."
    );

    if (saved) {
      setStatus("ready_for_pickup");
    }
  }

  async function copyLastCutSheet() {
    const animal = appointment?.animals?.[0];

    if (!appointment || !animal) {
      setMessage("The current animal record is missing.");
      return;
    }

    const previousSheet = historyCutSheets
      .filter(
        (sheet) =>
          sheet.animal_id !== animal.id &&
          sheet.animal_type === appointment.animal_type &&
          sheet.form_data
      )
      .sort((first, second) => {
        const firstTime = first.submitted_at
          ? new Date(first.submitted_at).getTime()
          : 0;

        const secondTime = second.submitted_at
          ? new Date(second.submitted_at).getTime()
          : 0;

        return secondTime - firstTime;
      })[0];

    if (!previousSheet?.form_data) {
      setMessage(
        `No previous ${appointment.animal_type} cut sheet was found for this customer.`
      );
      return;
    }

    const currentSheet = await getOrCreateCutSheet();

    if (!currentSheet) {
      return;
    }

    const { error } = await supabase
      .from("cut_sheets")
      .update({
        form_data: previousSheet.form_data,
      })
      .eq("id", currentSheet.id);

    if (error) {
      console.error(error);
      setMessage(`Copy error: ${error.message}`);
      return;
    }

    setMessage(
      "The previous cut-sheet choices were copied. Open the current cut sheet to review them."
    );
  }

  if (loading) {
    return <main className="p-10 text-2xl">Loading appointment...</main>;
  }

  if (!appointment) {
    return <main className="p-10 text-2xl">Appointment not found.</main>;
  }

  const customer = appointment.customers;
  const animal = appointment.animals?.[0];

  return (
    <main className="min-h-screen bg-gray-100 py-10">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">Appointment Details</h1>

            <p className="mt-2 text-gray-600">
              Manage check-in, hanging weight, status, and cut-sheet access.
            </p>
          </div>

          <a
            href="/admin"
            className="rounded-lg border bg-white px-5 py-3 font-bold hover:bg-gray-50"
          >
            Back to Dashboard
          </a>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-xl bg-white p-6 shadow">
            <h2 className="mb-4 text-2xl font-bold">Customer</h2>

            <div className="space-y-2">
              <p>
                <strong>Name:</strong> {customer?.name || "Unknown"}
              </p>

              <p>
                <strong>Phone:</strong> {customer?.phone || "None"}
              </p>

              <p>
                <strong>Email:</strong> {customer?.email || "None"}
              </p>
            </div>
          </section>

          <section className="rounded-xl bg-white p-6 shadow">
            <h2 className="mb-4 text-2xl font-bold">Appointment</h2>

            <div className="space-y-2">
              <p className="capitalize">
                <strong>Animal:</strong> {appointment.animal_type}
              </p>

              <p className="capitalize">
                <strong>Booking:</strong> {appointment.booking_type}
              </p>

              <p>
                <strong>Date:</strong> {appointment.dropoff_date}
              </p>

              <p>
                <strong>Time:</strong> {appointment.dropoff_time}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                <span className="capitalize">
                  {(animal?.status || "scheduled").replaceAll("_", " ")}
                </span>
              </p>
            </div>
          </section>

          <section className="rounded-xl bg-white p-6 shadow md:col-span-2">
            <h2 className="mb-5 text-2xl font-bold">Processing Information</h2>

            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <label className="mb-2 block font-semibold">
                  Hanging Weight
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={hangingWeight}
                  onChange={(event) => setHangingWeight(event.target.value)}
                  className="w-full rounded-lg border p-3"
                  placeholder="Enter pounds"
                />
              </div>

              <div>
                <label className="mb-2 block font-semibold">Kill Date</label>

                <input
                  type="date"
                  value={killDate}
                  onChange={(event) => setKillDate(event.target.value)}
                  className="w-full rounded-lg border p-3"
                />
              </div>

              <div>
                <label className="mb-2 block font-semibold">
                  Internal Status
                </label>

                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="w-full rounded-lg border p-3"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="killed">Killed</option>
                  <option value="waiting_on_cut_sheet">
                    Waiting on Cut Sheet
                  </option>
                  <option value="cut_sheet_submitted">
                    Cut Sheet Submitted
                  </option>
                  <option value="in_processing">In Processing</option>
                  <option value="ready_for_pickup">Ready for Pickup</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={saveShopInformation}
                className="rounded-lg bg-gray-900 px-5 py-3 font-bold text-white hover:bg-black"
              >
                Save Processing Information
              </button>
            </div>
          </section>

          <section className="rounded-xl bg-white p-6 shadow md:col-span-2">
            <h2 className="mb-3 text-2xl font-bold">Customer Cut Sheet</h2>

            <p className="mb-5 text-gray-600">
              The customer cannot complete the cut sheet until you unlock it.
              Texting remains optional.
            </p>

            <div className="mb-5 rounded-lg bg-gray-100 p-4">
              <p>
                <strong>Cut Sheet:</strong>{" "}
                {cutSheet?.unlocked ? "Unlocked" : "Locked"}
              </p>

              <p>
                <strong>Contact Method:</strong>{" "}
                <span className="capitalize">
                  {cutSheet?.contact_method || "Not selected"}
                </span>
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => unlockCutSheet(false)}
                className="rounded-lg border border-gray-900 bg-white px-5 py-3 font-bold hover:bg-gray-100"
              >
                Unlock Without Text
              </button>

              <button
                type="button"
                onClick={() => unlockCutSheet(true)}
                className="rounded-lg bg-green-700 px-5 py-3 font-bold text-white hover:bg-green-800"
              >
                Unlock and Queue Text
              </button>

              {cutSheet?.secure_token && (
                <a
                  href={`/cut-sheet/${cutSheet.secure_token}`}
                  target="_blank"
                  className="rounded-lg bg-gray-700 px-5 py-3 font-bold text-white hover:bg-gray-800"
                >
                  Open Cut Sheet Link
                </a>
              )}
            </div>
          </section>

          <section className="rounded-xl bg-white p-6 shadow md:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Customer History</h2>

                <p className="mt-2 text-gray-600">
                  Previous appointments found using the customer phone number.
                </p>
              </div>

              <button
                type="button"
                onClick={copyLastCutSheet}
                className="rounded-lg bg-red-700 px-5 py-3 font-bold text-white hover:bg-red-800"
              >
                Copy Last {appointment.animal_type} Cut Sheet
              </button>
            </div>

            {historyLoading && (
              <p className="mt-6 text-gray-600">
                Loading customer history...
              </p>
            )}

            {historyMessage && (
              <div className="mt-6 rounded-lg bg-yellow-50 p-4 font-bold text-yellow-900">
                {historyMessage}
              </div>
            )}

            {!historyLoading && history.length === 0 && (
              <p className="mt-6 text-gray-600">
                No previous appointments were found.
              </p>
            )}

            {!historyLoading && history.length > 0 && (
              <>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <HistoryStat label="Visits" value={history.length} />

                  <HistoryStat
                    label="Beef"
                    value={
                      history.filter(
                        (item) => item.animal_type === "beef"
                      ).length
                    }
                  />

                  <HistoryStat
                    label="Pork"
                    value={
                      history.filter(
                        (item) => item.animal_type === "pork"
                      ).length
                    }
                  />

                  <HistoryStat
                    label="Sheep"
                    value={
                      history.filter(
                        (item) => item.animal_type === "sheep"
                      ).length
                    }
                  />

                  <HistoryStat
                    label="Goat"
                    value={
                      history.filter(
                        (item) => item.animal_type === "goat"
                      ).length
                    }
                  />
                </div>

                <div className="mt-6 overflow-x-auto rounded-lg border">
                  <table className="min-w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-3 text-left">Date</th>
                        <th className="p-3 text-left">Animal</th>
                        <th className="p-3 text-left">Status</th>
                        <th className="p-3 text-left">Cut Sheet</th>
                      </tr>
                    </thead>

                    <tbody>
                      {history.map((item) => {
                        const historyAnimal = item.animals?.[0];

                        const historySheet =
                          historyCutSheets.find(
                            (sheet) =>
                              sheet.animal_id === historyAnimal?.id
                          );

                        return (
                          <tr
                            key={item.id}
                            className="border-t"
                          >
                            <td className="p-3">
                              {item.dropoff_date}
                            </td>

                            <td className="p-3 capitalize">
                              {item.animal_type}
                            </td>

                            <td className="p-3 capitalize">
                              {(
                                historyAnimal?.status || "scheduled"
                              ).replaceAll("_", " ")}
                            </td>

                            <td className="p-3">
                              {historySheet?.secure_token ? (
                                <a
                                  href={`/cut-sheet/${historySheet.secure_token}`}
                                  target="_blank"
                                  className="font-bold text-red-700 underline"
                                >
                                  Open Cut Sheet
                                </a>
                              ) : (
                                <span className="text-gray-500">
                                  No cut sheet
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>

          <section className="rounded-xl bg-white p-6 shadow md:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Customer Contact</h2>

                <p className="mt-2 text-gray-600">
                  Edit the message, copy it, then paste it into Microsoft
                  Phone Link to send from the shop phone.
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-sm font-bold ${
                  status === "ready_for_pickup"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-900"
                }`}
              >
                {status === "ready_for_pickup"
                  ? "Ready for Pickup"
                  : "Not Ready Yet"}
              </span>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="rounded-lg bg-gray-100 p-4">
                <p className="text-sm font-bold text-gray-500">
                  Customer
                </p>

                <p className="mt-1 text-lg font-bold">
                  {customer?.name || "Unknown"}
                </p>

                <p className="mt-4 text-sm font-bold text-gray-500">
                  Phone
                </p>

                <p className="mt-1 text-lg">
                  {customer?.phone || "No phone number"}
                </p>

                <button
                  type="button"
                  disabled={!customer?.phone}
                  onClick={() =>
                    copyToClipboard(
                      customer?.phone || "",
                      "Phone number copied."
                    )
                  }
                  className="mt-4 rounded-lg border border-gray-900 bg-white px-4 py-2 font-bold hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Copy Phone Number
                </button>
              </div>

              <div>
                <label className="mb-2 block font-bold">
                  Ready-for-Pickup Message
                </label>

                <textarea
                  rows={9}
                  value={readyMessage}
                  onChange={(event) =>
                    setReadyMessage(event.target.value)
                  }
                  className="w-full rounded-lg border p-4 leading-relaxed"
                />
              </div>
            </div>

            {copyMessage && (
              <div className="mt-5 rounded-lg bg-blue-50 p-4 font-bold text-blue-900">
                {copyMessage}
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    readyMessage,
                    "Ready-for-pickup message copied. Paste it into Phone Link."
                  )
                }
                className="rounded-lg bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800"
              >
                Copy Message
              </button>

              <button
                type="button"
                onClick={markReadyForPickup}
                className="rounded-lg bg-green-700 px-5 py-3 font-bold text-white hover:bg-green-800"
              >
                Mark Ready for Pickup
              </button>

            </div>
          </section>

          {message && (
            <section className="rounded-xl bg-yellow-50 p-5 font-bold text-yellow-900 shadow md:col-span-2">
              {message}
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

function HistoryStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg bg-gray-100 p-4">
      <p className="text-sm font-bold text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}