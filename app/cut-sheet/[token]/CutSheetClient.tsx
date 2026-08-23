"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Document, Page, pdfjs } from "react-pdf";
import { supabase } from "../../../supabase";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

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

  // Exact location where the visible check mark is drawn.
  markLeft: number;
  markTop: number;

  // Invisible clickable area. This can be larger than the printed box.
  hitLeft?: number;
  hitTop?: number;
  hitWidth?: number;
  hitHeight?: number;

  markSize?: MarkSize;
};

type ChoiceGroup = {
  id: string;
  choices: Choice[];
};

type TextField = {
  name: string;
  left: number;
  top: number;
  width: number;
  height?: number;
  multiline?: boolean;
  fontScale?: number;
};

type LivestockSpecies = "beef" | "pork" | "sheep" | "goat";

type SpeciesConfig = {
  species: LivestockSpecies;
  title: string;
  pdfPath: string;
  choiceGroups: ChoiceGroup[];
  textFields: TextField[];
};

/*
 * These positions were measured directly from page 1 of
 * public/images/beef-cut-sheet.pdf.
 *
 * The visible marks sit inside the PDF's original printed boxes.
 * The click targets are invisible and slightly larger, making the
 * original boxes easier to click without displaying extra boxes.
 */
const choiceGroups: ChoiceGroup[] = [
  {
    id: "portion",
    choices: [
      {
        name: "portion_quarter",
        markLeft: 18.812,
        markTop: 22.74,
        hitWidth: 7,
        hitHeight: 3.8,
        markSize: "large",
      },
      {
        name: "portion_half",
        markLeft: 43.004,
        markTop: 22.74,
        hitWidth: 7,
        hitHeight: 3.8,
        markSize: "large",
      },
      {
        name: "portion_whole",
        markLeft: 64.962,
        markTop: 22.74,
        hitWidth: 7,
        hitHeight: 3.8,
        markSize: "large",
      },
    ],
  },
  {
    id: "chuck",
    choices: [
      { name: "chuck_steak", markLeft: 4.997, markTop: 33.894 },
      { name: "chuck_roast", markLeft: 14.991, markTop: 33.894 },
      { name: "chuck_grind", markLeft: 25.456, markTop: 33.894 },
    ],
  },
  {
    id: "brisket",
    choices: [
      { name: "brisket_whole", markLeft: 36.626, markTop: 33.894 },
      { name: "brisket_half", markLeft: 47.854, markTop: 33.894 },
      { name: "brisket_grind", markLeft: 57.084, markTop: 33.894 },
    ],
  },
  {
    id: "arm_roast",
    choices: [
      { name: "arm_roast_yes", markLeft: 72.84, markTop: 31.94 },
      { name: "arm_roast_grind", markLeft: 84.068, markTop: 31.94 },
    ],
  },
  {
    id: "english_roast",
    choices: [
      { name: "english_roast_yes", markLeft: 72.84, markTop: 36.756 },
      { name: "english_roast_grind", markLeft: 84.068, markTop: 36.756 },
    ],
  },
  {
    id: "apex_roast",
    choices: [
      { name: "apex_roast_yes", markLeft: 72.84, markTop: 41.481 },
      { name: "apex_roast_grind", markLeft: 84.068, markTop: 41.481 },
    ],
  },
  {
    id: "ribeye",
    choices: [
      { name: "ribeye_steak", markLeft: 4.997, markTop: 40.891 },
      { name: "ribeye_roast", markLeft: 14.991, markTop: 40.891 },
      { name: "ribeye_grind", markLeft: 25.456, markTop: 40.891 },
    ],
  },
  {
    id: "short_ribs",
    choices: [
      { name: "short_ribs_yes", markLeft: 41.24, markTop: 40.891 },
      { name: "short_ribs_grind", markLeft: 52.44, markTop: 40.891 },
    ],
  },
  {
    id: "skirt_steak",
    choices: [
      { name: "skirt_steak_yes", markLeft: 9.818, markTop: 51.431 },
      { name: "skirt_steak_grind", markLeft: 21.017, markTop: 51.431 },
    ],
  },
  {
    id: "sirloin_tip",
    choices: [
      { name: "sirloin_tip_yes", markLeft: 41.329, markTop: 51.431 },
      { name: "sirloin_tip_grind", markLeft: 52.557, markTop: 51.431 },
    ],
  },
  {
    id: "tri_tip",
    choices: [
      { name: "tri_tip_yes", markLeft: 72.781, markTop: 51.431 },
      { name: "tri_tip_grind", markLeft: 84.009, markTop: 51.431 },
    ],
  },
  {
    id: "steak_choice",
    choices: [
      { name: "filet_new_york", markLeft: 36.743, markTop: 54.839 },
      { name: "tbone_porterhouse", markLeft: 36.743, markTop: 58.201 },
    ],
  },
  {
    id: "soup_bones",
    choices: [
      { name: "soup_bones_yes", markLeft: 72.781, markTop: 58.246 },
      { name: "soup_bones_grind", markLeft: 84.009, markTop: 58.246 },
    ],
  },
  {
    id: "round",
    choices: [
      {
        name: "round_steak",
        markLeft: 4.38,
        markTop: 65.175,
        hitWidth: 4.6,
      },
      {
        name: "round_roast",
        markLeft: 12.052,
        markTop: 65.175,
        hitWidth: 4.6,
      },
      {
        name: "round_cube",
        markLeft: 20.106,
        markTop: 65.175,
        hitWidth: 4.6,
      },
      {
        name: "round_grind",
        markLeft: 27.572,
        markTop: 65.175,
        hitWidth: 4.6,
      },
    ],
  },
  {
    id: "rump_roast",
    choices: [
      { name: "rump_roast_yes", markLeft: 41.329, markTop: 65.198 },
      { name: "rump_roast_grind", markLeft: 52.557, markTop: 65.198 },
    ],
  },
  {
    id: "sirloin",
    choices: [
      { name: "sirloin_steak", markLeft: 8.936, markTop: 72.24 },
      { name: "sirloin_grind", markLeft: 21.928, markTop: 72.24 },
    ],
  },
  {
    id: "picanha",
    choices: [
      { name: "picanha_yes", markLeft: 41.329, markTop: 72.24 },
      { name: "picanha_grind", markLeft: 52.557, markTop: 72.24 },
    ],
  },

  // The PDF prints "Yes / No" for these rows rather than printing boxes.
  // The click areas sit over those words, and the selected choice receives
  // a small black check mark beside the printed word. No extra box is drawn.
  {
    id: "heart",
    choices: [
      {
        name: "heart_yes",
        markLeft: 83.7,
        markTop: 61.65,
        hitLeft: 86.2,
        hitTop: 61.65,
        hitWidth: 7,
        hitHeight: 2.6,
        markSize: "tiny",
      },
      {
        name: "heart_no",
        markLeft: 91.2,
        markTop: 61.65,
        hitLeft: 94,
        hitTop: 61.65,
        hitWidth: 6,
        hitHeight: 2.6,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "tongue",
    choices: [
      {
        name: "tongue_yes",
        markLeft: 83.7,
        markTop: 64.28,
        hitLeft: 86.2,
        hitTop: 64.28,
        hitWidth: 7,
        hitHeight: 2.6,
        markSize: "tiny",
      },
      {
        name: "tongue_no",
        markLeft: 91.2,
        markTop: 64.28,
        hitLeft: 94,
        hitTop: 64.28,
        hitWidth: 6,
        hitHeight: 2.6,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "liver",
    choices: [
      {
        name: "liver_yes",
        markLeft: 83.7,
        markTop: 66.9,
        hitLeft: 86.2,
        hitTop: 66.9,
        hitWidth: 7,
        hitHeight: 2.6,
        markSize: "tiny",
      },
      {
        name: "liver_no",
        markLeft: 91.2,
        markTop: 66.9,
        hitLeft: 94,
        hitTop: 66.9,
        hitWidth: 6,
        hitHeight: 2.6,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "dog_bones",
    choices: [
      {
        name: "dog_bones_yes",
        markLeft: 83.7,
        markTop: 69.53,
        hitLeft: 86.2,
        hitTop: 69.53,
        hitWidth: 7,
        hitHeight: 2.6,
        markSize: "tiny",
      },
      {
        name: "dog_bones_no",
        markLeft: 91.2,
        markTop: 69.53,
        hitLeft: 94,
        hitTop: 69.53,
        hitWidth: 6,
        hitHeight: 2.6,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "oxtail",
    choices: [
      {
        name: "oxtail_yes",
        markLeft: 83.7,
        markTop: 72.15,
        hitLeft: 86.2,
        hitTop: 72.15,
        hitWidth: 7,
        hitHeight: 2.6,
        markSize: "tiny",
      },
      {
        name: "oxtail_no",
        markLeft: 91.2,
        markTop: 72.15,
        hitLeft: 94,
        hitTop: 72.15,
        hitWidth: 6,
        hitHeight: 2.6,
        markSize: "tiny",
      },
    ],
  },

  // Ground beef package sizes use the existing underline blanks on the PDF.
  {
    id: "ground_package",
    choices: [
      {
        name: "ground_1lb",
        markLeft: 69.7,
        markTop: 79.35,
        hitLeft: 68,
        hitTop: 79.25,
        hitWidth: 10,
        hitHeight: 3,
        markSize: "tiny",
      },
      {
        name: "ground_1_5lb",
        markLeft: 80.8,
        markTop: 79.35,
        hitLeft: 80.3,
        hitTop: 79.25,
        hitWidth: 10,
        hitHeight: 3,
        markSize: "tiny",
      },
      {
        name: "ground_2lb",
        markLeft: 92,
        markTop: 79.35,
        hitLeft: 92,
        hitTop: 79.25,
        hitWidth: 9,
        hitHeight: 3,
        markSize: "tiny",
      },
    ],
  },
];

const textFields: TextField[] = [
  {
    name: "customer_name",
    left: 49,
    top: 5.8,
    width: 46.8,
    fontScale: 0.019,
  },
  {
    name: "phone_number",
    left: 47.3,
    top: 8.55,
    width: 48.5,
    fontScale: 0.019,
  },
  {
    name: "farmer_name",
    left: 47,
    top: 11.45,
    width: 48.8,
    fontScale: 0.019,
  },
  {
    name: "slaughter_weight",
    left: 42.3,
    top: 14.55,
    width: 21.7,
    fontScale: 0.016,
  },
  {
    name: "slaughter_date",
    left: 78.2,
    top: 14.55,
    width: 17.5,
    fontScale: 0.016,
  },
  {
    name: "steak_thickness",
    left: 24.28,
    top: 78.25,
    width: 6.8,
    fontScale: 0.017,
  },
  {
    name: "steaks_per_pack",
    left: 24.4,
    top: 81.25,
    width: 6.8,
    fontScale: 0.017,
  },
  {
    name: "average_roast_weight",
    left: 30.7,
    top: 84.25,
    width: 6.8,
    fontScale: 0.017,
  },
  {
    name: "stew_meat_lbs",
    left: 18.0,
    top: 87.25,
    width: 6.8,
    fontScale: 0.017,
  },
  {
    name: "patties_lbs",
    left: 58.5,
    top: 81.25,
    width: 6.8,
    fontScale: 0.017,
  },
  {
    name: "jerky_lbs",
    left: 57.55,
    top: 84.25,
    width: 6.8,
    fontScale: 0.017,
  },
  {
    name: "cubed_steak_lbs",
    left: 65.6,
    top: 87.25,
    width: 6.8,
    fontScale: 0.017,
  },
  {
    name: "notes",
    left: 7,
    top: 90.65,
    width: 89,
    height: 5.7,
    multiline: true,
    fontScale: 0.016,
  },
];

function yesNoGroup(
  id: string,
  yesLeft: number,
  noLeft: number,
  top: number,
  markSize: MarkSize = "small",
): ChoiceGroup {
  return {
    id,
    choices: [
      {
        name: `${id}_yes`,
        markLeft: yesLeft,
        markTop: top,
        hitWidth: 8,
        hitHeight: 3.5,
        markSize,
      },
      {
        name: `${id}_no`,
        markLeft: noLeft,
        markTop: top,
        hitWidth: 8,
        hitHeight: 3.5,
        markSize,
      },
    ],
  };
}

const sheepChoiceGroups: ChoiceGroup[] = [
  yesNoGroup("sheep_shoulder_roast", 38.86, 44.98, 28.05),
  yesNoGroup("sheep_shoulder_steaks", 39.8, 45.9, 30.7),
  yesNoGroup("sheep_stew_meat", 34.06, 40.17, 33.37),
  yesNoGroup("sheep_neck_roast", 35.08, 41.15, 36.02),
  yesNoGroup("sheep_ham_roast", 34.72, 40.8, 42.69),
  yesNoGroup("sheep_ham_steaks", 35.66, 41.76, 45.34),
  yesNoGroup("sheep_inner_loin", 33.55, 39.64, 52.02),
  yesNoGroup("sheep_heart", 29.31, 35.41, 54.68),
  yesNoGroup("sheep_tongue", 30.8, 36.88, 57.33),
  yesNoGroup("sheep_liver", 28.44, 34.55, 59.98),
  yesNoGroup("sheep_kidney", 30.39, 36.49, 62.65),
  yesNoGroup("sheep_lamb_chops", 36.35, 42.45, 69.31),
  yesNoGroup("sheep_ribs", 28.09, 34.19, 71.96),
  yesNoGroup("sheep_leg_of_lamb", 35.04, 41.14, 74.61),
  yesNoGroup("sheep_crown_roast", 36.41, 42.51, 77.28),
  yesNoGroup("sheep_backstrap_whole", 30.13, 36.23, 83.95),
  yesNoGroup("sheep_backstrap_sliced", 29.9, 36, 86.6),
];

const sheepTextFields: TextField[] = [
  {
    name: "customer_name",
    left: 24.5,
    top: 16.2,
    width: 22.5,
    fontScale: 0.017,
  },
  {
    name: "phone_number",
    left: 27.1,
    top: 20.45,
    width: 22.5,
    fontScale: 0.017,
  },
  { name: "slaughter_date", left: 65, top: 16.2, width: 20, fontScale: 0.017 },
];

const goatChoiceGroups: ChoiceGroup[] = [
  yesNoGroup("goat_neck", 32.69, 41.73, 28.66),
  yesNoGroup("goat_shoulder_roast", 44.87, 53.32, 32.07),
  yesNoGroup("goat_loin", 30.9, 39.36, 35.48),
  yesNoGroup("goat_ribs", 31.02, 40.07, 38.9),
  yesNoGroup("goat_heart", 32.61, 41.07, 42.31),
  yesNoGroup("goat_tongue", 34.54, 42.97, 45.72),
  yesNoGroup("goat_liver", 31.49, 39.95, 49.14),
  yesNoGroup("goat_kidneys", 35.4, 43.85, 52.55),
  yesNoGroup("goat_chops", 33.83, 42.28, 55.97),
  {
    id: "goat_hams",
    choices: [
      {
        name: "goat_hams_steaks",
        markLeft: 16.18,
        markTop: 63.77,
        hitWidth: 12,
        hitHeight: 4,
      },
      {
        name: "goat_hams_roast",
        markLeft: 16.2,
        markTop: 68.19,
        hitWidth: 12,
        hitHeight: 4,
      },
    ],
  },
];

const goatTextFields: TextField[] = [
  { name: "customer_name", left: 26, top: 15.2, width: 20, fontScale: 0.017 },
  { name: "phone_number", left: 64, top: 15.2, width: 18, fontScale: 0.017 },
  {
    name: "slaughter_date",
    left: 17.5,
    top: 18.35,
    width: 19,
    fontScale: 0.017,
  },
  {
    name: "notes",
    left: 17.5,
    top: 73.7,
    width: 69,
    height: 11.5,
    multiline: true,
    fontScale: 0.016,
  },
];

const porkChoiceGroups: ChoiceGroup[] = [
  {
    id: "pork_hams_finish",
    choices: [
      { name: "pork_hams_cured", markLeft: 10.65, markTop: 30.1 },
      { name: "pork_hams_fresh", markLeft: 10.65, markTop: 33.5 },
    ],
  },
  {
    id: "pork_hams_cut",
    choices: [
      { name: "pork_hams_quarter", markLeft: 14.5, markTop: 35.4 },
      { name: "pork_hams_half", markLeft: 14.5, markTop: 38.1 },
      { name: "pork_hams_whole", markLeft: 14.5, markTop: 40.8 },
      { name: "pork_hams_steaks", markLeft: 14.5, markTop: 43.4 },
    ],
  },
  {
    id: "pork_bacon_finish",
    choices: [
      { name: "pork_bacon_cured", markLeft: 10.65, markTop: 52.7 },
      { name: "pork_bacon_fresh", markLeft: 10.65, markTop: 55.45 },
    ],
  },
  {
    id: "pork_bacon_package",
    choices: [
      { name: "pork_bacon_1lb", markLeft: 14.65, markTop: 58.05 },
      { name: "pork_bacon_2lb", markLeft: 14.65, markTop: 60.75 },
    ],
  },
  {
    id: "pork_shoulder",
    choices: [
      {
        name: "pork_shoulder_steak",
        markLeft: 3.5,
        markTop: 70.7,
        hitWidth: 10,
      },
      {
        name: "pork_shoulder_roast",
        markLeft: 3.5,
        markTop: 75.05,
        hitWidth: 10,
      },
      {
        name: "pork_shoulder_pulled",
        markLeft: 3.5,
        markTop: 79.05,
        hitWidth: 10,
      },
    ],
  },
  {
    id: "pork_hocks_finish",
    choices: [
      { name: "pork_hocks_cured", markLeft: 47.05, markTop: 29.35 },
      { name: "pork_hocks_fresh", markLeft: 47.05, markTop: 32.1 },
    ],
  },
  {
    id: "pork_jowls_finish",
    choices: [
      { name: "pork_jowls_cured", markLeft: 47.05, markTop: 39.3 },
      { name: "pork_jowls_fresh", markLeft: 47.05, markTop: 42.05 },
    ],
  },
  yesNoGroup("pork_ribs", 47.05, 47.05, 49.35),
  yesNoGroup("pork_heart", 47.05, 47.05, 59.95),
  yesNoGroup("pork_loin", 47.05, 47.05, 70.05),
  yesNoGroup("pork_tongue", 78.05, 78.05, 29.45),
  yesNoGroup("pork_liver", 78.05, 78.05, 39.35),
  yesNoGroup("pork_lard", 78.05, 78.05, 49.4),
  yesNoGroup("pork_chops", 78.05, 78.05, 59.45),
  yesNoGroup("pork_loin_roast", 78.05, 78.05, 70.05),
];

// The yes/no rows on the pork artwork are vertical. Move each "No" mark
// down to the second printed box while keeping both choices exclusive.
for (const group of porkChoiceGroups) {
  if (
    group.id.startsWith("pork_") &&
    group.choices.length === 2 &&
    group.choices[0].name.endsWith("_yes")
  ) {
    group.choices[1].markTop += 2.75;
  }
}

const porkTextFields: TextField[] = [
  { name: "customer_name", left: 48.8, top: 6.9, width: 46, fontScale: 0.017 },
  { name: "phone_number", left: 47, top: 11.05, width: 47.5, fontScale: 0.017 },
  {
    name: "slaughter_weight",
    left: 42.5,
    top: 15.95,
    width: 18,
    fontScale: 0.015,
  },
  {
    name: "slaughter_date",
    left: 78.5,
    top: 15.95,
    width: 16,
    fontScale: 0.015,
  },
  {
    name: "pork_sausage_links_lbs",
    left: 61.7,
    top: 76.15,
    width: 7,
    fontScale: 0.015,
  },
  {
    name: "pork_patties_lbs",
    left: 87.3,
    top: 76.15,
    width: 7,
    fontScale: 0.015,
  },
  {
    name: "pork_bulk_sausage_lbs",
    left: 61.7,
    top: 80,
    width: 7,
    fontScale: 0.015,
  },
  { name: "pork_brats_lbs", left: 87.3, top: 80, width: 7, fontScale: 0.015 },
  {
    name: "notes",
    left: 4,
    top: 84,
    width: 91,
    height: 11,
    multiline: true,
    fontScale: 0.015,
  },
];

function normalizeSpecies(value: string | null | undefined): LivestockSpecies {
  const animal = String(value || "").toLowerCase();
  if (
    animal.includes("pork") ||
    animal.includes("pig") ||
    animal.includes("hog")
  )
    return "pork";
  if (animal.includes("sheep") || animal.includes("lamb")) return "sheep";
  if (animal.includes("goat")) return "goat";
  return "beef";
}

function getSpeciesConfig(value: string | null | undefined): SpeciesConfig {
  const species = normalizeSpecies(value);
  if (species === "pork") {
    return {
      species,
      title: "Pork Cut Sheet",
      pdfPath: "/images/pork-cut-sheet.pdf",
      choiceGroups: porkChoiceGroups,
      textFields: porkTextFields,
    };
  }
  if (species === "sheep") {
    return {
      species,
      title: "Sheep Cut Sheet",
      pdfPath: "/images/sheep-cut-sheet.pdf",
      choiceGroups: sheepChoiceGroups,
      textFields: sheepTextFields,
    };
  }
  if (species === "goat") {
    return {
      species,
      title: "Goat Cut Sheet",
      pdfPath: "/images/goat-cut-sheet.pdf",
      choiceGroups: goatChoiceGroups,
      textFields: goatTextFields,
    };
  }
  return {
    species: "beef",
    title: "Beef Cut Sheet",
    pdfPath: "/images/beef-cut-sheet.pdf",
    choiceGroups,
    textFields,
  };
}

function createBlankForm(
  groups: ChoiceGroup[],
  fields: TextField[],
): FormValues {
  const values: FormValues = {};

  for (const group of groups) {
    for (const choice of group.choices) {
      values[choice.name] = false;
    }
  }

  for (const field of fields) {
    values[field.name] = "";
  }

  return values;
}

function getMarkFontSize(pageWidth: number, markSize: MarkSize | undefined) {
  if (markSize === "large") {
    return Math.max(28, pageWidth * 0.044);
  }

  if (markSize === "tiny") {
    return Math.max(18, pageWidth * 0.027);
  }

  return Math.max(23, pageWidth * 0.035);
}

export default function CutSheetClient() {
  const params = useParams();
  const token = String(params.token || "");
  const blankForm = useMemo(
    () => createBlankForm(choiceGroups, textFields),
    [],
  );

  const [cutSheet, setCutSheet] = useState<CutSheetRecord | null>(null);
  const [formData, setFormData] = useState<FormValues>(blankForm);
  const [pageWidth, setPageWidth] = useState(950);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [pdfError, setPdfError] = useState("");

  useEffect(() => {
    function updateWidth() {
      setPageWidth(Math.min(window.innerWidth - 32, 950));
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
        .select(
          `
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
        `,
        )
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

      const recordConfig = getSpeciesConfig(record.animal_type);
      const recordBlankForm = createBlankForm(
        recordConfig.choiceGroups,
        recordConfig.textFields,
      );

      setCutSheet(record);

      setFormData({
        ...recordBlankForm,
        ...(record.form_data || {}),
        customer_name: String(
          record.form_data?.customer_name || customer?.name || "",
        ),
        phone_number: String(
          record.form_data?.phone_number || customer?.phone || "",
        ),
        slaughter_weight: String(
          record.form_data?.slaughter_weight || animal?.hanging_weight || "",
        ),
        slaughter_date: String(
          record.form_data?.slaughter_date || animal?.kill_date || "",
        ),
      });

      setLoading(false);
    }

    if (token) {
      loadCutSheet();
    }
  }, [token, blankForm]);

  function updateText(name: string, value: string) {
    if (cutSheet?.submitted_at) {
      return;
    }

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function chooseOption(group: ChoiceGroup, selectedName: string) {
    if (cutSheet?.submitted_at) {
      return;
    }

    setFormData((current) => {
      const updated = { ...current };
      const wasSelected = Boolean(current[selectedName]);

      /*
       * ROUND behaves differently from the other cut groups:
       * Steak, Roast, and Cube can be selected together.
       * Grind is exclusive and clears every other Round choice.
       */
      if (group.id === "round") {
        if (selectedName === "round_grind") {
          for (const choice of group.choices) {
            updated[choice.name] = false;
          }

          if (!wasSelected) {
            updated.round_grind = true;
          }

          return updated;
        }

        updated.round_grind = false;
        updated[selectedName] = !wasSelected;

        return updated;
      }

      for (const choice of group.choices) {
        updated[choice.name] = false;
      }

      // Clicking the selected choice again clears that choice.
      if (!wasSelected) {
        updated[selectedName] = true;
      }

      return updated;
    });
  }

  async function saveDraft() {
    if (!cutSheet) {
      return;
    }

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
    if (!cutSheet) {
      return;
    }

    const confirmed = window.confirm(
      "Submit this cut sheet to APEX Custom Butchering? It cannot be changed after submission.",
    );

    if (!confirmed) {
      return;
    }

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
    setMessage("Cut sheet submitted successfully.");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-10 text-center text-2xl">
        Loading cut sheet...
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
          <h1 className="mb-4 text-4xl font-bold">Your Cut Sheet Is Locked</h1>
          <p className="text-lg text-gray-700">
            APEX Custom Butchering has not unlocked this cut sheet yet.
          </p>
        </div>
      </main>
    );
  }

  const submitted = Boolean(cutSheet.submitted_at);
  const config = getSpeciesConfig(cutSheet.animal_type);

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
          cursor: text;
          pointer-events: auto;
        }

        .sheet-input:hover,
        .sheet-textarea:hover {
          background: rgba(255, 255, 210, 0.22);
        }

        .sheet-input:focus,
        .sheet-textarea:focus {
          background: rgba(255, 255, 210, 0.55);
        }

        .sheet-input:disabled,
        .sheet-textarea:disabled {
          cursor: default;
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

        .choice-hit-area:focus,
        .choice-hit-area:focus-visible {
          outline: none;
          box-shadow: none;
        }

        .choice-mark {
          position: absolute;
          z-index: 80;
          pointer-events: none;
          display: block;
          color: #e00000 !important;
          opacity: 1 !important;
          font-family: Arial, Helvetica, sans-serif;
          font-weight: 900;
          line-height: 1;
          transform: translate(-50%, -54%);
          -webkit-text-stroke: 0.75px #e00000;
          text-shadow: 0 0 0 #e00000;
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

          .choice-mark {
            display: block !important;
            color: #e00000 !important;
            opacity: 1 !important;
            -webkit-text-stroke: 0.75px #e00000 !important;
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }
        }
      `}</style>

      <main className="page-background min-h-screen bg-gray-100 px-4 py-8">
        <section className="no-print mx-auto mb-6 max-w-5xl rounded-xl bg-white p-6 shadow">
          <h1 className="text-3xl font-bold">{config.title}</h1>

          <p className="mt-2 text-gray-600">
            Click the original printed box on the PDF to select an option.
            {config.species === "beef"
              ? " For Round, Steak, Roast, and Cube may be selected together. Grind clears the other Round choices."
              : " A red check means the option is selected."}
          </p>

          {submitted && (
            <div className="mt-4 rounded-lg bg-green-50 p-4 font-bold text-green-800">
              This cut sheet has been submitted and is now read-only.
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
                  Submit Cut Sheet
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

        <div
          className="sheet-shell relative mx-auto overflow-hidden bg-white shadow-2xl"
          style={{ width: `${pageWidth}px` }}
        >
          <Document
            file={config.pdfPath}
            loading={
              <div className="p-10 text-center text-xl">Loading PDF...</div>
            }
            error={
              <div className="p-10 text-center text-xl text-red-700">
                Failed to load PDF file.
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

          <div className="pointer-events-none absolute inset-0 z-30">
            {config.textFields.map((field) => {
              const fontSize = Math.max(
                9,
                pageWidth * (field.fontScale || 0.017),
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
                    value={String(formData[field.name] || "")}
                    disabled={submitted}
                    onChange={(event) =>
                      updateText(field.name, event.target.value)
                    }
                    style={style}
                    className="sheet-textarea absolute resize-none px-1 py-0.5"
                  />
                );
              }

              return (
                <input
                  key={field.name}
                  value={String(formData[field.name] || "")}
                  disabled={submitted}
                  onChange={(event) =>
                    updateText(field.name, event.target.value)
                  }
                  style={style}
                  className="sheet-input absolute px-1 py-0.5"
                />
              );
            })}

            {config.choiceGroups.flatMap((group) =>
              group.choices.flatMap((choice) => {
                const selected = Boolean(formData[choice.name]);
                const hitLeft = choice.hitLeft ?? choice.markLeft;
                const hitTop = choice.hitTop ?? choice.markTop;
                const hitWidth = choice.hitWidth ?? 5.2;
                const hitHeight = choice.hitHeight ?? 2.8;

                const elements = [
                  <button
                    key={`${choice.name}-hit`}
                    type="button"
                    disabled={submitted}
                    aria-pressed={selected}
                    aria-label={choice.name.replaceAll("_", " ")}
                    title={choice.name.replaceAll("_", " ")}
                    onClick={() => chooseOption(group, choice.name)}
                    style={{
                      left: `${hitLeft}%`,
                      top: `${hitTop}%`,
                      width: `${hitWidth}%`,
                      height: `${hitHeight}%`,
                      transform: "translate(-50%, -50%)",
                      pointerEvents: "auto",
                    }}
                    className="choice-hit-area absolute"
                  />,
                ];

                if (selected) {
                  elements.push(
                    <span
                      key={`${choice.name}-mark`}
                      aria-hidden="true"
                      style={{
                        left: `${choice.markLeft}%`,
                        top: `${choice.markTop}%`,
                        color: "#e00000",
                        opacity: 1,
                        zIndex: 80,
                        fontSize: `${getMarkFontSize(
                          pageWidth,
                          choice.markSize,
                        )}px`,
                      }}
                      className="choice-mark"
                    >
                      ✓
                    </span>,
                  );
                }

                return elements;
              }),
            )}
          </div>
        </div>
      </main>
    </>
  );
}
