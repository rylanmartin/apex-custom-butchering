"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Document, Page, pdfjs } from "react-pdf";
import { supabase } from "../../../supabase";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type FormValue = string | boolean;
type FormValues = Record<string, FormValue>;

type Customer = {
  name: string;
  phone: string;
};

type Animal = {
  hanging_weight: number | null;
  kill_date: string | null;
};

type CutSheetRecord = {
  id: string;
  animal_type: string;
  unlocked: boolean;
  submitted_at: string | null;
  form_data: FormValues | null;
  customers: Customer | Customer[] | null;
  animals: Animal | Animal[] | null;
};

type MarkSize = "small" | "large" | "tiny";

type Choice = {
  name: string;
  page: number;
  markLeft: number;
  markTop: number;
  hitLeft?: number;
  hitTop?: number;
  hitWidth?: number;
  hitHeight?: number;
  markSize?: MarkSize;
};

type ChoiceGroup = {
  id: string;
  choices: Choice[];
  maxSelections?: number;
};

type TextField = {
  name: string;
  page: number;
  left: number;
  top: number;
  width: number;
  height?: number;
  multiline?: boolean;
  fontScale?: number;
};

/*
  PORK CUT SHEET
  Page 1 = normal pork cut choices.
  Page 2 = sausage choices.

  IMPORTANT:
  The four sausage checkboxes printed at the bottom of page 1 are intentionally
  NOT interactive. Customers make sausage choices only on page 2.
*/

const porkChoiceGroups: ChoiceGroup[] = [
  {
    id: "hams_finish",
    choices: [
      { name: "hams_cured", page: 1, markLeft: 11.7, markTop: 30.7 },
      { name: "hams_fresh", page: 1, markLeft: 11.7, markTop: 33.5 },
    ],
  },
  {
    id: "hams_size",
    choices: [
      { name: "hams_quarter", page: 1, markLeft: 15.6, markTop: 36.0 },
      { name: "hams_half", page: 1, markLeft: 15.6, markTop: 38.7 },
      { name: "hams_whole", page: 1, markLeft: 15.6, markTop: 41.5 },
      { name: "hams_steaks", page: 1, markLeft: 15.6, markTop: 44.0 },
    ],
  },
  {
    id: "hocks",
    choices: [
      { name: "hocks_cured", page: 1, markLeft: 48.6, markTop: 30.0 },
      { name: "hocks_fresh", page: 1, markLeft: 48.6, markTop: 32.8 },
    ],
  },
  {
    id: "tongue",
    choices: [
      { name: "tongue_yes", page: 1, markLeft: 80.4, markTop: 30.0 },
      { name: "tongue_no", page: 1, markLeft: 80.4, markTop: 32.8 },
    ],
  },
  {
    id: "jowls",
    choices: [
      { name: "jowls_cured", page: 1, markLeft: 48.6, markTop: 40.0 },
      { name: "jowls_fresh", page: 1, markLeft: 48.6, markTop: 42.8 },
    ],
  },
  {
    id: "liver",
    choices: [
      { name: "liver_yes", page: 1, markLeft: 80.4, markTop: 40.0 },
      { name: "liver_no", page: 1, markLeft: 80.4, markTop: 42.8 },
    ],
  },
  {
    id: "ribs",
    choices: [
      { name: "ribs_yes", page: 1, markLeft: 48.6, markTop: 50.1 },
      { name: "ribs_no", page: 1, markLeft: 48.6, markTop: 52.9 },
    ],
  },
  {
    id: "lard",
    choices: [
      { name: "lard_yes", page: 1, markLeft: 80.4, markTop: 50.1 },
      { name: "lard_no", page: 1, markLeft: 80.4, markTop: 52.9 },
    ],
  },
  {
    id: "heart",
    choices: [
      { name: "heart_yes", page: 1, markLeft: 48.4, markTop: 60.1 },
      { name: "heart_no", page: 1, markLeft: 48.4, markTop: 63.0 },
    ],
  },
  {
    id: "porkchops",
    choices: [
      { name: "porkchops_yes", page: 1, markLeft: 80.4, markTop: 60.1 },
      { name: "porkchops_no", page: 1, markLeft: 80.4, markTop: 63.0 },
    ],
  },
  {
    id: "bacon_finish",
    choices: [
      { name: "bacon_cured", page: 1, markLeft: 11.7, markTop: 53.3 },
      { name: "bacon_fresh", page: 1, markLeft: 11.7, markTop: 56.1 },
    ],
  },
  {
    id: "bacon_pack",
    choices: [
      { name: "bacon_1lb", page: 1, markLeft: 15.6, markTop: 58.7 },
      { name: "bacon_2lb", page: 1, markLeft: 15.6, markTop: 61.4 },
    ],
  },
  {
    id: "shoulder",
    choices: [
      { name: "shoulder_steak", page: 1, markLeft: 4.3, markTop: 71.2 },
      { name: "shoulder_roast", page: 1, markLeft: 4.3, markTop: 75.2 },
      { name: "pulled_pork", page: 1, markLeft: 4.3, markTop: 79.5 },
    ],
  },
  {
    id: "loin",
    choices: [
      { name: "loin_yes", page: 1, markLeft: 48.4, markTop: 70.3 },
      { name: "loin_no", page: 1, markLeft: 48.4, markTop: 73.1 },
    ],
  },
  {
    id: "loin_roast",
    choices: [
      { name: "loin_roast_yes", page: 1, markLeft: 80.4, markTop: 70.3 },
      { name: "loin_roast_no", page: 1, markLeft: 80.4, markTop: 73.1 },
    ],
  },

  // PAGE 2 — FLAVORS
  {
    id: "sausage_flavors",
    maxSelections: 2,
    choices: [
      { name: "sausage_flavor_farmstyle", page: 2, markLeft: 24.9, markTop: 27.2, markSize: "large" },
      { name: "sausage_flavor_sweet_italian", page: 2, markLeft: 28.2, markTop: 37.0, markSize: "large" },
      { name: "sausage_flavor_italian", page: 2, markLeft: 20.2, markTop: 46.5, markSize: "large" },
      { name: "sausage_flavor_regular", page: 2, markLeft: 21.9, markTop: 56.0, markSize: "large" },
      { name: "sausage_flavor_hot", page: 2, markLeft: 15.6, markTop: 65.9, markSize: "large" },
      { name: "sausage_flavor_maple", page: 2, markLeft: 18.9, markTop: 75.7, markSize: "large" },
    ],
  },
];

