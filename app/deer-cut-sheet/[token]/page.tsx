"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type DeerFormData = Record<string, string | number | boolean>;

type DeerCutSheet = {
  id: string;
  secure_token: string;
  customer_name: string;
  phone: string;
  form_data: DeerFormData | null;
  submitted_at: string | null;
  created_at: string;
};

type Choice = { value: string; label: string };
type Product = {
  key: string;
  name: string;
  package: string;
  price: string;
  unit: string;
};

const supabase = createClient();

const products: Product[] = [
  {
    key: "old_fashion_summer_sausage",
    name: "Old Fashion Summer Sausage",
    package: "6 lb stick",
    price: "$38.00",
    unit: "sticks",
  },
  {
    key: "summer_sausage",
    name: "Summer Sausage",
    package: "4 lb stick",
    price: "$23.00",
    unit: "sticks",
  },
  {
    key: "cheesy_summer_sausage",
    name: "Cheesy Summer Sausage",
    package: "4 lb stick",
    price: "$25.00",
    unit: "sticks",
  },
  {
    key: "cheesy_jalapeno_summer_sausage",
    name: "Cheesy-jalapeno Summer Sausage",
    package: "4 lb stick",
    price: "$25.00",
    unit: "sticks",
  },
  {
    key: "hickory_stick",
    name: "Hickory Stick",
    package: "4 lb stick",
    price: "$23.00",
    unit: "sticks",
  },
  {
    key: "pepper_stick",
    name: "Pepper Stick",
    package: "5 lb bag",
    price: "$47.00",
    unit: "bags",
  },
  {
    key: "pepper_stick_cheese",
    name: "Pepper Stick with Cheese",
    package: "5 lb bag",
    price: "$50.00",
    unit: "bags",
  },
  {
    key: "honey_bbq_snack_stick",
    name: "Honey BBQ Snack Stick",
    package: "5 lb bag",
    price: "$48.00",
    unit: "bags",
  },
  {
    key: "cheesy_jalapeno_pepper_stick",
    name: "Cheesy-jalapeno Pepper Stick",
    package: "5 lb bag",
    price: "$50.00",
    unit: "bags",
  },
  {
    key: "hunter_twiggs",
    name: "Hunter Twiggs",
    package: "5 lb bag",
    price: "$46.00",
    unit: "bags",
  },
  {
    key: "regular_jerky",
    name: "Regular Jerky",
    package: "priced per lb",
    price: "$12/lb",
    unit: "lbs",
  },
  {
    key: "sweet_spicy_jerky",
    name: "Sweet and Spicy Jerky",
    package: "priced per lb",
    price: "$12/lb",
    unit: "lbs",
  },
  {
    key: "smoked_brats",
    name: "Smoked Brats",
    package: "5 lb bag",
    price: "$34.00",
    unit: "bags",
  },
  {
    key: "cheesy_jalapeno_smoked_brats",
    name: "Cheesy-jalapeno Smoked Brats",
    package: "5 lb bag",
    price: "$40.00",
    unit: "bags",
  },
];

function initialForm(sheet: DeerCutSheet): DeerFormData {
  return {
    license_number: "",
    dropoff_date: new Date(sheet.created_at).toISOString().slice(0, 10),
    deer_type: "",
    number_of_points: "",
    save_antlers: false,
    save_head: false,
    cape_out: "",
    rump_roast: "",
    shoulder_roast: "",
    neck_roast: "",
    ham_steaks: "",
    ribs: "",
    whole_ham: "",
    stew_meat: "",
    stew_meat_lbs: "",
    inner_loin: "",
    back_straps: "",
    add_suet: "",
    total_lbs_meat_needed: "",
    notes: "",
    ...Object.fromEntries(products.map((product) => [product.key, ""])),
    ...(sheet.form_data || {}),
  };
}

