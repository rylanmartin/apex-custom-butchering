"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { PDFFont, PDFPage } from "pdf-lib";
import { createClient } from "@/lib/supabase/client";

type FormData = Record<string, unknown>;
type Customer = { name: string | null; phone: string | null };
type Animal = { hanging_weight: number | null; kill_date: string | null };

type CutSheet = {
  id: string;
  animal_type: string;
  secure_token: string;
  unlocked: boolean;
  submitted_at: string | null;
  printed_at: string | null;
  form_data: FormData | null;
  customers: Customer | Customer[] | null;
  animals: Animal | Animal[] | null;
};

type Tab = "waiting" | "submitted" | "printed";
type MarkSize = "normal" | "large" | "tiny";
type ChoiceMark = { name: string; left: number; top: number; size?: MarkSize };
type TextField = { name: string; left: number; top: number; width: number; fontScale: number; multiline?: boolean };

const supabase = createClient();

const choiceMarks: ChoiceMark[] = [
  { name: "portion_quarter", left: 18.812, top: 22.74, size: "large" },
  { name: "portion_half", left: 43.004, top: 22.74, size: "large" },
  { name: "portion_whole", left: 64.962, top: 22.74, size: "large" },
  { name: "chuck_steak", left: 4.997, top: 33.894 },
  { name: "chuck_roast", left: 14.991, top: 33.894 },
  { name: "chuck_grind", left: 25.456, top: 33.894 },
  { name: "brisket_whole", left: 36.626, top: 33.894 },
  { name: "brisket_half", left: 47.854, top: 33.894 },
  { name: "brisket_grind", left: 57.084, top: 33.894 },
  { name: "arm_roast_yes", left: 72.84, top: 31.94 },
  { name: "arm_roast_grind", left: 84.068, top: 31.94 },
  { name: "english_roast_yes", left: 72.84, top: 36.756 },
  { name: "english_roast_grind", left: 84.068, top: 36.756 },
  { name: "apex_roast_yes", left: 72.84, top: 41.481 },
  { name: "apex_roast_grind", left: 84.068, top: 41.481 },
  { name: "ribeye_steak", left: 4.997, top: 40.891 },
  { name: "ribeye_roast", left: 14.991, top: 40.891 },
  { name: "ribeye_grind", left: 25.456, top: 40.891 },
  { name: "short_ribs_yes", left: 41.24, top: 40.891 },
  { name: "short_ribs_grind", left: 52.44, top: 40.891 },
  { name: "skirt_steak_yes", left: 9.818, top: 51.431 },
  { name: "skirt_steak_grind", left: 21.017, top: 51.431 },
  { name: "sirloin_tip_yes", left: 41.329, top: 51.431 },
  { name: "sirloin_tip_grind", left: 52.557, top: 51.431 },
  { name: "tri_tip_yes", left: 72.781, top: 51.431 },
  { name: "tri_tip_grind", left: 84.009, top: 51.431 },
  { name: "filet_new_york", left: 36.743, top: 54.839 },
  { name: "tbone_porterhouse", left: 36.743, top: 58.201 },
  { name: "soup_bones_yes", left: 72.781, top: 58.246 },
  { name: "soup_bones_grind", left: 84.009, top: 58.246 },
  { name: "round_steak", left: 4.38, top: 65.175 },
  { name: "round_roast", left: 12.052, top: 65.175 },
  { name: "round_cube", left: 20.106, top: 65.175 },
  { name: "round_grind", left: 27.572, top: 65.175 },
  { name: "rump_roast_yes", left: 41.329, top: 65.198 },
  { name: "rump_roast_grind", left: 52.557, top: 65.198 },
  { name: "sirloin_steak", left: 8.936, top: 72.24 },
  { name: "sirloin_grind", left: 21.928, top: 72.24 },
  { name: "picanha_yes", left: 41.329, top: 72.24 },
  { name: "picanha_grind", left: 52.557, top: 72.24 },
  { name: "heart_yes", left: 83.7, top: 61.65, size: "tiny" },
  { name: "heart_no", left: 91.2, top: 61.65, size: "tiny" },
  { name: "tongue_yes", left: 83.7, top: 64.28, size: "tiny" },
  { name: "tongue_no", left: 91.2, top: 64.28, size: "tiny" },
  { name: "liver_yes", left: 83.7, top: 66.9, size: "tiny" },
  { name: "liver_no", left: 91.2, top: 66.9, size: "tiny" },
  { name: "dog_bones_yes", left: 83.7, top: 69.53, size: "tiny" },
  { name: "dog_bones_no", left: 91.2, top: 69.53, size: "tiny" },
  { name: "oxtail_yes", left: 83.7, top: 72.15, size: "tiny" },
  { name: "oxtail_no", left: 91.2, top: 72.15, size: "tiny" },
  { name: "ground_1lb", left: 69.7, top: 79.35, size: "tiny" },
  { name: "ground_1_5lb", left: 80.8, top: 79.35, size: "tiny" },
  { name: "ground_2lb", left: 92, top: 79.35, size: "tiny" },
];

