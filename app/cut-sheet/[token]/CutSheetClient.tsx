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

  // Defaults to page 1. Pork sausage choices live on page 2.
  page?: number;

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
  maxSelections?: number;
};

type TextField = {
  name: string;
  // Defaults to page 1. Pork sausage fields live on page 2.
  page?: number;
  left: number;
  top: number;
  width: number;
  height?: number;
  multiline?: boolean;
  fontScale?: number;
};

/*
 * These positions were measured directly from page 1 of
 * public/images/beef-cut-sheet.pdf.
 *
 * The visible marks sit inside the PDF's original printed boxes.
 * The click targets are invisible and slightly larger, making the
 * original boxes easier to click without displaying extra boxes.
 */
const beefChoiceGroups: ChoiceGroup[] = [
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

const beefTextFields: TextField[] = [
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

const porkChoiceGroups: ChoiceGroup[] = [
  {
    id: "pork_ham_cure",
    choices: [
      {
        name: "pork_hams_cured",
        markLeft: 11.521,
        markTop: 30.723,
        markSize: "tiny",
      },
      {
        name: "pork_hams_fresh",
        markLeft: 11.521,
        markTop: 33.523,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "pork_ham_cut",
    choices: [
      {
        name: "pork_ham_quarter",
        markLeft: 15.377,
        markTop: 36.107,
        markSize: "tiny",
      },
      {
        name: "pork_ham_half",
        markLeft: 15.377,
        markTop: 38.766,
        markSize: "tiny",
      },
      {
        name: "pork_ham_whole",
        markLeft: 15.377,
        markTop: 41.425,
        markSize: "tiny",
      },
      {
        name: "pork_ham_steaks",
        markLeft: 15.377,
        markTop: 44.084,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "pork_hocks",
    choices: [
      {
        name: "pork_hocks_cured",
        markLeft: 47.938,
        markTop: 29.932,
        markSize: "tiny",
      },
      {
        name: "pork_hocks_fresh",
        markLeft: 47.938,
        markTop: 32.732,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "pork_jowls",
    choices: [
      {
        name: "pork_jowls_cured",
        markLeft: 47.938,
        markTop: 39.928,
        markSize: "tiny",
      },
      {
        name: "pork_jowls_fresh",
        markLeft: 47.938,
        markTop: 42.729,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "pork_tongue",
    choices: [
      {
        name: "pork_tongue_yes",
        markLeft: 78.887,
        markTop: 30.045,
        markSize: "tiny",
      },
      {
        name: "pork_tongue_no",
        markLeft: 78.887,
        markTop: 32.845,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "pork_liver",
    choices: [
      {
        name: "pork_liver_yes",
        markLeft: 78.887,
        markTop: 39.994,
        markSize: "tiny",
      },
      {
        name: "pork_liver_no",
        markLeft: 78.887,
        markTop: 42.79,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "pork_ribs",
    choices: [
      {
        name: "pork_ribs_yes",
        markLeft: 47.938,
        markTop: 49.972,
        markSize: "tiny",
      },
      {
        name: "pork_ribs_no",
        markLeft: 47.938,
        markTop: 52.767,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "pork_lard",
    choices: [
      {
        name: "pork_lard_yes",
        markLeft: 79.094,
        markTop: 50.028,
        markSize: "tiny",
      },
      {
        name: "pork_lard_no",
        markLeft: 79.094,
        markTop: 52.833,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "pork_bacon_cure",
    choices: [
      {
        name: "pork_bacon_cured",
        markLeft: 11.508,
        markTop: 53.323,
        markSize: "tiny",
      },
      {
        name: "pork_bacon_fresh",
        markLeft: 11.508,
        markTop: 56.123,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "pork_bacon_package",
    choices: [
      {
        name: "pork_bacon_1lb",
        markLeft: 15.517,
        markTop: 58.707,
        markSize: "tiny",
      },
      {
        name: "pork_bacon_2lb",
        markLeft: 15.517,
        markTop: 61.361,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "pork_heart",
    choices: [
      {
        name: "pork_heart_yes",
        markLeft: 47.681,
        markTop: 60.104,
        markSize: "tiny",
      },
      {
        name: "pork_heart_no",
        markLeft: 47.681,
        markTop: 62.905,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "pork_porkchops",
    choices: [
      {
        name: "pork_porkchops_yes",
        markLeft: 79.094,
        markTop: 60.104,
        markSize: "tiny",
      },
      {
        name: "pork_porkchops_no",
        markLeft: 79.094,
        markTop: 62.905,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "pork_loin",
    choices: [
      {
        name: "pork_loin_yes",
        markLeft: 47.681,
        markTop: 70.181,
        markSize: "tiny",
      },
      {
        name: "pork_loin_no",
        markLeft: 47.681,
        markTop: 72.986,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "pork_loin_roast",
    choices: [
      {
        name: "pork_loin_roast_yes",
        markLeft: 79.094,
        markTop: 70.181,
        markSize: "tiny",
      },
      {
        name: "pork_loin_roast_no",
        markLeft: 79.094,
        markTop: 72.986,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "pork_shoulder",
    choices: [
      {
        name: "pork_shoulder_steak",
        markLeft: 4.351,
        markTop: 71.263,
        markSize: "tiny",
      },
      {
        name: "pork_shoulder_roast",
        markLeft: 4.351,
        markTop: 75.428,
        markSize: "tiny",
      },
      {
        name: "pork_pulled_pork",
        markLeft: 4.351,
        markTop: 79.688,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "pork_sausage_links",
    choices: [
      {
        name: "pork_sausage_links",
        markLeft: 40.725,
        markTop: 77.024,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "pork_bulk_sausage",
    choices: [
      {
        name: "pork_bulk_sausage",
        markLeft: 40.725,
        markTop: 80.845,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "pork_patties",
    choices: [
      {
        name: "pork_patties",
        markLeft: 75.885,
        markTop: 77.099,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "pork_brats",
    choices: [
      {
        name: "pork_brats",
        markLeft: 75.885,
        markTop: 80.921,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "pork_sausage_flavors",
    maxSelections: 2,
    choices: [
      {
        name: "pork_sausage_farmstyle",
        page: 2,
        markLeft: 24.824,
        markTop: 27.015,
        hitWidth: 7,
        hitHeight: 4,
        markSize: "tiny",
      },
      {
        name: "pork_sausage_sweet_italian",
        page: 2,
        markLeft: 27.859,
        markTop: 36.746,
        hitWidth: 7,
        hitHeight: 4,
        markSize: "tiny",
      },
      {
        name: "pork_sausage_italian",
        page: 2,
        markLeft: 19.877,
        markTop: 46.127,
        hitWidth: 7,
        hitHeight: 4,
        markSize: "tiny",
      },
      {
        name: "pork_sausage_regular",
        page: 2,
        markLeft: 21.654,
        markTop: 55.727,
        hitWidth: 7,
        hitHeight: 4,
        markSize: "tiny",
      },
      {
        name: "pork_sausage_hot",
        page: 2,
        markLeft: 15.441,
        markTop: 65.458,
        hitWidth: 7,
        hitHeight: 4,
        markSize: "tiny",
      },
      {
        name: "pork_sausage_maple",
        page: 2,
        markLeft: 18.762,
        markTop: 75.136,
        hitWidth: 7,
        hitHeight: 4,
        markSize: "tiny",
      },
    ],
  },
];

const porkTextFields: TextField[] = [
  {
    name: "customer_name",
    left: 49.2,
    top: 7.1,
    width: 46.5,
    fontScale: 0.019,
  },
  {
    name: "phone_number",
    left: 47.4,
    top: 11.25,
    width: 48.3,
    fontScale: 0.019,
  },
  {
    name: "slaughter_weight",
    left: 42.25,
    top: 15.65,
    width: 21.6,
    fontScale: 0.016,
  },
  {
    name: "slaughter_date",
    left: 78.3,
    top: 15.65,
    width: 17.4,
    fontScale: 0.016,
  },
  {
    name: "pork_sausage_links_lbs",
    left: 61.8,
    top: 76.35,
    width: 5.0,
    fontScale: 0.016,
  },
  {
    name: "pork_patties_lbs",
    left: 87.45,
    top: 76.35,
    width: 5.0,
    fontScale: 0.016,
  },
  {
    name: "pork_bulk_sausage_lbs",
    left: 61.3,
    top: 80.15,
    width: 5.0,
    fontScale: 0.016,
  },
  {
    name: "pork_brats_lbs",
    left: 85.9,
    top: 80.15,
    width: 5.0,
    fontScale: 0.016,
  },
  {
    name: "notes",
    left: 3.3,
    top: 84.0,
    width: 93.0,
    height: 13.2,
    multiline: true,
    fontScale: 0.050,
  },
  {
    name: "pork_sausage_brats_batches",
    page: 2,
    left: 64.08,
    top: 26.1,
    width: 4.2,
    fontScale: 0.017,
  },
  {
    name: "pork_sausage_brats_cheese_batches",
    page: 2,
    left: 64.7,
    top: 30.93,
    width: 4.2,
    fontScale: 0.017,
  },
  {
    name: "pork_sausage_patties_batches",
    page: 2,
    left: 65.48,
    top: 35.75,
    width: 4.2,
    fontScale: 0.017,
  },
  {
    name: "pork_sausage_patties_cheese_batches",
    page: 2,
    left: 64.37,
    top: 40.59,
    width: 4.2,
    fontScale: 0.017,
  },
  {
    name: "pork_sausage_links_batches",
    page: 2,
    left: 64.07,
    top: 45.41,
    width: 4.2,
    fontScale: 0.017,
  },
  {
    name: "pork_sausage_links_cheese_batches",
    page: 2,
    left: 64.42,
    top: 50.24,
    width: 4.2,
    fontScale: 0.017,
  },
  {
    name: "pork_sausage_ground_pork_lbs",
    page: 2,
    left: 75.21,
    top: 55.08,
    width: 4.2,
    fontScale: 0.017,
  },
];

const sheepChoiceGroups: ChoiceGroup[] = [
  {
    id: "sheep_shoulder_roast",
    choices: [
      {
        name: "sheep_shoulder_roast_yes",
        markLeft: 38.861,
        markTop: 28.048,
        markSize: "tiny",
      },
      {
        name: "sheep_shoulder_roast_no",
        markLeft: 44.979,
        markTop: 28.048,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "sheep_shoulder_steaks",
    choices: [
      {
        name: "sheep_shoulder_steaks_yes",
        markLeft: 39.802,
        markTop: 30.699,
        markSize: "tiny",
      },
      {
        name: "sheep_shoulder_steaks_no",
        markLeft: 45.9,
        markTop: 30.699,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "sheep_stew_meat",
    choices: [
      {
        name: "sheep_stew_meat_yes",
        markLeft: 34.057,
        markTop: 33.37,
        markSize: "tiny",
      },
      {
        name: "sheep_stew_meat_no",
        markLeft: 40.175,
        markTop: 33.37,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "sheep_neck_roast",
    choices: [
      {
        name: "sheep_neck_roast_yes",
        markLeft: 35.077,
        markTop: 36.021,
        markSize: "tiny",
      },
      {
        name: "sheep_neck_roast_no",
        markLeft: 41.155,
        markTop: 36.021,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "sheep_ham_roast",
    choices: [
      {
        name: "sheep_ham_roast_yes",
        markLeft: 34.724,
        markTop: 42.688,
        markSize: "tiny",
      },
      {
        name: "sheep_ham_roast_no",
        markLeft: 40.802,
        markTop: 42.688,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "sheep_ham_steaks",
    choices: [
      {
        name: "sheep_ham_steaks_yes",
        markLeft: 35.665,
        markTop: 45.34,
        markSize: "tiny",
      },
      {
        name: "sheep_ham_steaks_no",
        markLeft: 41.763,
        markTop: 45.34,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "sheep_inner_loin",
    choices: [
      {
        name: "sheep_inner_loin_yes",
        markLeft: 33.547,
        markTop: 52.021,
        markSize: "tiny",
      },
      {
        name: "sheep_inner_loin_no",
        markLeft: 39.645,
        markTop: 52.021,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "sheep_heart",
    choices: [
      {
        name: "sheep_heart_yes",
        markLeft: 29.307,
        markTop: 54.675,
        markSize: "tiny",
      },
      {
        name: "sheep_heart_no",
        markLeft: 35.41,
        markTop: 54.675,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "sheep_tongue",
    choices: [
      {
        name: "sheep_tongue_yes",
        markLeft: 30.797,
        markTop: 57.327,
        markSize: "tiny",
      },
      {
        name: "sheep_tongue_no",
        markLeft: 36.881,
        markTop: 57.327,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "sheep_liver",
    choices: [
      {
        name: "sheep_liver_yes",
        markLeft: 28.444,
        markTop: 59.978,
        markSize: "tiny",
      },
      {
        name: "sheep_liver_no",
        markLeft: 34.547,
        markTop: 59.978,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "sheep_kidney",
    choices: [
      {
        name: "sheep_kidney_yes",
        markLeft: 30.386,
        markTop: 62.645,
        markSize: "tiny",
      },
      {
        name: "sheep_kidney_no",
        markLeft: 36.489,
        markTop: 62.645,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "sheep_lamb_chops",
    choices: [
      {
        name: "sheep_lamb_chops_yes",
        markLeft: 36.351,
        markTop: 69.312,
        markSize: "tiny",
      },
      {
        name: "sheep_lamb_chops_no",
        markLeft: 42.449,
        markTop: 69.312,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "sheep_ribs",
    choices: [
      {
        name: "sheep_ribs_yes",
        markLeft: 28.092,
        markTop: 71.963,
        markSize: "tiny",
      },
      {
        name: "sheep_ribs_no",
        markLeft: 34.194,
        markTop: 71.963,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "sheep_leg_of_lamb",
    choices: [
      {
        name: "sheep_leg_of_lamb_yes",
        markLeft: 35.038,
        markTop: 74.615,
        markSize: "tiny",
      },
      {
        name: "sheep_leg_of_lamb_no",
        markLeft: 41.136,
        markTop: 74.615,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "sheep_crown_roast",
    choices: [
      {
        name: "sheep_crown_roast_yes",
        markLeft: 36.41,
        markTop: 77.285,
        markSize: "tiny",
      },
      {
        name: "sheep_crown_roast_no",
        markLeft: 42.508,
        markTop: 77.285,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "sheep_backstrap_whole",
    choices: [
      {
        name: "sheep_backstrap_whole_yes",
        markLeft: 30.131,
        markTop: 83.952,
        markSize: "tiny",
      },
      {
        name: "sheep_backstrap_whole_no",
        markLeft: 36.234,
        markTop: 83.952,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "sheep_backstrap_sliced",
    choices: [
      {
        name: "sheep_backstrap_sliced_yes",
        markLeft: 29.895,
        markTop: 86.603,
        markSize: "tiny",
      },
      {
        name: "sheep_backstrap_sliced_no",
        markLeft: 35.998,
        markTop: 86.603,
        markSize: "tiny",
      },
    ],
  },
];

const sheepTextFields: TextField[] = [
  {
    name: "customer_name",
    left: 24.6,
    top: 16.45,
    width: 22.3,
    fontScale: 0.016,
  },
  {
    name: "slaughter_date",
    left: 65.04,
    top: 16.45,
    width: 19.85,
    fontScale: 0.016,
  },
  {
    name: "phone_number",
    left: 27.13,
    top: 20.68,
    width: 22.3,
    fontScale: 0.016,
  },
];

const goatChoiceGroups: ChoiceGroup[] = [
  {
    id: "goat_neck",
    choices: [
      {
        name: "goat_neck_yes",
        markLeft: 32.647,
        markTop: 28.614,
        markSize: "tiny",
      },
      {
        name: "goat_neck_no",
        markLeft: 41.706,
        markTop: 28.614,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "goat_shoulder_roast",
    choices: [
      {
        name: "goat_shoulder_roast_yes",
        markLeft: 44.824,
        markTop: 32.023,
        markSize: "tiny",
      },
      {
        name: "goat_shoulder_roast_no",
        markLeft: 53.294,
        markTop: 32.023,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "goat_loin",
    choices: [
      {
        name: "goat_loin_yes",
        markLeft: 30.882,
        markTop: 35.432,
        markSize: "tiny",
      },
      {
        name: "goat_loin_no",
        markLeft: 39.353,
        markTop: 35.432,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "goat_ribs",
    choices: [
      {
        name: "goat_ribs_yes",
        markLeft: 31.0,
        markTop: 38.841,
        markSize: "tiny",
      },
      {
        name: "goat_ribs_no",
        markLeft: 40.059,
        markTop: 38.841,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "goat_heart",
    choices: [
      {
        name: "goat_heart_yes",
        markLeft: 32.588,
        markTop: 42.25,
        markSize: "tiny",
      },
      {
        name: "goat_heart_no",
        markLeft: 41.059,
        markTop: 42.25,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "goat_tongue",
    choices: [
      {
        name: "goat_tongue_yes",
        markLeft: 34.529,
        markTop: 45.659,
        markSize: "tiny",
      },
      {
        name: "goat_tongue_no",
        markLeft: 42.941,
        markTop: 45.659,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "goat_liver",
    choices: [
      {
        name: "goat_liver_yes",
        markLeft: 31.471,
        markTop: 49.114,
        markSize: "tiny",
      },
      {
        name: "goat_liver_no",
        markLeft: 39.941,
        markTop: 49.114,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "goat_kidneys",
    choices: [
      {
        name: "goat_kidneys_yes",
        markLeft: 35.353,
        markTop: 52.523,
        markSize: "tiny",
      },
      {
        name: "goat_kidneys_no",
        markLeft: 43.824,
        markTop: 52.523,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "goat_chops",
    choices: [
      {
        name: "goat_chops_yes",
        markLeft: 33.824,
        markTop: 55.932,
        markSize: "tiny",
      },
      {
        name: "goat_chops_no",
        markLeft: 42.235,
        markTop: 55.932,
        markSize: "tiny",
      },
    ],
  },

  // The goat form does not say "choose only one" for the ham options,
  // so Steaks and Roast are independent and may both be checked.
  {
    id: "goat_ham_steaks",
    choices: [
      {
        name: "goat_ham_steaks",
        markLeft: 16.176,
        markTop: 63.705,
        markSize: "tiny",
      },
    ],
  },
  {
    id: "goat_ham_roast",
    choices: [
      {
        name: "goat_ham_roast",
        markLeft: 16.176,
        markTop: 68.159,
        markSize: "tiny",
      },
    ],
  },
];

const goatTextFields: TextField[] = [
  {
    name: "customer_name",
    left: 26.35,
    top: 15.65,
    width: 19.65,
    fontScale: 0.016,
  },
  {
    name: "phone_number",
    left: 63.82,
    top: 15.65,
    width: 18.0,
    fontScale: 0.016,
  },
  {
    name: "slaughter_date",
    left: 16.4,
    top: 18.75,
    width: 19.7,
    fontScale: 0.016,
  },
  {
    name: "notes",
    left: 17.65,
    top: 75.35,
    width: 69.1,
    height: 9.45,
    multiline: true,
    fontScale: 0.016,
  },
];

const allChoiceGroups = [
  ...beefChoiceGroups,
  ...porkChoiceGroups,
  ...sheepChoiceGroups,
  ...goatChoiceGroups,
];
const allTextFields = [
  ...beefTextFields,
  ...porkTextFields,
  ...sheepTextFields,
  ...goatTextFields,
];

function createBlankForm(): FormValues {
  const values: FormValues = {};

  for (const group of allChoiceGroups) {
    for (const choice of group.choices) {
      values[choice.name] = false;
    }
  }

  for (const field of allTextFields) {
    values[field.name] = "";
  }

  return values;
}

function getMarkFontSize(pageWidth: number, markSize: MarkSize | undefined) {
  if (markSize === "large") {
    return Math.max(12, pageWidth * 0.022);
  }

  if (markSize === "tiny") {
    return Math.max(8, pageWidth * 0.0145);
  }

  return Math.max(9, pageWidth * 0.0175);
}

export default function CutSheetClient() {
  const params = useParams();
  const token = String(params.token || "");
  const blankForm = useMemo(() => createBlankForm(), []);

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

      setCutSheet(record);

      setFormData({
        ...blankForm,
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

      if (group.maxSelections) {
        if (wasSelected) {
          updated[selectedName] = false;
          return updated;
        }

        const selectedCount = group.choices.filter((choice) =>
          Boolean(current[choice.name]),
        ).length;

        if (selectedCount >= group.maxSelections) {
          setMessage(
            `You can choose up to ${group.maxSelections} sausage flavors.`,
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
  const animalType = cutSheet.animal_type.toLowerCase();
  const isPork = animalType === "pork";
  const isSheep = animalType === "sheep";
  const isGoat = animalType === "goat";

  const activeChoiceGroups = isGoat
    ? goatChoiceGroups
    : isSheep
      ? sheepChoiceGroups
      : isPork
        ? porkChoiceGroups
        : beefChoiceGroups;

  const activeTextFields = isGoat
    ? goatTextFields
    : isSheep
      ? sheepTextFields
      : isPork
        ? porkTextFields
        : beefTextFields;

  const activePdfFile = isGoat
    ? "/images/goat-cut-sheet.pdf"
    : isSheep
      ? "/images/sheep-cut-sheet.pdf"
      : isPork
        ? "/images/pork-cut-sheet.pdf"
        : "/images/beef-cut-sheet.pdf";

  const activePageCount = isPork ? 2 : 1;

  const activeTitle = isGoat
    ? "Goat Cut Order Sheet"
    : isSheep
      ? "Sheep Cut Sheet"
      : isPork
        ? "Pork Cut Sheet"
        : "Beef Cut Sheet";

  const activeInstructions = isGoat
    ? "Click the original Yes or No boxes on the goat form. Ham Steaks and Ham Roast may both be selected."
    : isSheep
      ? "Click the original Yes or No boxes on the sheep form. Each item allows one selection."
      : isPork
        ? "Complete both pages. On the sausage page, choose up to two flavors and enter the number of batches or pounds on the printed blanks."
        : "Click the original printed box on the PDF. For Round, Steak, Roast, and Cube may be selected together. Grind clears the other Round choices.";

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

        .sheet-page + .sheet-page {
          margin-top: 24px;
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

        .choice-stamp {
          position: absolute;
          z-index: 45;
          pointer-events: none;
          transform: translate(-50%, -50%);
          user-select: none;
        }

        .choice-stamp-line {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 112%;
          height: 18%;
          min-height: 5px;
          border-radius: 999px;
          background: rgba(220, 0, 0, 0.82);
          box-shadow: 0 0 0 1px rgba(150, 0, 0, 0.18);
          transform-origin: center;
        }

        .choice-stamp-line-a {
          transform: translate(-50%, -50%) rotate(34deg);
        }

        .choice-stamp-line-b {
          transform: translate(-50%, -50%) rotate(-34deg);
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

          .sheet-page {
            break-after: page;
            page-break-after: always;
          }

          .sheet-page:last-child {
            break-after: auto;
            page-break-after: auto;
          }

          .sheet-page + .sheet-page {
            margin-top: 0 !important;
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

          .choice-stamp-line {
            background: rgba(220, 0, 0, 0.9) !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <main className="page-background min-h-screen bg-gray-100 px-4 py-8">
        <section className="no-print mx-auto mb-6 max-w-5xl rounded-xl bg-white p-6 shadow">
          <h1 className="text-3xl font-bold">{activeTitle}</h1>

          <p className="mt-2 text-gray-600">{activeInstructions}</p>

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
            file={activePdfFile}
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
            {Array.from({ length: activePageCount }, (_, index) => {
              const pageNumber = index + 1;
              const pageTextFields = activeTextFields.filter(
                (field) => (field.page ?? 1) === pageNumber,
              );
              const pageChoiceGroups = activeChoiceGroups
                .map((group) => ({
                  ...group,
                  choices: group.choices.filter(
                    (choice) => (choice.page ?? 1) === pageNumber,
                  ),
                }))
                .filter((group) => group.choices.length > 0);

              return (
                <div
                  key={`page-${pageNumber}`}
                  className="sheet-page relative overflow-hidden bg-white"
                >
                  <Page
                    pageNumber={pageNumber}
                    width={pageWidth}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />

                  <div className="pointer-events-none absolute inset-0 z-30">
                    {pageTextFields.map((field) => {
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
                          inputMode={
                            field.name.includes("batches") ||
                            field.name.endsWith("_lbs")
                              ? "decimal"
                              : "text"
                          }
                          onChange={(event) =>
                            updateText(field.name, event.target.value)
                          }
                          style={style}
                          className="sheet-input absolute px-1 py-0.5"
                        />
                      );
                    })}

                    {pageChoiceGroups.flatMap((group) =>
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
                          const stampWidth = Math.max(hitWidth * 1.35, 5.8);
                          const stampHeight = Math.max(hitHeight * 1.55, 4.4);

                          elements.push(
                            <span
                              key={`${choice.name}-mark`}
                              aria-hidden="true"
                              style={{
                                left: `${hitLeft}%`,
                                top: `${hitTop}%`,
                                width: `${stampWidth}%`,
                                height: `${stampHeight}%`,
                              }}
                              className="choice-stamp"
                            >
                              <span className="choice-stamp-line choice-stamp-line-a" />
                              <span className="choice-stamp-line choice-stamp-line-b" />
                            </span>,
                          );
                        }

                        return elements;
                      }),
                    )}
                  </div>
                </div>
              );
            })}
          </Document>
        </div>
      </main>
    </>
  );
}