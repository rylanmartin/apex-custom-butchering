"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type RequestStatus = "new" | "contacted" | "completed" | "declined";

type MeatRequest = {
  id: string;
  request_type: "beef" | "roaster_pig";
  customer_name: string;
  phone: string;
  beef_portion: "quarter" | "half" | "whole" | null;
  roaster_weight_lbs: number | null;
  status: RequestStatus;
  email_status: "pending" | "sent" | "failed";
  created_at: string;
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

function phoneHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

function requestDescription(request: MeatRequest) {
  if (request.request_type === "beef") {
    return `${request.beef_portion || "Unspecified"} beef`;
  }
  return `Roaster pig - ${request.roaster_weight_lbs || "Unspecified"} lbs hanging weight`;
}

export default function MeatRequestsAdminPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<MeatRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  async function loadRequests() {
    setLoading(true);
    const { data, error } = await supabase
      .from("meat_requests")
      .select(
        "id, request_type, customer_name, phone, beef_portion, roaster_weight_lbs, status, email_status, created_at",
      )
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`Could not load requests: ${error.message}`);
      setRequests([]);
    } else {
      setMessage("");
      setRequests((data ?? []) as MeatRequest[]);
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
      await loadRequests();
    }

    initialize();
    return () => {
      active = false;
    };
  }, [router]);

  const stats = useMemo(
    () => ({
      new: requests.filter((request) => request.status === "new").length,
      beef: requests.filter((request) => request.request_type === "beef")
        .length,
      roasters: requests.filter(
        (request) => request.request_type === "roaster_pig",
      ).length,
      completed: requests.filter((request) => request.status === "completed")
        .length,
    }),
    [requests],
  );

  async function updateStatus(id: string, status: RequestStatus) {
    setSavingId(id);
    setMessage("");
    const { error } = await supabase
      .from("meat_requests")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);

    setSavingId(null);
    if (error) {
      setMessage(`Could not update the request: ${error.message}`);
      return;
    }

    setRequests((current) =>
      current.map((request) =>
        request.id === id ? { ...request, status } : request,
      ),
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
              Beef and Roaster Requests
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadRequests}
              className="rounded-md border border-white/25 px-5 py-3 text-sm font-bold transition hover:bg-white hover:text-stone-950"
            >
              Refresh
            </button>
            <Link
              href="/admin"
              className="rounded-md bg-red-800 px-5 py-3 text-sm font-bold transition hover:bg-red-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["New Requests", stats.new],
            ["Beef Requests", stats.beef],
            ["Roaster Requests", stats.roasters],
            ["Completed", stats.completed],
          ].map(([label, value], index) => (
            <article
              key={String(label)}
              className={`rounded-xl p-6 shadow-sm ${index === 0 ? "bg-red-800 text-white" : "border border-stone-200 bg-white"}`}
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] opacity-75">
                {label}
              </p>
              <p className="mt-2 text-4xl font-black">{value}</p>
            </article>
          ))}
        </section>

        {message ? (
          <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4 font-bold text-amber-950">
            {message}
          </div>
        ) : null}

        <section className="mt-6 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-200 px-6 py-5">
            <h2 className="font-serif text-2xl font-black">
              Customer Requests
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Call the customer, then update the request status so the list
              stays organized.
            </p>
          </div>

          {loading ? (
            <p className="px-6 py-16 text-center font-bold text-stone-500">
              Loading requests...
            </p>
          ) : requests.length ? (
            <div className="divide-y divide-stone-200">
              {requests.map((request) => (
                <article
                  key={request.id}
                  className="grid gap-5 px-6 py-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] lg:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-black">
                        {request.customer_name}
                      </h3>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          request.request_type === "beef"
                            ? "bg-red-100 text-red-900"
                            : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {request.request_type === "beef"
                          ? "Beef"
                          : "Roaster Pig"}
                      </span>
                    </div>
                    <p className="mt-2 font-bold">
                      {requestDescription(request)}
                    </p>
                    <p className="mt-1 text-sm text-stone-500">
                      Requested {formatDate(request.created_at)}
                    </p>
                  </div>

                  <div>
                    <a
                      href={phoneHref(request.phone)}
                      className="font-black text-red-800 hover:underline"
                    >
                      {request.phone}
                    </a>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.1em] text-stone-500">
                      Email notification: {request.email_status}
                    </p>
                  </div>

                  <label className="block">
                    <span className="text-xs font-black uppercase tracking-[0.12em] text-stone-500">
                      Status
                    </span>
                    <select
                      value={request.status}
                      disabled={savingId === request.id}
                      onChange={(event) =>
                        updateStatus(
                          request.id,
                          event.target.value as RequestStatus,
                        )
                      }
                      className="mt-2 min-w-40 rounded-md border border-stone-300 bg-white px-4 py-3 font-bold disabled:opacity-60"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="completed">Completed</option>
                      <option value="declined">Declined</option>
                    </select>
                  </label>
                </article>
              ))}
            </div>
          ) : (
            <p className="px-6 py-16 text-center font-bold text-stone-500">
              No beef or roaster requests have been submitted yet.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