const textFields: TextField[] = [
  { name: "customer_name", left: 49, top: 5.8, width: 46.8, fontScale: 0.019 },
  { name: "phone_number", left: 47.3, top: 8.55, width: 48.5, fontScale: 0.019 },
  { name: "farmer_name", left: 47, top: 11.45, width: 48.8, fontScale: 0.019 },
  { name: "slaughter_weight", left: 42.3, top: 14.55, width: 21.7, fontScale: 0.016 },
  { name: "slaughter_date", left: 78.2, top: 14.55, width: 17.5, fontScale: 0.016 },
  { name: "steak_thickness", left: 24.28, top: 78.25, width: 6.8, fontScale: 0.017 },
  { name: "steaks_per_pack", left: 24.4, top: 81.25, width: 6.8, fontScale: 0.017 },
  { name: "average_roast_weight", left: 30.7, top: 84.25, width: 6.8, fontScale: 0.017 },
  { name: "stew_meat_lbs", left: 18, top: 87.25, width: 6.8, fontScale: 0.017 },
  { name: "patties_lbs", left: 58.5, top: 81.25, width: 6.8, fontScale: 0.017 },
  { name: "jerky_lbs", left: 57.55, top: 84.25, width: 6.8, fontScale: 0.017 },
  { name: "cubed_steak_lbs", left: 65.6, top: 87.25, width: 6.8, fontScale: 0.017 },
  { name: "notes", left: 7, top: 90.65, width: 89, fontScale: 0.016, multiline: true },
];

function firstRelation<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function getCustomer(sheet: CutSheet) {
  return firstRelation(sheet.customers);
}

function getAnimal(sheet: CutSheet) {
  return firstRelation(sheet.animals);
}

function getFormData(sheet: CutSheet): FormData {
  const customer = getCustomer(sheet);
  const animal = getAnimal(sheet);
  const saved = sheet.form_data ?? {};

  return {
    ...saved,
    customer_name: saved.customer_name || customer?.name || "",
    phone_number: saved.phone_number || customer?.phone || "",
    slaughter_weight: saved.slaughter_weight || animal?.hanging_weight || "",
    slaughter_date: saved.slaughter_date || animal?.kill_date || "",
  };
}

function customerName(sheet: CutSheet) {
  return String(getFormData(sheet).customer_name || "Customer");
}

