"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { createClient } from "@/lib/supabase/client";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

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

type PdfChoiceProps = {
  label: string;
  name: string;
  value: string | boolean;
  currentValue: string | number | boolean | undefined;
  left: number;
  top: number;
  width: number;
  height: number;
  markLeft: number;
  markTop: number;
  disabled: boolean;
  toggle?: boolean;
  onChange: (name: string, value: string | boolean) => void;
};

type PdfInputProps = {
  label: string;
  value: string;
  left: number;
  top: number;
  width: number;
  height: number;
  disabled?: boolean;
  readOnly?: boolean;
  inputMode?: "text" | "numeric" | "decimal" | "tel";
  onChange?: (value: string) => void;
};

type Product = {
  key: string;
  label: string;
  inputMode: "numeric" | "decimal";
};

const supabase = createClient();

const products: Product[] = [
  {
    key: "old_fashion_summer_sausage",
    label: "Old Fashion Summer Sausage",
    inputMode: "numeric",
  },
  { key: "summer_sausage", label: "Summer Sausage", inputMode: "numeric" },
  {
    key: "cheesy_summer_sausage",
    label: "Cheesy Summer Sausage",
    inputMode: "numeric",
  },
  {
    key: "cheesy_jalapeno_summer_sausage",
    label: "Cheesy-jalapeno Summer Sausage",
    inputMode: "numeric",
  },
  { key: "hickory_stick", label: "Hickory Stick", inputMode: "numeric" },
  { key: "pepper_stick", label: "Pepper Stick", inputMode: "numeric" },
  {
    key: "pepper_stick_cheese",
    label: "Pepper Stick with Cheese",
    inputMode: "numeric",
  },
  {
    key: "honey_bbq_snack_stick",
    label: "Honey BBQ Snack Stick",
    inputMode: "numeric",
  },
  {
    key: "cheesy_jalapeno_pepper_stick",
    label: "Cheesy-jalapeno Pepper Stick",
    inputMode: "numeric",
  },
  { key: "hunter_twiggs", label: "Hunter Twiggs", inputMode: "numeric" },
  { key: "regular_jerky", label: "Regular Jerky", inputMode: "decimal" },
  {
    key: "sweet_spicy_jerky",
    label: "Sweet and Spicy Jerky",
    inputMode: "decimal",
  },
  { key: "smoked_brats", label: "Smoked Brats", inputMode: "numeric" },
  {
    key: "cheesy_jalapeno_smoked_brats",
    label: "Cheesy-jalapeno Smoked Brats",
    inputMode: "numeric",
  },
];

function formatDropoffDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

function initialForm(sheet: DeerCutSheet): DeerFormData {
  return {
    license_number: "",
    dropoff_date: formatDropoffDate(sheet.created_at),
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
    whole_ham_smoked: false,
    stew_meat: "",
    stew_meat_lbs: "",
    inner_loin: "",
    back_straps: "",
    add_suet: "",
    total_lbs_meat_needed: "",
    ...Object.fromEntries(products.map((product) => [product.key, ""])),
    ...(sheet.form_data || {}),
  };
}

function PdfChoice({
  label,
  name,
  value,
  currentValue,
  left,
  top,
  width,
  height,
  markLeft,
  markTop,
  disabled,
  toggle = false,
  onChange,
}: PdfChoiceProps) {
  const selected = currentValue === value;

  return (
    <>
      <button
        type="button"
        aria-label={label}
        aria-pressed={selected}
        disabled={disabled}
        title={label}
        onClick={() => onChange(name, toggle && selected ? false : value)}
        className={`absolute z-20 rounded-sm transition focus:outline-none focus:ring-2 focus:ring-red-600 ${
          selected
            ? "bg-red-100/25 ring-1 ring-red-500/40"
            : "hover:bg-amber-200/25"
        } disabled:cursor-default`}
        style={{
          left: `${left}%`,
          top: `${top}%`,
          width: `${width}%`,
          height: `${height}%`,
        }}
      />
      {selected ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute z-[80] -translate-x-1/2 -translate-y-1/2 font-black leading-none"
          style={{
            left: `${markLeft}%`,
            top: `${markTop}%`,
            color: "#e00000",
            opacity: 1,
            fontSize: "clamp(24px, 4.25cqw, 44px)",
            WebkitTextStroke: "0.75px #e00000",
          }}
        >
          ✓
        </span>
      ) : null}
    </>
  );
}