const porkTextFields: TextField[] = [
  {
    name: "customer_name",
    page: 1,
    left: 49.0,
    top: 6.7,
    width: 47.5,
    fontScale: 0.018,
  },
  {
    name: "phone_number",
    page: 1,
    left: 47.5,
    top: 10.9,
    width: 49.0,
    fontScale: 0.018,
  },
  {
    name: "slaughter_weight",
    page: 1,
    left: 42.5,
    top: 15.5,
    width: 22.0,
    fontScale: 0.016,
  },
  {
    name: "slaughter_date",
    page: 1,
    left: 79.0,
    top: 15.5,
    width: 17.4,
    fontScale: 0.016,
  },
  {
    name: "notes",
    page: 1,
    left: 3.5,
    top: 84.5,
    width: 93.0,
    height: 10.5,
    multiline: true,
    fontScale: 0.015,
  },

  // PAGE 2 — sausage batch/style amounts
  {
    name: "sausage_farmstyle_brats_batches",
    page: 2,
    left: 64.5,
    top: 26.5,
    width: 5.0,
    fontScale: 0.017,
  },
  {
    name: "sausage_farmstyle_brats_cheese_batches",
    page: 2,
    left: 64.8,
    top: 31.3,
    width: 5.0,
    fontScale: 0.017,
  },
  {
    name: "sausage_sweet_italian_patties_batches",
    page: 2,
    left: 65.7,
    top: 36.6,
    width: 4.8,
    fontScale: 0.017,
  },
  {
    name: "sausage_sweet_italian_patties_cheese_batches",
    page: 2,
    left: 64.8,
    top: 41.4,
    width: 5.0,
    fontScale: 0.017,
  },
  {
    name: "sausage_italian_links_batches",
    page: 2,
    left: 64.5,
    top: 46.1,
    width: 5.0,
    fontScale: 0.017,
  },
  {
    name: "sausage_italian_links_cheese_batches",
    page: 2,
    left: 64.7,
    top: 51.0,
    width: 5.0,
    fontScale: 0.017,
  },
  {
    name: "sausage_ground_pork_lbs",
    page: 2,
    left: 76.7,
    top: 56.0,
    width: 5.2,
    fontScale: 0.017,
  },
];

function createBlankForm(): FormValues {
  const values: FormValues = {};

  for (const group of porkChoiceGroups) {
    for (const choice of group.choices) {
      values[choice.name] = false;
    }
  }

  for (const field of porkTextFields) {
    values[field.name] = "";
  }

  return values;
}

