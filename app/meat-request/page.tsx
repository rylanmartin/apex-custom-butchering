"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type RequestType = "beef" | "roaster_pig";
type BeefPortion = "quarter" | "half" | "whole";

const supabase = createClient();

export default function MeatRequestPage() {
  const [requestType, setRequestType] = useState<RequestType>("beef");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [beefPortion, setBeefPortion] = useState<BeefPortion>("quarter");
  const [roasterWeight, setRoasterWeight] = useState("");
  const [company, setCompany] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");

  function chooseRequestType(type: RequestType) {
    setRequestType(type);
    setMessage("");
  }

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const weight = Number.parseFloat(roasterWeight);

    if (!cleanName || !cleanPhone) {
      setMessage("Enter your name and phone number.");
      return;
    }

    if (
      requestType === "roaster_pig" &&
      (!roasterWeight.trim() || Number.isNaN(weight) || weight <= 0)
    ) {
      setMessage(
        "Enter the approximate hanging weight you want for the roaster pig.",
      );
      return;
    }

    setSubmitting(true);
    setMessage("Sending your request...");

    const { data, error } = await supabase.functions.invoke(
      "submit-meat-request",
      {
        body: {
          requestType,
          customerName: cleanName,
          phone: cleanPhone,
          beefPortion: requestType === "beef" ? beefPortion : null,
          roasterWeightLbs: requestType === "roaster_pig" ? weight : null,
          company,
        },
      },
    );

    setSubmitting(false);
    if (error || !data?.success) {
      setMessage(
        data?.error ||
          error?.message ||
          "Your request could not be submitted. Please call the shop.",
      );
      return;
    }

    setSubmitted(true);
    setMessage("");
  }

  if (submitted) {
    return (
      <main className="flex min-h-screen items-center bg-stone-100 px-6 py-12 text-stone-950">
        <section className="mx-auto w-full max-w-2xl rounded-xl border border-stone-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-800">
            ✓
          </div>
          <p className="mt-6 text-xs font-black uppercase tracking-[0.24em] text-red-800">
            Apex Custom Butchering
          </p>
          <h1 className="mt-3 font-serif text-4xl font-black">
            Request Received
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-lg leading-8 text-stone-600">
            Thank you, {name.trim()}. Your request has been sent to the shop. We
            will contact you at {phone.trim()} to discuss availability and the
            next steps.
          </p>
          <p className="mt-4 text-sm font-bold text-stone-500">
            This request is not a confirmed order until Apex contacts you.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="rounded-md bg-red-800 px-6 py-3 font-black text-white transition hover:bg-red-700"
            >
              Return Home
            </Link>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setName("");
                setPhone("");
                setRoasterWeight("");
              }}
              className="rounded-md border border-stone-300 bg-white px-6 py-3 font-black"
            >
              Make Another Request
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-100 text-stone-950">
      <header className="bg-stone-950 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-red-500">
              Apex Custom Butchering
            </p>
            <h1 className="mt-2 font-serif text-4xl font-black sm:text-5xl">
              Request Beef or a Roaster Pig
            </h1>
          </div>
          <Link
            href="/"
            className="w-fit rounded-md border border-white/25 px-5 py-3 text-sm font-bold transition hover:bg-white hover:text-stone-950"
          >
            Back to Homepage
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-10">
        <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-bold leading-7 text-stone-600">
            Tell us what you are interested in. This sends a request to the
            shop; Apex will contact you to discuss availability and confirm the
            order.
          </p>

          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => chooseRequestType("beef")}
              className={`rounded-xl border p-6 text-left transition ${
                requestType === "beef"
                  ? "border-red-800 bg-red-50 ring-2 ring-red-100"
                  : "border-stone-200 hover:border-red-700"
              }`}
            >
              <span className="text-xs font-black uppercase tracking-[0.2em] text-red-800">
                Local Beef
              </span>
              <span className="mt-2 block font-serif text-3xl font-black">
                Request Beef
              </span>
              <span className="mt-3 block text-sm leading-6 text-stone-600">
                Choose a quarter, half, or whole beef.
              </span>
            </button>

            <button
              type="button"
              onClick={() => chooseRequestType("roaster_pig")}
              className={`rounded-xl border p-6 text-left transition ${
                requestType === "roaster_pig"
                  ? "border-red-800 bg-red-50 ring-2 ring-red-100"
                  : "border-stone-200 hover:border-red-700"
              }`}
            >
              <span className="text-xs font-black uppercase tracking-[0.2em] text-red-800">
                Roaster Pig
              </span>
              <span className="mt-2 block font-serif text-3xl font-black">
                Request a Roaster
              </span>
              <span className="mt-3 block text-sm leading-6 text-stone-600">
                Enter the approximate hanging weight you want.
              </span>
            </button>
          </div>

          <form onSubmit={submitRequest} className="mt-8 space-y-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-black">Your Name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  required
                  className="mt-2 w-full rounded-md border border-stone-300 px-4 py-3 outline-none transition focus:border-red-700 focus:ring-2 focus:ring-red-100"
                  placeholder="Full name"
                />
              </label>
              <label className="block">
                <span className="text-sm font-black">Phone Number</span>
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  autoComplete="tel"
                  inputMode="tel"
                  required
                  className="mt-2 w-full rounded-md border border-stone-300 px-4 py-3 outline-none transition focus:border-red-700 focus:ring-2 focus:ring-red-100"
                  placeholder="(989) 555-1234"
                />
              </label>
            </div>

            {requestType === "beef" ? (
              <fieldset>
                <legend className="text-sm font-black">How Much Beef?</legend>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {(["quarter", "half", "whole"] as BeefPortion[]).map(
                    (portion) => (
                      <label
                        key={portion}
                        className={`cursor-pointer rounded-md border px-5 py-4 text-center font-black capitalize transition ${
                          beefPortion === portion
                            ? "border-red-800 bg-red-800 text-white"
                            : "border-stone-300 hover:border-red-700"
                        }`}
                      >
                        <input
                          type="radio"
                          name="beef-portion"
                          value={portion}
                          checked={beefPortion === portion}
                          onChange={() => setBeefPortion(portion)}
                          className="sr-only"
                        />
                        {portion}
                      </label>
                    ),
                  )}
                </div>
              </fieldset>
            ) : (
              <label className="block">
                <span className="text-sm font-black">
                  Desired Hanging Weight
                </span>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="500"
                    step="1"
                    value={roasterWeight}
                    onChange={(event) => setRoasterWeight(event.target.value)}
                    required
                    className="w-full rounded-md border border-stone-300 px-4 py-3 outline-none transition focus:border-red-700 focus:ring-2 focus:ring-red-100"
                    placeholder="Example: 150"
                  />
                  <span className="font-black text-stone-600">lbs</span>
                </div>
              </label>
            )}

            <label
              aria-hidden="true"
              className="pointer-events-none absolute -left-[10000px] top-auto h-px w-px overflow-hidden"
            >
              Company
              <input
                tabIndex={-1}
                autoComplete="off"
                value={company}
                onChange={(event) => setCompany(event.target.value)}
              />
            </label>

            {message ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-950">
                {message}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-red-800 px-6 py-4 font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Sending Request..."
                : requestType === "beef"
                  ? "Submit Beef Request"
                  : "Submit Roaster Pig Request"}
            </button>
            <p className="text-center text-xs font-bold uppercase tracking-[0.1em] text-stone-500">
              This form is a request and does not guarantee availability.
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