function formatDate(value: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (!current || font.widthOfTextAtSize(next, size) <= maxWidth) current = next;
    else {
      lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines;
}

function drawRedCheck(page: PDFPage, left: number, top: number, size: MarkSize = "normal") {
  const { width, height } = page.getSize();
  const centerX = width * left / 100;
  const centerY = height * (1 - top / 100);
  const markSize = size === "large" ? 12 : size === "tiny" ? 6 : 8;
  const thickness = size === "large" ? 2.2 : 1.6;
  const color = rgb(1, 0, 0);

  page.drawLine({
    start: { x: centerX - markSize * 0.45, y: centerY },
    end: { x: centerX - markSize * 0.1, y: centerY - markSize * 0.35 },
    thickness,
    color,
  });
  page.drawLine({
    start: { x: centerX - markSize * 0.1, y: centerY - markSize * 0.35 },
    end: { x: centerX + markSize * 0.55, y: centerY + markSize * 0.45 },
    thickness,
    color,
  });
}

async function buildCombinedPdf(sheets: CutSheet[]) {
  const response = await fetch("/images/beef-cut-sheet.pdf");
  if (!response.ok) throw new Error("The beef cut-sheet PDF could not be loaded.");

  const template = await PDFDocument.load(await response.arrayBuffer());
  const output = await PDFDocument.create();
  const font = await output.embedFont(StandardFonts.Helvetica);

  for (const sheet of sheets) {
    const [page] = await output.copyPages(template, [0]);
    output.addPage(page);
    const data = getFormData(sheet);
    const { width, height } = page.getSize();

    for (const field of textFields) {
      const value = String(data[field.name] ?? "").trim();
      if (!value) continue;
      const size = Math.max(7, width * field.fontScale);
      const x = width * field.left / 100;
      const y = height * (1 - field.top / 100) - size;
      const maxWidth = width * field.width / 100;

      if (field.multiline) {
        wrapText(value, font, size, maxWidth).slice(0, 4).forEach((line, index) => {
          page.drawText(line, { x, y: y - index * (size + 1), size, font, color: rgb(0.05, 0.05, 0.05) });
        });
      } else {
        let fittedSize = size;
        while (fittedSize > 6 && font.widthOfTextAtSize(value, fittedSize) > maxWidth) fittedSize -= 0.5;
        page.drawText(value, { x, y, size: fittedSize, font, color: rgb(0.05, 0.05, 0.05) });
      }
    }

    for (const mark of choiceMarks) {
      if (data[mark.name] === true) drawRedCheck(page, mark.left, mark.top, mark.size);
    }
  }

  return output.save();
}

export default function AdminCutSheetsPage() {
  const router = useRouter();
  const [sheets, setSheets] = useState<CutSheet[]>([]);
  const [tab, setTab] = useState<Tab>("waiting");
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [message, setMessage] = useState("");

  async function loadCutSheets() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("cut_sheets")
      .select(`
        id,
        animal_type,
        secure_token,
        unlocked,
        submitted_at,
        printed_at,
        form_data,
        customers (name, phone),
        animals (hanging_weight, kill_date)
      `)
      .order("submitted_at", { ascending: false, nullsFirst: false });

    if (error) {
      console.error(error);
      setMessage(`Could not load cut sheets: ${error.message}`);
      setSheets([]);
    } else {
      const rows = (data ?? []) as unknown as CutSheet[];
      setSheets(rows.filter((sheet) => {
        const animal = String(sheet.animal_type || "").toLowerCase();
        return animal.includes("beef") || animal.includes("cow") || animal.includes("cattle");
      }));
    }

    setLoading(false);
  }

  useEffect(() => {
    let active = true;

    async function initialize() {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!active) return;
      if (error || !user) {
        router.replace("/login");
        return;
      }
      await loadCutSheets();
    }

    void initialize();
    return () => { active = false; };
  }, [router]);

  const waiting = useMemo(
    () => sheets.filter((sheet) => sheet.unlocked && !sheet.submitted_at),
    [sheets]
  );
  const submitted = useMemo(
    () => sheets.filter((sheet) => Boolean(sheet.submitted_at) && !sheet.printed_at),
    [sheets]
  );
  const printed = useMemo(
    () => sheets.filter((sheet) => Boolean(sheet.printed_at)),
    [sheets]
  );

  async function printSheets(requestedSheets: CutSheet[]) {
    const eligible = requestedSheets.filter((sheet) => sheet.submitted_at && !sheet.printed_at);
    if (!eligible.length || printing) {
      setMessage("There are no new submitted cut sheets to print.");
      return;
    }

    setPrinting(true);
    setMessage("Preparing cut sheets...");

    try {
      const pdfBytes = await buildCombinedPdf(eligible);
      const printedAt = new Date().toISOString();
      const ids = eligible.map((sheet) => sheet.id);

      const { error } = await supabase
        .from("cut_sheets")
        .update({ printed_at: printedAt })
        .in("id", ids)
        .is("printed_at", null);

      if (error) throw error;

      setSheets((current) =>
        current.map((sheet) => ids.includes(sheet.id) ? { ...sheet, printed_at: printedAt } : sheet)
      );

      const exactBuffer = pdfBytes.buffer.slice(
        pdfBytes.byteOffset,
        pdfBytes.byteOffset + pdfBytes.byteLength
      ) as ArrayBuffer;
      const url = URL.createObjectURL(new Blob([exactBuffer], { type: "application/pdf" }));
      const printWindow = window.open(url, "_blank");

      if (printWindow) {
        window.setTimeout(() => {
          try {
            printWindow.focus();
            printWindow.print();
          } catch {
            // The PDF is still open and can be printed from the browser toolbar.
          }
        }, 1200);
      } else {
        const link = document.createElement("a");
        link.href = url;
        link.download = `apex-submitted-cut-sheets-${new Date().toISOString().slice(0, 10)}.pdf`;
        link.click();
      }

      window.setTimeout(() => URL.revokeObjectURL(url), 120000);
      setMessage(`${eligible.length} cut sheet${eligible.length === 1 ? "" : "s"} marked printed. Printed sheets will not be included again.`);
    } catch (error) {
      console.error(error);
      setMessage(error instanceof Error ? `Could not print cut sheets: ${error.message}` : "Could not print cut sheets.");
    } finally {
      setPrinting(false);
    }
  }

  const activeSheets = tab === "waiting" ? waiting : tab === "submitted" ? submitted : printed;

  return (
    <main className="min-h-screen bg-stone-100 text-stone-950">
      <header className="bg-stone-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-red-400">Apex Custom Butchering</p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-tight">Customer Cut Sheets</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin" className="rounded-md border border-white/25 px-4 py-3 text-sm font-bold transition hover:bg-white hover:text-stone-950">Back to Dashboard</Link>
            <button type="button" onClick={loadCutSheets} disabled={loading} className="rounded-md bg-red-800 px-4 py-3 text-sm font-bold transition hover:bg-red-700 disabled:opacity-50">
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:px-12">
        <section className="grid gap-4 md:grid-cols-3">
          {([
            ["waiting", "Waiting on Customer", waiting.length],
            ["submitted", "Submitted / Ready to Print", submitted.length],
            ["printed", "Printed Archive", printed.length],
          ] as Array<[Tab, string, number]>).map(([value, label, count]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`rounded-xl border p-5 text-left shadow-sm transition ${tab === value ? "border-red-800 bg-red-800 text-white" : "border-stone-200 bg-white hover:border-red-400"}`}
            >
              <span className="block text-sm font-bold uppercase tracking-[0.12em]">{label}</span>
              <span className="mt-2 block text-4xl font-black">{count}</span>
            </button>
          ))}
        </section>

        {message ? (
          <div className={`mt-6 rounded-lg border px-5 py-4 font-semibold ${message.startsWith("Could not") ? "border-red-300 bg-red-50 text-red-900" : "border-emerald-300 bg-emerald-50 text-emerald-900"}`}>
            {message}
          </div>
        ) : null}

        <section className="mt-6 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-stone-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight">
                {tab === "waiting" ? "Waiting on Customer" : tab === "submitted" ? "Submitted / Ready to Print" : "Printed Archive"}
              </h2>
              <p className="mt-1 text-sm text-stone-600">
                {tab === "waiting"
                  ? "Unlocked cut sheets that customers have not submitted yet."
                  : tab === "submitted"
                    ? "Only new submitted sheets that have never been printed."
                    : "Previously printed sheets are kept here for your records and cannot be printed again."}
              </p>
            </div>

            {tab === "submitted" ? (
              <button
                type="button"
                onClick={() => printSheets(submitted)}
                disabled={printing || submitted.length === 0}
                className="rounded-md bg-red-800 px-6 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {printing ? "Preparing..." : `Print All New (${submitted.length})`}
              </button>
            ) : null}
          </div>

          {loading ? (
            <div className="px-6 py-16 text-center font-semibold text-stone-500">Loading cut sheets...</div>
          ) : activeSheets.length ? (
            <div className="divide-y divide-stone-200">
              {activeSheets.map((sheet) => {
                const customer = getCustomer(sheet);
                const animal = getAnimal(sheet);

                return (
                  <article key={sheet.id} className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h3 className="text-lg font-black">{customerName(sheet)}</h3>
                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-stone-600">
                        {customer?.phone ? <span>{customer.phone}</span> : null}
                        {animal?.hanging_weight ? <span>{animal.hanging_weight} lbs hanging weight</span> : null}
                        {sheet.submitted_at ? <span>Submitted: {formatDate(sheet.submitted_at)}</span> : <span>Still waiting</span>}
                        {sheet.printed_at ? <span>Printed: {formatDate(sheet.printed_at)}</span> : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {tab !== "printed" ? (
                        <a href={`/cut-sheet/${sheet.secure_token}`} target="_blank" rel="noreferrer" className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-bold transition hover:border-stone-950">
                          {tab === "waiting" ? "Open Customer Link" : "Review Cut Sheet"}
                        </a>
                      ) : (
                        <span className="rounded-md bg-stone-100 px-4 py-2 text-sm font-bold text-stone-500">Printing Locked</span>
                      )}

                      {tab === "submitted" ? (
                        <button type="button" onClick={() => printSheets([sheet])} disabled={printing} className="rounded-md bg-red-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50">
                          Print This Sheet
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <p className="font-bold text-stone-700">No cut sheets are in this section.</p>
              <p className="mt-1 text-sm text-stone-500">
                {tab === "submitted" ? "Newly submitted sheets will appear here automatically." : "This list is currently empty."}
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