function PdfInput({
  label,
  value,
  left,
  top,
  width,
  height,
  disabled = false,
  readOnly = false,
  inputMode = "text",
  onChange,
}: PdfInputProps) {
  return (
    <input
      aria-label={label}
      title={label}
      value={value}
      disabled={disabled}
      readOnly={readOnly}
      inputMode={inputMode}
      onChange={(event) => onChange?.(event.target.value)}
      className="absolute z-20 min-w-0 border-0 border-b border-transparent bg-amber-50/75 px-1 font-bold text-stone-950 outline-none focus:border-red-700 focus:bg-white/95 disabled:opacity-100"
      style={{
        left: `${left}%`,
        top: `${top}%`,
        width: `${width}%`,
        height: `${height}%`,
        fontSize: "clamp(9px, 1.55cqw, 15px)",
      }}
    />
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
  const [pdfError, setPdfError] = useState("");
  const [pageWidth, setPageWidth] = useState(900);

  useEffect(() => {
    function updateWidth() {
      setPageWidth(Math.min(Math.max(window.innerWidth - 32, 760), 900));
    }

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

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

    if (token) void loadSheet();
    return () => {
      active = false;
    };
  }, [token]);

  const submitted = Boolean(sheet?.submitted_at);

  function setValue(name: string, value: string | boolean) {
    if (submitted) return;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function save(submit: boolean) {
    if (!sheet || submitted || saving) return;

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

    const submittedAt = submit ? new Date().toISOString() : sheet.submitted_at;
    setSheet({ ...sheet, form_data: form, submitted_at: submittedAt });
    setSaving(false);
    setMessage(
      submit
        ? "Your deer cut order was submitted successfully."
        : "Your deer cut order was saved. You can return to this link and finish it later.",
    );
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

  const choiceProps = { disabled: submitted, onChange: setValue };

  return (
    <main className="min-h-screen bg-stone-100 text-stone-950">
      <header className="bg-stone-950 text-white">
        <div className="mx-auto max-w-6xl px-6 py-7">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-red-500">
            Apex Custom Butchering
          </p>
          <h1 className="mt-2 font-serif text-4xl font-black">
            Deer Cut Order Sheet
          </h1>
          <p className="mt-3 text-stone-300">
            Tap directly on your choices. A red check means that option is
            selected.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {submitted ? (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 font-bold text-green-900">
            This deer cut order has been submitted and is now read-only.
          </div>
        ) : null}

        {message ? (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 font-bold text-amber-950">
            {message}
          </div>
        ) : null}

        {pdfError ? (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 font-bold text-red-900">
            The deer PDF could not be loaded: {pdfError}
          </div>
        ) : null}

        <div className="overflow-x-auto rounded-xl border border-stone-300 bg-stone-300 p-2 shadow-lg sm:p-4">
          <div
            className="relative mx-auto overflow-hidden bg-white shadow-sm"
            style={{ containerType: "inline-size", width: `${pageWidth}px` }}
          >
            <Document
              file="/images/deer-cut-sheet.pdf"
              loading={
                <div className="p-10 text-center text-xl font-bold">
                  Loading deer PDF...
                </div>
              }
              error={
                <div className="p-10 text-center text-xl font-bold text-red-800">
                  Failed to load the deer PDF.
                </div>
              }
              onLoadError={(error) => {
                console.error(error);
                setPdfError(error.message);
              }}
              onSourceError={(error) => {
                console.error(error);
                setPdfError(error.message);
              }}
            >
              <Page
                pageNumber={1}
                width={pageWidth}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>

            <PdfInput
              label="Customer name"
              value={sheet.customer_name}
              readOnly
              left={17.1}
              top={9.8}
              width={31}
              height={2.4}
            />
            <PdfInput
              label="License number"
              value={String(form.license_number || "")}
              disabled={submitted}
              left={56.5}
              top={9.8}
              width={30.5}
              height={2.4}
              onChange={(value) => setValue("license_number", value)}
            />
            <PdfInput
              label="Phone number"
              value={sheet.phone}
              readOnly
              inputMode="tel"
              left={24.2}
              top={13.55}
              width={24}
              height={2.4}
            />
            <PdfInput
              label="Drop-off date"
              value={String(form.dropoff_date || "")}
              disabled={submitted}
              left={53.2}
              top={13.55}
              width={34}
              height={2.4}
              onChange={(value) => setValue("dropoff_date", value)}
            />
            <PdfInput
              label="Number of points"
              value={String(form.number_of_points || "")}
              disabled={submitted}
              inputMode="numeric"
              left={59.6}
              top={19.1}
              width={12}
              height={2.4}
              onChange={(value) => setValue("number_of_points", value)}
            />

            <PdfChoice
              label="Doe"
              name="deer_type"
              value="doe"
              currentValue={form.deer_type}
              left={11.5}
              top={18.9}
              width={6.8}
              height={2.6}
              markLeft={12.35}
              markTop={20.2}
              {...choiceProps}
            />
            <PdfChoice
              label="Button Buck"
              name="deer_type"
              value="button_buck"
              currentValue={form.deer_type}
              left={22.4}
              top={18.9}
              width={13.3}
              height={2.6}
              markLeft={23.55}
              markTop={20.2}
              {...choiceProps}
            />
            <PdfChoice
              label="Buck"
              name="deer_type"
              value="buck"
              currentValue={form.deer_type}
              left={39.5}
              top={18.9}
              width={7.2}
              height={2.6}
              markLeft={40.65}
              markTop={20.2}
              {...choiceProps}
            />
            <PdfChoice
              label="Save antlers"
              name="save_antlers"
              value={true}
              currentValue={form.save_antlers}
              left={39.8}
              top={20.8}
              width={13.8}
              height={2.3}
              markLeft={40.7}
              markTop={22.05}
              toggle
              {...choiceProps}
            />
            <PdfChoice
              label="Save head"
              name="save_head"
              value={true}
              currentValue={form.save_head}
              left={56}
              top={20.8}
              width={11.8}
              height={2.3}
              markLeft={56.95}
              markTop={22.05}
              toggle
              {...choiceProps}
            />
            <PdfChoice
              label="Cape out yes"
              name="cape_out"
              value="yes"
              currentValue={form.cape_out}
              left={57}
              top={22.7}
              width={7.2}
              height={2.4}
              markLeft={58.75}
              markTop={23.85}
              {...choiceProps}
            />
            <PdfChoice
              label="Cape out no"
              name="cape_out"
              value="no"
              currentValue={form.cape_out}
              left={64.1}
              top={22.7}
              width={6.5}
              height={2.4}
              markLeft={65.25}
              markTop={23.85}
              {...choiceProps}
            />

            <PdfChoice
              label="Rump roast yes"
              name="rump_roast"
              value="yes"
              currentValue={form.rump_roast}
              left={11.5}
              top={30.4}
              width={6}
              height={2.5}
              markLeft={12.35}
              markTop={31.75}
              {...choiceProps}
            />
            <PdfChoice
              label="Rump roast no"
              name="rump_roast"
              value="no"
              currentValue={form.rump_roast}
              left={17.4}
              top={30.4}
              width={5.4}
              height={2.5}
              markLeft={18.15}
              markTop={31.75}
              {...choiceProps}
            />
            <PdfChoice
              label="Shoulder roast yes"
              name="shoulder_roast"
              value="yes"
              currentValue={form.shoulder_roast}
              left={29.6}
              top={30.4}
              width={6.2}
              height={2.5}
              markLeft={30.65}
              markTop={31.75}
              {...choiceProps}
            />
            <PdfChoice
              label="Shoulder roast no"
              name="shoulder_roast"
              value="no"
              currentValue={form.shoulder_roast}
              left={35.6}
              top={30.4}
              width={5.5}
              height={2.5}
              markLeft={36.6}
              markTop={31.75}
              {...choiceProps}
            />
            <PdfChoice
              label="Neck roast yes"
              name="neck_roast"
              value="yes"
              currentValue={form.neck_roast}
              left={50}
              top={30.4}
              width={6.3}
              height={2.5}
              markLeft={51.15}
              markTop={31.75}
              {...choiceProps}
            />
            <PdfChoice
              label="Neck roast no"
              name="neck_roast"
              value="no"
              currentValue={form.neck_roast}
              left={56.3}
              top={30.4}
              width={5.5}
              height={2.5}
              markLeft={57.5}
              markTop={31.75}
              {...choiceProps}
            />
            <PdfChoice
              label="Ham steaks yes"
              name="ham_steaks"
              value="yes"
              currentValue={form.ham_steaks}
              left={65.9}
              top={30.4}
              width={6.2}
              height={2.5}
              markLeft={67}
              markTop={31.75}
              {...choiceProps}
            />
            <PdfChoice
              label="Ham steaks no"
              name="ham_steaks"
              value="no"
              currentValue={form.ham_steaks}
              left={72.1}
              top={30.4}
              width={5.5}
              height={2.5}
              markLeft={73.3}
              markTop={31.75}
              {...choiceProps}
            />

            <PdfChoice
              label="Ribs yes"
              name="ribs"
              value="yes"
              currentValue={form.ribs}
              left={11.5}
              top={36.5}
              width={6}
              height={2.5}
              markLeft={12.35}
              markTop={37.8}
              {...choiceProps}
            />
            <PdfChoice
              label="Ribs no"
              name="ribs"
              value="no"
              currentValue={form.ribs}
              left={17.4}
              top={36.5}
              width={5.4}
              height={2.5}
              markLeft={18.15}
              markTop={37.8}
              {...choiceProps}
            />
            <PdfChoice
              label="Whole ham yes"
              name="whole_ham"
              value="yes"
              currentValue={form.whole_ham}
              left={29.3}
              top={36.5}
              width={6.3}
              height={2.5}
              markLeft={30.25}
              markTop={37.8}
              {...choiceProps}
            />
            <PdfChoice
              label="Whole ham no"
              name="whole_ham"
              value="no"
              currentValue={form.whole_ham}
              left={35.5}
              top={36.5}
              width={5.4}
              height={2.5}
              markLeft={36.6}
              markTop={37.8}
              {...choiceProps}
            />
            <PdfChoice
              label="Smoke whole ham"
              name="whole_ham_smoked"
              value={true}
              currentValue={form.whole_ham_smoked}
              left={40.7}
              top={36.5}
              width={9.2}
              height={2.5}
              markLeft={41.65}
              markTop={37.8}
              toggle
              {...choiceProps}
            />
            <PdfChoice
              label="Stew meat yes"
              name="stew_meat"
              value="yes"
              currentValue={form.stew_meat}
              left={52}
              top={36.5}
              width={6.3}
              height={2.5}
              markLeft={53.1}
              markTop={37.8}
              {...choiceProps}
            />
            <PdfChoice
              label="Stew meat no"
              name="stew_meat"
              value="no"
              currentValue={form.stew_meat}
              left={58.2}
              top={36.5}
              width={5.5}
              height={2.5}
              markLeft={59.2}
              markTop={37.8}
              {...choiceProps}
            />
            <PdfInput
              label="Pounds of stew meat"
              value={String(form.stew_meat_lbs || "")}
              disabled={submitted || form.stew_meat !== "yes"}
              inputMode="decimal"
              left={70.2}
              top={36.55}
              width={8.2}
              height={2.5}
              onChange={(value) => setValue("stew_meat_lbs", value)}
            />

            <PdfChoice
              label="Inner loin yes"
              name="inner_loin"
              value="yes"
              currentValue={form.inner_loin}
              left={11.5}
              top={42.5}
              width={6.2}
              height={2.5}
              markLeft={12.35}
              markTop={43.85}
              {...choiceProps}
            />
            <PdfChoice
              label="Inner loin no"
              name="inner_loin"
              value="no"
              currentValue={form.inner_loin}
              left={17.6}
              top={42.5}
              width={5.5}
              height={2.5}
              markLeft={18.6}
              markTop={43.85}
              {...choiceProps}
            />
            <PdfChoice
              label="Back-straps whole"
              name="back_straps"
              value="whole"
              currentValue={form.back_straps}
              left={27.7}
              top={42.5}
              width={7.8}
              height={2.5}
              markLeft={28.85}
              markTop={43.85}
              {...choiceProps}
            />
            <PdfChoice
              label="Back-straps steaks"
              name="back_straps"
              value="steaks"
              currentValue={form.back_straps}
              left={34.7}
              top={42.5}
              width={8.3}
              height={2.5}
              markLeft={35.8}
              markTop={43.85}
              {...choiceProps}
            />
            <PdfChoice
              label="Back-straps butterfly steaks"
              name="back_straps"
              value="butterfly_steaks"
              currentValue={form.back_straps}
              left={43}
              top={42.5}
              width={13.5}
              height={2.5}
              markLeft={44.05}
              markTop={43.85}
              {...choiceProps}
            />
            <PdfChoice
              label="Add suet yes"
              name="add_suet"
              value="yes"
              currentValue={form.add_suet}
              left={59.8}
              top={42.5}
              width={6.3}
              height={2.5}
              markLeft={60.95}
              markTop={43.85}
              {...choiceProps}
            />
            <PdfChoice
              label="Add suet no"
              name="add_suet"
              value="no"
              currentValue={form.add_suet}
              left={66.2}
              top={42.5}
              width={5.4}
              height={2.5}
              markLeft={67.3}
              markTop={43.85}
              {...choiceProps}
            />

            {products.map((product, index) => (
              <PdfInput
                key={product.key}
                label={`${product.label} quantity`}
                value={String(form[product.key] || "")}
                disabled={submitted}
                inputMode={product.inputMode}
                left={50.8}
                top={48.7 + index * 3.03}
                width={12.1}
                height={2.75}
                onChange={(value) => setValue(product.key, value)}
              />
            ))}

            <PdfInput
              label="Total pounds of meat needed"
              value={String(form.total_lbs_meat_needed || "")}
              disabled={submitted}
              inputMode="decimal"
              left={31.6}
              top={93.65}
              width={7.8}
              height={2.5}
              onChange={(value) => setValue("total_lbs_meat_needed", value)}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 pb-10">
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
          ) : null}
        </div>
      </div>
    </main>
  );
}