function ChoiceGroup({
  label,
  name,
  choices,
  value,
  disabled,
  onChange,
}: {
  label: string;
  name: string;
  choices: Choice[];
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="rounded-lg border border-stone-200 bg-white p-4">
      <legend className="px-1 font-serif text-xl font-black">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {choices.map((choice) => (
          <label
            key={choice.value}
            className={`cursor-pointer rounded-md border px-4 py-2 text-sm font-bold transition ${
              value === choice.value
                ? "border-red-800 bg-red-800 text-white"
                : "border-stone-300 bg-white hover:border-red-700"
            } ${disabled ? "cursor-default opacity-80" : ""}`}
          >
            <input
              type="radio"
              name={name}
              value={choice.value}
              checked={value === choice.value}
              disabled={disabled}
              onChange={() => onChange(choice.value)}
              className="sr-only"
            />
            {choice.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function DeerCutSheetPage() {
  const params = useParams();
  const token = String(params.token || "");
  const [sheet, setSheet] = useState<DeerCutSheet | null>(null);
  const [form, setForm] = useState<DeerFormData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSheet() {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_deer_cut_sheet", {
        p_token: token,
      });

      if (!active) return;
      const record = Array.isArray(data) ? data[0] : data;
      if (error || !record) {
        setMessage(error?.message || "This deer cut-sheet link is not valid.");
        setSheet(null);
        setLoading(false);
        return;
      }

      const loaded = record as DeerCutSheet;
      setSheet(loaded);
      setForm(initialForm(loaded));
      setLoading(false);
    }

    if (token) loadSheet();
    return () => {
      active = false;
    };
  }, [token]);

  const submitted = Boolean(sheet?.submitted_at);

  const orderedProducts = useMemo(
    () => products.filter((product) => String(form[product.key] || "").trim()),
    [form],
  );

  function setValue(name: string, value: string | number | boolean) {
    if (submitted) return;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function save(submit: boolean) {
    if (!sheet || submitted) return;
    if (submit) {
      const confirmed = window.confirm(
        "Submit this deer cut order to Apex Custom Butchering? You will not be able to change it after submission.",
      );
      if (!confirmed) return;
    }

    setSaving(true);
    setMessage(
      submit
        ? "Submitting your deer cut order..."
        : "Saving your deer cut order...",
    );
    const { error } = await supabase.rpc("save_deer_cut_sheet", {
      p_token: token,
      p_form_data: form,
      p_submit: submit,
    });

    if (error) {
      setSaving(false);
      setMessage(`Could not save the cut sheet: ${error.message}`);
      return;
    }

    setSaving(false);
    if (submit) {
      setSheet({
        ...sheet,
        form_data: form,
        submitted_at: new Date().toISOString(),
      });
      setMessage("Your deer cut order was submitted successfully.");
    } else {
      setSheet({ ...sheet, form_data: form });
      setMessage(
        "Your deer cut order was saved. You can return to this link and finish it later.",
      );
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-100 p-12 text-center text-xl font-bold">
        Loading deer cut sheet...
      </main>
    );
  }

  if (!sheet) {
    return (
      <main className="min-h-screen bg-stone-100 px-6 py-12">
        <div className="mx-auto max-w-2xl rounded-xl bg-white p-8 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-red-800">
            Apex Custom Butchering
          </p>
          <h1 className="mt-3 font-serif text-4xl font-black">
            Deer Cut Sheet Not Found
          </h1>
          <p className="mt-4 text-red-800">{message}</p>
        </div>
      </main>
    );
  }

  const yesNo: Choice[] = [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
  ];

  return (
    <main className="min-h-screen bg-stone-100 text-stone-950 print:bg-white">
      <header className="bg-stone-950 text-white print:bg-white print:text-black">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-red-500 print:text-black">
            Apex Custom Butchering
          </p>
          <h1 className="mt-2 font-serif text-4xl font-black sm:text-5xl">
            Deer Cut Order Sheet
          </h1>
          <p className="mt-3 text-stone-300 print:text-black">
            Complete the choices below and submit your order to the shop.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        {submitted ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-5 font-bold text-green-900">
            This deer cut order has been submitted and is now read-only.
          </div>
        ) : null}

        {message ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 font-bold text-amber-950 print:hidden">
            {message}
          </div>
        ) : null}

        <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm print:shadow-none">
          <h2 className="font-serif text-2xl font-black">
            Customer and Deer Information
          </h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-bold">Customer Name</span>
              <input
                readOnly
                value={sheet.customer_name}
                className="mt-2 w-full rounded-md border border-stone-300 bg-stone-100 px-4 py-3 font-bold"
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold">Phone Number</span>
              <input
                readOnly
                value={sheet.phone}
                className="mt-2 w-full rounded-md border border-stone-300 bg-stone-100 px-4 py-3 font-bold"
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold">License Number</span>
              <input
                disabled={submitted}
                value={String(form.license_number || "")}
                onChange={(event) =>
                  setValue("license_number", event.target.value)
                }
                className="mt-2 w-full rounded-md border border-stone-300 px-4 py-3 disabled:bg-stone-100"
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold">Drop-Off Date</span>
              <input
                type="date"
                disabled={submitted}
                value={String(form.dropoff_date || "")}
                onChange={(event) =>
                  setValue("dropoff_date", event.target.value)
                }
                className="mt-2 w-full rounded-md border border-stone-300 px-4 py-3 disabled:bg-stone-100"
              />
            </label>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <ChoiceGroup
              label="Deer Type"
              name="deer_type"
              choices={[
                { value: "doe", label: "Doe" },
                { value: "button_buck", label: "Button Buck" },
                { value: "buck", label: "Buck" },
              ]}
              value={String(form.deer_type || "")}
              disabled={submitted}
              onChange={(value) => setValue("deer_type", value)}
            />
            <div className="rounded-lg border border-stone-200 bg-white p-4">
              <label className="font-serif text-xl font-black">
                Number of Points
              </label>
              <input
                type="number"
                min="0"
                disabled={submitted}
                value={String(form.number_of_points || "")}
                onChange={(event) =>
                  setValue("number_of_points", event.target.value)
                }
                className="mt-3 w-full rounded-md border border-stone-300 px-4 py-2 disabled:bg-stone-100"
              />
            </div>
            <div className="rounded-lg border border-stone-200 bg-white p-4">
              <p className="font-serif text-xl font-black">Keep From Deer</p>
              <div className="mt-3 flex flex-wrap gap-5">
                <label className="flex items-center gap-2 font-bold">
                  <input
                    type="checkbox"
                    disabled={submitted}
                    checked={Boolean(form.save_antlers)}
                    onChange={(event) =>
                      setValue("save_antlers", event.target.checked)
                    }
                    className="h-5 w-5 accent-red-800"
                  />
                  Save Antlers
                </label>
                <label className="flex items-center gap-2 font-bold">
                  <input
                    type="checkbox"
                    disabled={submitted}
                    checked={Boolean(form.save_head)}
                    onChange={(event) =>
                      setValue("save_head", event.target.checked)
                    }
                    className="h-5 w-5 accent-red-800"
                  />
                  Save Head
                </label>
              </div>
            </div>
            <ChoiceGroup
              label="Cape Out - $50.00"
              name="cape_out"
              choices={yesNo}
              value={String(form.cape_out || "")}
              disabled={submitted}
              onChange={(value) => setValue("cape_out", value)}
            />
          </div>
          <p className="mt-5 rounded-md bg-stone-950 px-4 py-3 font-black text-white">
            Deer processing fee: $125.00
          </p>
        </section>

        <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm print:shadow-none">
          <h2 className="font-serif text-3xl font-black">Standard Cuts</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <ChoiceGroup
              label="Rump Roast"
              name="rump_roast"
              choices={yesNo}
              value={String(form.rump_roast || "")}
              disabled={submitted}
              onChange={(value) => setValue("rump_roast", value)}
            />
            <ChoiceGroup
              label="Shoulder Roast"
              name="shoulder_roast"
              choices={yesNo}
              value={String(form.shoulder_roast || "")}
              disabled={submitted}
              onChange={(value) => setValue("shoulder_roast", value)}
            />
            <ChoiceGroup
              label="Neck Roast"
              name="neck_roast"
              choices={yesNo}
              value={String(form.neck_roast || "")}
              disabled={submitted}
              onChange={(value) => setValue("neck_roast", value)}
            />
            <ChoiceGroup
              label="Ham Steaks"
              name="ham_steaks"
              choices={yesNo}
              value={String(form.ham_steaks || "")}
              disabled={submitted}
              onChange={(value) => setValue("ham_steaks", value)}
            />
            <ChoiceGroup
              label="Ribs"
              name="ribs"
              choices={yesNo}
              value={String(form.ribs || "")}
              disabled={submitted}
              onChange={(value) => setValue("ribs", value)}
            />
            <ChoiceGroup
              label="Whole Ham"
              name="whole_ham"
              choices={[...yesNo, { value: "smoked", label: "Smoked" }]}
              value={String(form.whole_ham || "")}
              disabled={submitted}
              onChange={(value) => setValue("whole_ham", value)}
            />
            <div className="rounded-lg border border-stone-200 p-4">
              <ChoiceGroup
                label="Stew Meat"
                name="stew_meat"
                choices={yesNo}
                value={String(form.stew_meat || "")}
                disabled={submitted}
                onChange={(value) => setValue("stew_meat", value)}
              />
              <label className="mt-4 block text-sm font-bold">
                Number of pounds
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  disabled={submitted || form.stew_meat !== "yes"}
                  value={String(form.stew_meat_lbs || "")}
                  onChange={(event) =>
                    setValue("stew_meat_lbs", event.target.value)
                  }
                  className="mt-2 w-full rounded-md border border-stone-300 px-3 py-2 disabled:bg-stone-100"
                />
              </label>
            </div>
            <ChoiceGroup
              label="Inner Loin"
              name="inner_loin"
              choices={yesNo}
              value={String(form.inner_loin || "")}
              disabled={submitted}
              onChange={(value) => setValue("inner_loin", value)}
            />
            <ChoiceGroup
              label="Back-straps"
              name="back_straps"
              choices={[
                { value: "whole", label: "Whole" },
                { value: "steaks", label: "Steaks" },
                { value: "butterfly_steaks", label: "Butterfly Steaks" },
              ]}
              value={String(form.back_straps || "")}
              disabled={submitted}
              onChange={(value) => setValue("back_straps", value)}
            />
            <ChoiceGroup
              label="Add Suet - $0.25/lb"
              name="add_suet"
              choices={yesNo}
              value={String(form.add_suet || "")}
              disabled={submitted}
              onChange={(value) => setValue("add_suet", value)}
            />
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm print:shadow-none">
          <div className="border-b border-stone-200 p-6">
            <h2 className="font-serif text-3xl font-black">
              Specialty Products
            </h2>
            <p className="mt-2 text-stone-600">
              Enter the number of sticks, bags, or pounds you want. Leave
              unwanted items blank.
            </p>
          </div>
          <div className="divide-y divide-stone-200">
            {products.map((product) => (
              <label
                key={product.key}
                className="grid gap-3 px-6 py-4 sm:grid-cols-[minmax(0,1fr)_140px_150px] sm:items-center"
              >
                <span>
                  <span className="block font-black">{product.name}</span>
                  <span className="text-sm text-stone-500">
                    {product.package}
                  </span>
                </span>
                <span className="font-black text-red-800">{product.price}</span>
                <span className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step={product.unit === "lbs" ? "0.5" : "1"}
                    disabled={submitted}
                    value={String(form[product.key] || "")}
                    onChange={(event) =>
                      setValue(product.key, event.target.value)
                    }
                    className="w-24 rounded-md border border-stone-300 px-3 py-2 disabled:bg-stone-100"
                  />
                  <span className="text-sm font-bold text-stone-600">
                    {product.unit}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm print:shadow-none">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="font-serif text-2xl font-black">
                Total Pounds of Meat Needed
              </span>
              <input
                type="number"
                min="0"
                step="0.5"
                disabled={submitted}
                value={String(form.total_lbs_meat_needed || "")}
                onChange={(event) =>
                  setValue("total_lbs_meat_needed", event.target.value)
                }
                className="mt-3 w-full rounded-md border border-stone-300 px-4 py-3 text-lg font-black disabled:bg-stone-100"
              />
            </label>
            <label className="block">
              <span className="font-serif text-2xl font-black">
                Notes for the Shop
              </span>
              <textarea
                disabled={submitted}
                value={String(form.notes || "")}
                onChange={(event) => setValue("notes", event.target.value)}
                className="mt-3 h-28 w-full rounded-md border border-stone-300 px-4 py-3 disabled:bg-stone-100"
              />
            </label>
          </div>
          {submitted && orderedProducts.length ? (
            <p className="mt-5 text-sm font-bold text-stone-600">
              Specialty selections:{" "}
              {orderedProducts.map((product) => product.name).join(", ")}
            </p>
          ) : null}
        </section>

        <div className="flex flex-wrap gap-3 pb-10 print:hidden">
          {!submitted ? (
            <>
              <button
                type="button"
                disabled={saving}
                onClick={() => save(false)}
                className="rounded-md border border-stone-950 bg-white px-6 py-4 font-black disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save and Finish Later"}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => save(true)}
                className="rounded-md bg-red-800 px-6 py-4 font-black text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {saving ? "Submitting..." : "Submit Deer Cut Order"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-md bg-stone-950 px-6 py-4 font-black text-white"
            >
              Print This Cut Order
            </button>
          )}
          <a
            href="/images/deer-cut-sheet.pdf"
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-stone-300 bg-white px-6 py-4 font-black"
          >
            View Blank Paper Form
          </a>
        </div>
      </div>
    </main>
  );
}