function getMarkFontSize(pageWidth: number, markSize: MarkSize | undefined) {
  if (markSize === "large") return Math.max(12, pageWidth * 0.022);
  if (markSize === "tiny") return Math.max(8, pageWidth * 0.0145);
  return Math.max(9, pageWidth * 0.0175);
}

export default function PorkCutSheetPage() {
  const params = useParams();
  const token = String(params.token || "");
  const blankForm = useMemo(() => createBlankForm(), []);

  const [cutSheet, setCutSheet] = useState<CutSheetRecord | null>(null);
  const [formData, setFormData] = useState<FormValues>(blankForm);
  const [pageWidth, setPageWidth] = useState(900);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [pdfError, setPdfError] = useState("");
  const [numPages, setNumPages] = useState(2);

  useEffect(() => {
    function updateWidth() {
      setPageWidth(Math.min(window.innerWidth - 24, 900));
    }

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  useEffect(() => {
    async function loadCutSheet() {
      setLoading(true);
      setMessage("");

      const { data, error } = await supabase
        .from("cut_sheets")
        .select(`
          id,
          animal_type,
          unlocked,
          submitted_at,
          form_data,
          customers (
            name,
            phone
          ),
          animals (
            hanging_weight,
            kill_date
          )
        `)
        .eq("secure_token", token)
        .single();

      if (error) {
        console.error(error);
        setMessage(`Cut-sheet error: ${error.message}`);
        setLoading(false);
        return;
      }

      const record = data as unknown as CutSheetRecord;

      const customer = Array.isArray(record.customers)
        ? record.customers[0]
        : record.customers;

      const animal = Array.isArray(record.animals)
        ? record.animals[0]
        : record.animals;

      setCutSheet(record);

      setFormData({
        ...blankForm,
        ...(record.form_data || {}),
        customer_name: String(
          record.form_data?.customer_name || customer?.name || ""
        ),
        phone_number: String(
          record.form_data?.phone_number || customer?.phone || ""
        ),
        slaughter_weight: String(
          record.form_data?.slaughter_weight || animal?.hanging_weight || ""
        ),
        slaughter_date: String(
          record.form_data?.slaughter_date || animal?.kill_date || ""
        ),
      });

      setLoading(false);
    }

    if (token) loadCutSheet();
  }, [token, blankForm]);

  function updateText(name: string, value: string) {
    if (cutSheet?.submitted_at) return;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function chooseOption(group: ChoiceGroup, selectedName: string) {
    if (cutSheet?.submitted_at) return;

    setFormData((current) => {
      const updated = { ...current };
      const wasSelected = Boolean(current[selectedName]);

      if (group.maxSelections && group.maxSelections > 1) {
        if (wasSelected) {
          updated[selectedName] = false;
          return updated;
        }

        const selectedCount = group.choices.filter((choice) =>
          Boolean(current[choice.name])
        ).length;

        if (selectedCount >= group.maxSelections) {
          setMessage(
            `You can choose up to ${group.maxSelections} sausage flavors on this form.`
          );
          return current;
        }

        updated[selectedName] = true;
        setMessage("");
        return updated;
      }

      for (const choice of group.choices) {
        updated[choice.name] = false;
      }

      if (!wasSelected) updated[selectedName] = true;

      return updated;
    });
  }

  async function saveDraft() {
    if (!cutSheet) return;

    setSaving(true);
    setMessage("Saving cut sheet...");

    const { error } = await supabase
      .from("cut_sheets")
      .update({ form_data: formData })
      .eq("id", cutSheet.id);

    setSaving(false);

    if (error) {
      console.error(error);
      setMessage(`Save error: ${error.message}`);
      return;
    }

    setMessage("Cut sheet saved.");
  }

  async function submitCutSheet() {
    if (!cutSheet) return;

    const confirmed = window.confirm(
      "Submit both pages of this pork cut sheet to APEX Custom Butchering? It cannot be changed after submission."
    );

    if (!confirmed) return;

    setSaving(true);
    setMessage("Submitting cut sheet...");

    const submittedAt = new Date().toISOString();

    const { error } = await supabase
      .from("cut_sheets")
      .update({
        form_data: formData,
        submitted_at: submittedAt,
      })
      .eq("id", cutSheet.id);

    if (error) {
      console.error(error);
      setSaving(false);
      setMessage(`Submit error: ${error.message}`);
      return;
    }

    const { data: sheetRow } = await supabase
      .from("cut_sheets")
      .select("animal_id")
      .eq("id", cutSheet.id)
      .single();

    if (sheetRow?.animal_id) {
      await supabase
        .from("animals")
        .update({ status: "cut_sheet_submitted" })
        .eq("id", sheetRow.animal_id);
    }

    setCutSheet({
      ...cutSheet,
      submitted_at: submittedAt,
      form_data: formData,
    });

    setSaving(false);
    setMessage("Pork cut sheet submitted successfully.");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-10 text-center text-2xl">
        Loading pork cut sheet...
      </main>
    );
  }

  if (!cutSheet) {
    return (
      <main className="min-h-screen bg-gray-100 px-6 py-12">
        <div className="mx-auto max-w-3xl rounded-xl bg-white p-8 shadow">
          <h1 className="mb-4 text-3xl font-bold">Cut Sheet Not Found</h1>
          <p className="text-red-700">
            {message || "This cut-sheet link is not valid."}
          </p>
        </div>
      </main>
    );
  }

  if (!cutSheet.unlocked) {
    return (
      <main className="min-h-screen bg-gray-100 px-6 py-12">
        <div className="mx-auto max-w-3xl rounded-xl bg-white p-8 shadow">
          <h1 className="mb-4 text-4xl font-bold">
            Your Cut Sheet Is Locked
          </h1>
          <p className="text-lg text-gray-700">
            APEX Custom Butchering has not unlocked this cut sheet yet.
          </p>
        </div>
      </main>
    );
  }

  const submitted = Boolean(cutSheet.submitted_at);

  function renderOverlay(pageNumber: number) {
    const pageTextFields = porkTextFields.filter(
      (field) => field.page === pageNumber
    );

    const pageChoiceGroups = porkChoiceGroups
      .map((group) => ({
        ...group,
        choices: group.choices.filter(
          (choice) => choice.page === pageNumber
        ),
      }))
      .filter((group) => group.choices.length > 0);

    return (
      <div className="pointer-events-none absolute inset-0 z-30">
        {pageTextFields.map((field) => {
          const fontSize = Math.max(
            9,
            pageWidth * (field.fontScale || 0.017)
          );

          const style = {
            left: `${field.left}%`,
            top: `${field.top}%`,
            width: `${field.width}%`,
            height: field.height ? `${field.height}%` : "2.45%",
            fontSize: `${fontSize}px`,
            pointerEvents: "auto" as const,
          };

          if (field.multiline) {
            return (
              <textarea
                key={field.name}
                className="sheet-textarea absolute resize-none"
                style={style}
                value={String(formData[field.name] || "")}
                disabled={submitted}
                onChange={(event) =>
                  updateText(field.name, event.target.value)
                }
                aria-label={field.name}
              />
            );
          }

          return (
            <input
              key={field.name}
              type="text"
              className="sheet-input absolute"
              style={style}
              value={String(formData[field.name] || "")}
              disabled={submitted}
              onChange={(event) =>
                updateText(field.name, event.target.value)
              }
              aria-label={field.name}
            />
          );
        })}

        {pageChoiceGroups.flatMap((group) =>
          group.choices.map((choice) => {
            const selected = Boolean(formData[choice.name]);

            const hitLeft = choice.hitLeft ?? choice.markLeft;
            const hitTop = choice.hitTop ?? choice.markTop;
            const hitWidth = choice.hitWidth ?? 5.2;
            const hitHeight = choice.hitHeight ?? 3.2;

            return (
              <div key={choice.name}>
                <button
                  type="button"
                  disabled={submitted}
                  className="choice-hit-area absolute"
                  style={{
                    left: `${hitLeft - hitWidth / 2}%`,
                    top: `${hitTop - hitHeight / 2}%`,
                    width: `${hitWidth}%`,
                    height: `${hitHeight}%`,
                    pointerEvents: "auto",
                  }}
                  onClick={() => chooseOption(group, choice.name)}
                  aria-label={choice.name}
                />

                {selected && (
                  <span
                    className="choice-mark"
                    style={{
                      left: `${choice.markLeft}%`,
                      top: `${choice.markTop}%`,
                      fontSize: `${getMarkFontSize(
                        pageWidth,
                        choice.markSize
                      )}px`,
                    }}
                  >
                    ✓
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @page {
          size: letter portrait;
          margin: 0;
        }

        .react-pdf__Document,
        .react-pdf__Page {
          width: 100%;
        }

        .react-pdf__Page__canvas {
          display: block;
          width: 100% !important;
          height: auto !important;
        }

        .sheet-input,
        .sheet-textarea {
          border: 0;
          background: transparent;
          outline: none;
          box-shadow: none;
          color: #111;
          line-height: 1.1;
          z-index: 35;
        }

        .sheet-input:focus,
        .sheet-textarea:focus {
          background: rgba(255, 255, 210, 0.6);
        }

        .choice-hit-area {
          appearance: none;
          border: 0;
          background: transparent;
          outline: none;
          box-shadow: none;
          padding: 0;
          margin: 0;
          cursor: pointer;
          pointer-events: auto;
          z-index: 50;
        }

        .choice-mark {
          position: absolute;
          z-index: 45;
          pointer-events: none;
          color: #000;
          font-family: Arial, Helvetica, sans-serif;
          font-weight: 900;
          line-height: 1;
          transform: translate(-50%, -54%);
          user-select: none;
        }

        @media print {
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .no-print {
            display: none !important;
          }

          .page-background {
            background: white !important;
            padding: 0 !important;
          }

          .sheet-shell {
            width: 8.5in !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            break-after: page;
          }

          .react-pdf__Page,
          .react-pdf__Page__canvas {
            width: 8.5in !important;
            height: auto !important;
          }

          .sheet-input,
          .sheet-textarea,
          .choice-hit-area {
            background: transparent !important;
            border: 0 !important;
            outline: none !important;
            box-shadow: none !important;
            color: black !important;
            -webkit-text-fill-color: black !important;
          }
        }
      `}</style>

      <main className="page-background min-h-screen bg-gray-100 px-3 py-6 sm:px-4 sm:py-8">
        <section className="no-print mx-auto mb-6 max-w-5xl rounded-xl bg-white p-5 shadow sm:p-6">
          <h1 className="text-3xl font-bold">Pork Cut Sheet</h1>

          <p className="mt-2 text-gray-600">
            Complete page 1 for your pork cuts, then complete the sausage
            choices on page 2. The sausage boxes printed at the bottom of
            page 1 are intentionally not fillable.
          </p>

          {submitted && (
            <div className="mt-4 rounded-lg bg-green-50 p-4 font-bold text-green-800">
              This pork cut sheet has been submitted and is now read-only.
            </div>
          )}

          {message && (
            <div className="mt-4 rounded-lg bg-yellow-50 p-4 font-bold text-yellow-900">
              {message}
            </div>
          )}

          {pdfError && (
            <div className="mt-4 rounded-lg bg-red-50 p-4 font-bold text-red-800">
              PDF error: {pdfError}
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            {!submitted && (
              <>
                <button
                  type="button"
                  disabled={saving}
                  onClick={saveDraft}
                  className="rounded-lg bg-gray-900 px-5 py-3 font-bold text-white hover:bg-black disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Cut Sheet"}
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={submitCutSheet}
                  className="rounded-lg bg-red-700 px-5 py-3 font-bold text-white hover:bg-red-800 disabled:opacity-50"
                >
                  Submit Both Pages
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-lg bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800"
            >
              Print Cut Sheet
            </button>
          </div>
        </section>

        <Document
          file="/images/pork-cut-sheet.pdf"
          loading={
            <div className="mx-auto max-w-4xl rounded-xl bg-white p-10 text-center text-xl shadow">
              Loading PDF...
            </div>
          }
          error={
            <div className="mx-auto max-w-4xl rounded-xl bg-white p-10 text-center text-xl text-red-700 shadow">
              Failed to load PDF file.
            </div>
          }
          onLoadSuccess={({ numPages: loadedPages }) => {
            setNumPages(loadedPages);
          }}
          onLoadError={(error) => {
            console.error(error);
            setPdfError(error.message);
          }}
          onSourceError={(error) => {
            console.error(error);
            setPdfError(error.message);
          }}
        >
          {Array.from({ length: Math.min(numPages, 2) }, (_, index) => {
            const pageNumber = index + 1;

            return (
              <div
                key={pageNumber}
                className="sheet-shell relative mx-auto mb-6 overflow-hidden bg-white shadow-2xl"
                style={{ width: `${pageWidth}px` }}
              >
                <Page
                  pageNumber={pageNumber}
                  width={pageWidth}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />

                {renderOverlay(pageNumber)}
              </div>
            );
          })}
        </Document>
      </main>
    </>
  );
}