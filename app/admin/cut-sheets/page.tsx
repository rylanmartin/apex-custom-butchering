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

type DeerCutSheet = {
  id: string;
  secure_token: string;
  customer_name: string;
  phone: string;
  submitted_at: string | null;
  printed_at: string | null;
  created_at: string;
  form_data: FormData | null;
};

type LivestockSpecies = "beef" | "pork" | "sheep" | "goat";

type QueueItem =
  | { kind: "livestock"; species: LivestockSpecies; sheet: CutSheet }
  | { kind: "deer"; sheet: DeerCutSheet };

type Tab = "waiting" | "submitted" | "printed";
type MarkSize = "normal" | "large" | "tiny";
type ChoiceMark = { name: string; left: number; top: number; size?: MarkSize };
type TextField = {
  name: string;
  left: number;
  top: number;
  width: number;
  fontScale: number;
  multiline?: boolean;
};

type DeerChoiceMark = ChoiceMark & {
  value: string | boolean;
};

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
  {
    name: "phone_number",
    left: 47.3,
    top: 8.55,
    width: 48.5,
    fontScale: 0.019,
  },
  { name: "farmer_name", left: 47, top: 11.45, width: 48.8, fontScale: 0.019 },
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
  { name: "stew_meat_lbs", left: 18, top: 87.25, width: 6.8, fontScale: 0.017 },
  { name: "patties_lbs", left: 58.5, top: 81.25, width: 6.8, fontScale: 0.017 },
  { name: "jerky_lbs", left: 57.55, top: 84.25, width: 6.8, fontScale: 0.017 },
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
    fontScale: 0.016,
    multiline: true,
  },
];

const deerChoiceMarks: DeerChoiceMark[] = [
  { name: "deer_type", value: "doe", left: 12.35, top: 20.2 },
  { name: "deer_type", value: "button_buck", left: 23.55, top: 20.2 },
  { name: "deer_type", value: "buck", left: 40.65, top: 20.2 },
  { name: "save_antlers", value: true, left: 40.7, top: 22.05 },
  { name: "save_head", value: true, left: 56.95, top: 22.05 },
  { name: "cape_out", value: "yes", left: 58.75, top: 23.85 },
  { name: "cape_out", value: "no", left: 65.25, top: 23.85 },
  { name: "rump_roast", value: "yes", left: 12.35, top: 31.75 },
  { name: "rump_roast", value: "no", left: 18.15, top: 31.75 },
  { name: "shoulder_roast", value: "yes", left: 30.65, top: 31.75 },
  { name: "shoulder_roast", value: "no", left: 36.6, top: 31.75 },
  { name: "neck_roast", value: "yes", left: 51.15, top: 31.75 },
  { name: "neck_roast", value: "no", left: 57.5, top: 31.75 },
  { name: "ham_steaks", value: "yes", left: 67, top: 31.75 },
  { name: "ham_steaks", value: "no", left: 73.3, top: 31.75 },
  { name: "ribs", value: "yes", left: 12.35, top: 37.8 },
  { name: "ribs", value: "no", left: 18.15, top: 37.8 },
  { name: "whole_ham", value: "yes", left: 30.25, top: 37.8 },
  { name: "whole_ham", value: "no", left: 36.6, top: 37.8 },
  { name: "whole_ham_smoked", value: true, left: 41.65, top: 37.8 },
  { name: "stew_meat", value: "yes", left: 53.1, top: 37.8 },
  { name: "stew_meat", value: "no", left: 59.2, top: 37.8 },
  { name: "inner_loin", value: "yes", left: 12.35, top: 43.85 },
  { name: "inner_loin", value: "no", left: 18.6, top: 43.85 },
  { name: "back_straps", value: "whole", left: 28.85, top: 43.85 },
  { name: "back_straps", value: "steaks", left: 35.8, top: 43.85 },
  { name: "back_straps", value: "butterfly_steaks", left: 44.05, top: 43.85 },
  { name: "add_suet", value: "yes", left: 60.95, top: 43.85 },
  { name: "add_suet", value: "no", left: 67.3, top: 43.85 },
];

const deerTextFields: TextField[] = [
  {
    name: "customer_name",
    left: 17.1,
    top: 10.15,
    width: 31,
    fontScale: 0.017,
  },
  {
    name: "license_number",
    left: 56.5,
    top: 10.15,
    width: 30.5,
    fontScale: 0.017,
  },
  { name: "phone", left: 24.2, top: 13.9, width: 24, fontScale: 0.017 },
  { name: "dropoff_date", left: 53.2, top: 13.9, width: 34, fontScale: 0.017 },
  {
    name: "number_of_points",
    left: 59.6,
    top: 19.45,
    width: 12,
    fontScale: 0.017,
  },
  { name: "stew_meat_lbs", left: 70.5, top: 36.9, width: 8, fontScale: 0.016 },
  {
    name: "old_fashion_summer_sausage",
    left: 51.4,
    top: 49.15,
    width: 10.7,
    fontScale: 0.017,
  },
  {
    name: "summer_sausage",
    left: 51.4,
    top: 52.18,
    width: 10.7,
    fontScale: 0.017,
  },
  {
    name: "cheesy_summer_sausage",
    left: 51.4,
    top: 55.21,
    width: 10.7,
    fontScale: 0.017,
  },
  {
    name: "cheesy_jalapeno_summer_sausage",
    left: 51.4,
    top: 58.24,
    width: 10.7,
    fontScale: 0.017,
  },
  {
    name: "hickory_stick",
    left: 51.4,
    top: 61.27,
    width: 10.7,
    fontScale: 0.017,
  },
  {
    name: "pepper_stick",
    left: 51.4,
    top: 64.3,
    width: 10.7,
    fontScale: 0.017,
  },
  {
    name: "pepper_stick_cheese",
    left: 51.4,
    top: 67.33,
    width: 10.7,
    fontScale: 0.017,
  },
  {
    name: "honey_bbq_snack_stick",
    left: 51.4,
    top: 70.36,
    width: 10.7,
    fontScale: 0.017,
  },
  {
    name: "cheesy_jalapeno_pepper_stick",
    left: 51.4,
    top: 73.39,
    width: 10.7,
    fontScale: 0.017,
  },
  {
    name: "hunter_twiggs",
    left: 51.4,
    top: 76.42,
    width: 10.7,
    fontScale: 0.017,
  },
  {
    name: "regular_jerky",
    left: 51.4,
    top: 79.45,
    width: 10.7,
    fontScale: 0.017,
  },
  {
    name: "sweet_spicy_jerky",
    left: 51.4,
    top: 82.48,
    width: 10.7,
    fontScale: 0.017,
  },
  {
    name: "smoked_brats",
    left: 51.4,
    top: 85.51,
    width: 10.7,
    fontScale: 0.017,
  },
  {
    name: "cheesy_jalapeno_smoked_brats",
    left: 51.4,
    top: 88.54,
    width: 10.7,
    fontScale: 0.017,
  },
  {
    name: "total_lbs_meat_needed",
    left: 31.8,
    top: 94.05,
    width: 8,
    fontScale: 0.017,
  },
];

function yesNoMarks(
  id: string,
  yesLeft: number,
  noLeft: number,
  top: number,
  noTop = top,
): ChoiceMark[] {
  return [
    { name: `${id}_yes`, left: yesLeft, top },
    { name: `${id}_no`, left: noLeft, top: noTop },
  ];
}

const sheepChoiceMarks: ChoiceMark[] = [
  ...yesNoMarks("sheep_shoulder_roast", 38.86, 44.98, 28.05),
  ...yesNoMarks("sheep_shoulder_steaks", 39.8, 45.9, 30.7),
  ...yesNoMarks("sheep_stew_meat", 34.06, 40.17, 33.37),
  ...yesNoMarks("sheep_neck_roast", 35.08, 41.15, 36.02),
  ...yesNoMarks("sheep_ham_roast", 34.72, 40.8, 42.69),
  ...yesNoMarks("sheep_ham_steaks", 35.66, 41.76, 45.34),
  ...yesNoMarks("sheep_inner_loin", 33.55, 39.64, 52.02),
  ...yesNoMarks("sheep_heart", 29.31, 35.41, 54.68),
  ...yesNoMarks("sheep_tongue", 30.8, 36.88, 57.33),
  ...yesNoMarks("sheep_liver", 28.44, 34.55, 59.98),
  ...yesNoMarks("sheep_kidney", 30.39, 36.49, 62.65),
  ...yesNoMarks("sheep_lamb_chops", 36.35, 42.45, 69.31),
  ...yesNoMarks("sheep_ribs", 28.09, 34.19, 71.96),
  ...yesNoMarks("sheep_leg_of_lamb", 35.04, 41.14, 74.61),
  ...yesNoMarks("sheep_crown_roast", 36.41, 42.51, 77.28),
  ...yesNoMarks("sheep_backstrap_whole", 30.13, 36.23, 83.95),
  ...yesNoMarks("sheep_backstrap_sliced", 29.9, 36, 86.6),
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

const goatChoiceMarks: ChoiceMark[] = [
  ...yesNoMarks("goat_neck", 32.69, 41.73, 28.66),
  ...yesNoMarks("goat_shoulder_roast", 44.87, 53.32, 32.07),
  ...yesNoMarks("goat_loin", 30.9, 39.36, 35.48),
  ...yesNoMarks("goat_ribs", 31.02, 40.07, 38.9),
  ...yesNoMarks("goat_heart", 32.61, 41.07, 42.31),
  ...yesNoMarks("goat_tongue", 34.54, 42.97, 45.72),
  ...yesNoMarks("goat_liver", 31.49, 39.95, 49.14),
  ...yesNoMarks("goat_kidneys", 35.4, 43.85, 52.55),
  ...yesNoMarks("goat_chops", 33.83, 42.28, 55.97),
  { name: "goat_hams_steaks", left: 16.18, top: 63.77 },
  { name: "goat_hams_roast", left: 16.2, top: 68.19 },
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
    multiline: true,
    fontScale: 0.016,
  },
];

const porkChoiceMarks: ChoiceMark[] = [
  { name: "pork_hams_cured", left: 10.65, top: 30.1 },
  { name: "pork_hams_fresh", left: 10.65, top: 33.5 },
  { name: "pork_hams_quarter", left: 14.5, top: 35.4 },
  { name: "pork_hams_half", left: 14.5, top: 38.1 },
  { name: "pork_hams_whole", left: 14.5, top: 40.8 },
  { name: "pork_hams_steaks", left: 14.5, top: 43.4 },
  { name: "pork_bacon_cured", left: 10.65, top: 52.7 },
  { name: "pork_bacon_fresh", left: 10.65, top: 55.45 },
  { name: "pork_bacon_1lb", left: 14.65, top: 58.05 },
  { name: "pork_bacon_2lb", left: 14.65, top: 60.75 },
  { name: "pork_shoulder_steak", left: 3.5, top: 70.7 },
  { name: "pork_shoulder_roast", left: 3.5, top: 75.05 },
  { name: "pork_shoulder_pulled", left: 3.5, top: 79.05 },
  { name: "pork_hocks_cured", left: 47.05, top: 29.35 },
  { name: "pork_hocks_fresh", left: 47.05, top: 32.1 },
  { name: "pork_jowls_cured", left: 47.05, top: 39.3 },
  { name: "pork_jowls_fresh", left: 47.05, top: 42.05 },
  ...yesNoMarks("pork_ribs", 47.05, 47.05, 49.35, 52.1),
  ...yesNoMarks("pork_heart", 47.05, 47.05, 59.95, 62.7),
  ...yesNoMarks("pork_loin", 47.05, 47.05, 70.05, 72.8),
  ...yesNoMarks("pork_tongue", 78.05, 78.05, 29.45, 32.2),
  ...yesNoMarks("pork_liver", 78.05, 78.05, 39.35, 42.1),
  ...yesNoMarks("pork_lard", 78.05, 78.05, 49.4, 52.15),
  ...yesNoMarks("pork_chops", 78.05, 78.05, 59.45, 62.2),
  ...yesNoMarks("pork_loin_roast", 78.05, 78.05, 70.05, 72.8),
];

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
    multiline: true,
    fontScale: 0.015,
  },
];

function firstRelation<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
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

function getDeerFormData(sheet: DeerCutSheet): FormData {
  const saved = sheet.form_data ?? {};
  return {
    ...saved,
    customer_name: sheet.customer_name,
    phone: sheet.phone,
  };
}

function normalizeSpecies(
  value: string | null | undefined,
): LivestockSpecies | null {
  const animal = String(value || "").toLowerCase();
  if (
    animal.includes("beef") ||
    animal.includes("cow") ||
    animal.includes("cattle")
  )
    return "beef";
  if (
    animal.includes("pork") ||
    animal.includes("pig") ||
    animal.includes("hog")
  )
    return "pork";
  if (animal.includes("sheep") || animal.includes("lamb")) return "sheep";
  if (animal.includes("goat")) return "goat";
  return null;
}

function speciesLabel(species: LivestockSpecies) {
  return species.charAt(0).toUpperCase() + species.slice(1);
}

function queueCustomerName(item: QueueItem) {
  return item.kind === "deer"
    ? item.sheet.customer_name
    : customerName(item.sheet);
}

function queuePhone(item: QueueItem) {
  if (item.kind === "deer") return item.sheet.phone;
  return getCustomer(item.sheet)?.phone || "";
}

function queueSubmittedAt(item: QueueItem) {
  return item.sheet.submitted_at;
}

function queuePrintedAt(item: QueueItem) {
  return item.sheet.printed_at;
}

function queueCustomerLink(item: QueueItem) {
  return item.kind === "deer"
    ? `/deer-cut-sheet/${item.sheet.secure_token}`
    : `/cut-sheet/${item.sheet.secure_token}`;
}

function speciesTemplatePath(species: LivestockSpecies) {
  return `/images/${species}-cut-sheet.pdf`;
}

function speciesChoiceMarks(species: LivestockSpecies) {
  if (species === "pork") return porkChoiceMarks;
  if (species === "sheep") return sheepChoiceMarks;
  if (species === "goat") return goatChoiceMarks;
  return choiceMarks;
}

// Customers still see every answer while filling out the form. During
// printing, however, Grind and No are intentionally left unmarked so the
// printed PDF highlights only the cuts the customer wants kept.
function shouldPrintLivestockMark(name: string) {
  return !name.endsWith("_grind") && !name.endsWith("_no");
}

function shouldPrintDeerMark(mark: DeerChoiceMark) {
  if (typeof mark.value !== "string") return true;
  const value = mark.value.toLowerCase();
  return value !== "no" && value !== "grind";
}

function speciesTextFields(species: LivestockSpecies) {
  if (species === "pork") return porkTextFields;
  if (species === "sheep") return sheepTextFields;
  if (species === "goat") return goatTextFields;
  return textFields;
}

function customerName(sheet: CutSheet) {
  return String(getFormData(sheet).customer_name || "Customer");
}

function formatDate(value: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (!current || font.widthOfTextAtSize(next, size) <= maxWidth)
      current = next;
    else {
      lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines;
}

function drawRedCheck(
  page: PDFPage,
  left: number,
  top: number,
  size: MarkSize = "normal",
) {
  const { width, height } = page.getSize();
  const centerX = (width * left) / 100;
  const centerY = height * (1 - top / 100);
  const markSize = size === "large" ? 24 : size === "tiny" ? 12 : 18;
  const thickness = size === "large" ? 4 : size === "tiny" ? 2.5 : 3.25;
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

function drawTextFields(
  page: PDFPage,
  data: FormData,
  fields: TextField[],
  font: PDFFont,
) {
  const { width, height } = page.getSize();

  for (const field of fields) {
    const value = String(data[field.name] ?? "").trim();
    if (!value) continue;
    const size = Math.max(7, width * field.fontScale);
    const x = (width * field.left) / 100;
    const y = height * (1 - field.top / 100) - size;
    const maxWidth = (width * field.width) / 100;

    if (field.multiline) {
      wrapText(value, font, size, maxWidth)
        .slice(0, 4)
        .forEach((line, index) => {
          page.drawText(line, {
            x,
            y: y - index * (size + 1),
            size,
            font,
            color: rgb(0.05, 0.05, 0.05),
          });
        });
    } else {
      let fittedSize = size;
      while (
        fittedSize > 6 &&
        font.widthOfTextAtSize(value, fittedSize) > maxWidth
      )
        fittedSize -= 0.5;
      page.drawText(value, {
        x,
        y,
        size: fittedSize,
        font,
        color: rgb(0.05, 0.05, 0.05),
      });
    }
  }
}

async function buildCombinedPdf(items: QueueItem[]) {
  const needsDeer = items.some((item) => item.kind === "deer");
  const neededSpecies = Array.from(
    new Set(
      items
        .filter(
          (item): item is Extract<QueueItem, { kind: "livestock" }> =>
            item.kind === "livestock",
        )
        .map((item) => item.species),
    ),
  );

  const [speciesResponses, deerResponse] = await Promise.all([
    Promise.all(
      neededSpecies.map(async (species) => {
        const response = await fetch(speciesTemplatePath(species));
        if (!response.ok) {
          throw new Error(`The ${species} cut-sheet PDF could not be loaded.`);
        }
        return [species, response] as const;
      }),
    ),
    needsDeer ? fetch("/images/deer-cut-sheet.pdf") : null,
  ]);

  if (deerResponse && !deerResponse.ok)
    throw new Error("The deer cut-sheet PDF could not be loaded.");

  const speciesTemplates = new Map<LivestockSpecies, PDFDocument>();
  for (const [species, response] of speciesResponses) {
    speciesTemplates.set(
      species,
      await PDFDocument.load(await response.arrayBuffer()),
    );
  }
  const deerTemplate = deerResponse
    ? await PDFDocument.load(await deerResponse.arrayBuffer())
    : null;
  const output = await PDFDocument.create();
  const font = await output.embedFont(StandardFonts.Helvetica);

  for (const item of items) {
    if (item.kind === "deer") {
      if (!deerTemplate) continue;
      const [page] = await output.copyPages(deerTemplate, [0]);
      output.addPage(page);
      const data = getDeerFormData(item.sheet);

      drawTextFields(page, data, deerTextFields, font);

      for (const mark of deerChoiceMarks) {
        if (!shouldPrintDeerMark(mark)) continue;

        const savedValue = data[mark.name];
        const oldSmokedWholeHam =
          mark.name === "whole_ham_smoked" && data.whole_ham === "smoked";
        const oldSmokedWholeHamYes =
          mark.name === "whole_ham" &&
          mark.value === "yes" &&
          data.whole_ham === "smoked";

        if (
          savedValue === mark.value ||
          oldSmokedWholeHam ||
          oldSmokedWholeHamYes
        ) {
          drawRedCheck(page, mark.left, mark.top, mark.size);
        }
      }
      continue;
    }

    const template = speciesTemplates.get(item.species);
    if (!template) continue;
    const [page] = await output.copyPages(template, [0]);
    output.addPage(page);
    const data = getFormData(item.sheet);

    drawTextFields(page, data, speciesTextFields(item.species), font);

    for (const mark of speciesChoiceMarks(item.species)) {
      if (
        shouldPrintLivestockMark(mark.name) &&
        data[mark.name] === true
      )
        drawRedCheck(page, mark.left, mark.top, mark.size);
    }
  }

  return output.save();
}

export default function AdminCutSheetsPage() {
  const router = useRouter();
  const [sheets, setSheets] = useState<CutSheet[]>([]);
  const [deerSheets, setDeerSheets] = useState<DeerCutSheet[]>([]);
  const [tab, setTab] = useState<Tab>("waiting");
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [message, setMessage] = useState("");

  async function loadCutSheets() {
    setLoading(true);
    setMessage("");

    const [livestockResult, deerResult] = await Promise.all([
      supabase
        .from("cut_sheets")
        .select(
          `
          id,
          animal_type,
          secure_token,
          unlocked,
          submitted_at,
          printed_at,
          form_data,
          customers (name, phone),
          animals (hanging_weight, kill_date)
        `,
        )
        .order("submitted_at", { ascending: false, nullsFirst: false }),
      supabase
        .from("deer_cut_sheets")
        .select(
          "id, secure_token, customer_name, phone, submitted_at, printed_at, created_at, form_data",
        )
        .order("created_at", { ascending: false }),
    ]);

    if (livestockResult.error) {
      console.error(livestockResult.error);
      setMessage(
        `Could not load livestock cut sheets: ${livestockResult.error.message}`,
      );
      setSheets([]);
    } else {
      const rows = (livestockResult.data ?? []) as unknown as CutSheet[];
      setSheets(rows.filter((sheet) => normalizeSpecies(sheet.animal_type)));
    }

    if (deerResult.error) {
      console.error(deerResult.error);
      setMessage((current) =>
        current
          ? `${current} Deer cut sheets also failed: ${deerResult.error.message}`
          : `Could not load deer cut sheets: ${deerResult.error.message}`,
      );
      setDeerSheets([]);
    } else {
      setDeerSheets((deerResult.data ?? []) as DeerCutSheet[]);
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
      await loadCutSheets();
    }

    void initialize();
    return () => {
      active = false;
    };
  }, [router]);

  const waiting = useMemo<QueueItem[]>(
    () => [
      ...sheets
        .filter((sheet) => sheet.unlocked && !sheet.submitted_at)
        .flatMap((sheet): QueueItem[] => {
          const species = normalizeSpecies(sheet.animal_type);
          return species ? [{ kind: "livestock", species, sheet }] : [];
        }),
      ...deerSheets
        .filter((sheet) => !sheet.submitted_at)
        .map((sheet): QueueItem => ({ kind: "deer", sheet })),
    ],
    [deerSheets, sheets],
  );
  const submitted = useMemo<QueueItem[]>(
    () => [
      ...sheets
        .filter((sheet) => Boolean(sheet.submitted_at) && !sheet.printed_at)
        .flatMap((sheet): QueueItem[] => {
          const species = normalizeSpecies(sheet.animal_type);
          return species ? [{ kind: "livestock", species, sheet }] : [];
        }),
      ...deerSheets
        .filter((sheet) => Boolean(sheet.submitted_at) && !sheet.printed_at)
        .map((sheet): QueueItem => ({ kind: "deer", sheet })),
    ],
    [deerSheets, sheets],
  );
  const printed = useMemo<QueueItem[]>(
    () => [
      ...sheets
        .filter((sheet) => Boolean(sheet.printed_at))
        .flatMap((sheet): QueueItem[] => {
          const species = normalizeSpecies(sheet.animal_type);
          return species ? [{ kind: "livestock", species, sheet }] : [];
        }),
      ...deerSheets
        .filter((sheet) => Boolean(sheet.printed_at))
        .map((sheet): QueueItem => ({ kind: "deer", sheet })),
    ],
    [deerSheets, sheets],
  );

  async function printSheets(requestedSheets: QueueItem[]) {
    const eligible = requestedSheets.filter(
      (item) => queueSubmittedAt(item) && !queuePrintedAt(item),
    );
    if (!eligible.length || printing) {
      setMessage("There are no new submitted cut sheets to print.");
      return;
    }

    setPrinting(true);
    setMessage("Preparing cut sheets...");

    try {
      const pdfBytes = await buildCombinedPdf(eligible);
      const printedAt = new Date().toISOString();
      const livestockIds = eligible
        .filter(
          (item): item is Extract<QueueItem, { kind: "livestock" }> =>
            item.kind === "livestock",
        )
        .map((item) => item.sheet.id);
      const deerIds = eligible
        .filter(
          (item): item is Extract<QueueItem, { kind: "deer" }> =>
            item.kind === "deer",
        )
        .map((item) => item.sheet.id);

      const [livestockUpdate, deerUpdate] = await Promise.all([
        livestockIds.length
          ? supabase
              .from("cut_sheets")
              .update({ printed_at: printedAt })
              .in("id", livestockIds)
              .is("printed_at", null)
          : Promise.resolve({ error: null }),
        deerIds.length
          ? supabase
              .from("deer_cut_sheets")
              .update({ printed_at: printedAt })
              .in("id", deerIds)
              .is("printed_at", null)
          : Promise.resolve({ error: null }),
      ]);

      if (livestockUpdate.error) throw livestockUpdate.error;
      if (deerUpdate.error) throw deerUpdate.error;

      setSheets((current) =>
        current.map((sheet) =>
          livestockIds.includes(sheet.id)
            ? { ...sheet, printed_at: printedAt }
            : sheet,
        ),
      );
      setDeerSheets((current) =>
        current.map((sheet) =>
          deerIds.includes(sheet.id)
            ? { ...sheet, printed_at: printedAt }
            : sheet,
        ),
      );

      const exactBuffer = pdfBytes.buffer.slice(
        pdfBytes.byteOffset,
        pdfBytes.byteOffset + pdfBytes.byteLength,
      ) as ArrayBuffer;
      const url = URL.createObjectURL(
        new Blob([exactBuffer], { type: "application/pdf" }),
      );
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
      setMessage(
        `${eligible.length} cut sheet${eligible.length === 1 ? "" : "s"} marked printed. Printed sheets will not be included again.`,
      );
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error
          ? `Could not print cut sheets: ${error.message}`
          : "Could not print cut sheets.",
      );
    } finally {
      setPrinting(false);
    }
  }

  const activeSheets =
    tab === "waiting" ? waiting : tab === "submitted" ? submitted : printed;

  return (
    <main className="min-h-screen bg-stone-100 text-stone-950">
      <header className="bg-stone-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-red-400">
              Apex Custom Butchering
            </p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-tight">
              Customer Cut Sheets
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin"
              className="rounded-md border border-white/25 px-4 py-3 text-sm font-bold transition hover:bg-white hover:text-stone-950"
            >
              Back to Dashboard
            </Link>
            <button
              type="button"
              onClick={loadCutSheets}
              disabled={loading}
              className="rounded-md bg-red-800 px-4 py-3 text-sm font-bold transition hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:px-12">
        <section className="grid gap-4 md:grid-cols-3">
          {(
            [
              ["waiting", "Waiting on Customer", waiting.length],
              ["submitted", "Submitted / Ready to Print", submitted.length],
              ["printed", "Printed Archive", printed.length],
            ] as Array<[Tab, string, number]>
          ).map(([value, label, count]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`rounded-xl border p-5 text-left shadow-sm transition ${tab === value ? "border-red-800 bg-red-800 text-white" : "border-stone-200 bg-white hover:border-red-400"}`}
            >
              <span className="block text-sm font-bold uppercase tracking-[0.12em]">
                {label}
              </span>
              <span className="mt-2 block text-4xl font-black">{count}</span>
            </button>
          ))}
        </section>

        {message ? (
          <div
            className={`mt-6 rounded-lg border px-5 py-4 font-semibold ${message.startsWith("Could not") ? "border-red-300 bg-red-50 text-red-900" : "border-emerald-300 bg-emerald-50 text-emerald-900"}`}
          >
            {message}
          </div>
        ) : null}

        <section className="mt-6 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-stone-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight">
                {tab === "waiting"
                  ? "Waiting on Customer"
                  : tab === "submitted"
                    ? "Submitted / Ready to Print"
                    : "Printed Archive"}
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
                {printing
                  ? "Preparing..."
                  : `Print All New (${submitted.length})`}
              </button>
            ) : null}
          </div>

          {loading ? (
            <div className="px-6 py-16 text-center font-semibold text-stone-500">
              Loading cut sheets...
            </div>
          ) : activeSheets.length ? (
            <div className="divide-y divide-stone-200">
              {activeSheets.map((item) => {
                const animal =
                  item.kind === "livestock" ? getAnimal(item.sheet) : null;
                const phone = queuePhone(item);
                const submittedAt = queueSubmittedAt(item);
                const printedAt = queuePrintedAt(item);

                return (
                  <article
                    key={`${item.kind}-${item.sheet.id}`}
                    className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-black">
                          {queueCustomerName(item)}
                        </h3>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.1em] ${
                            item.kind === "deer"
                              ? "bg-amber-100 text-amber-900"
                              : "bg-red-100 text-red-900"
                          }`}
                        >
                          {item.kind === "deer"
                            ? "Deer"
                            : speciesLabel(item.species)}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-stone-600">
                        {phone ? <span>{phone}</span> : null}
                        {animal?.hanging_weight ? (
                          <span>
                            {animal.hanging_weight} lbs hanging weight
                          </span>
                        ) : null}
                        {submittedAt ? (
                          <span>Submitted: {formatDate(submittedAt)}</span>
                        ) : (
                          <span>Still waiting</span>
                        )}
                        {printedAt ? (
                          <span>Printed: {formatDate(printedAt)}</span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {tab !== "printed" ? (
                        <a
                          href={queueCustomerLink(item)}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-bold transition hover:border-stone-950"
                        >
                          {tab === "waiting"
                            ? "Open Customer Link"
                            : "Review Cut Sheet"}
                        </a>
                      ) : (
                        <span className="rounded-md bg-stone-100 px-4 py-2 text-sm font-bold text-stone-500">
                          Printing Locked
                        </span>
                      )}

                      {tab === "submitted" ? (
                        <button
                          type="button"
                          onClick={() => printSheets([item])}
                          disabled={printing}
                          className="rounded-md bg-red-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
                        >
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
              <p className="font-bold text-stone-700">
                No cut sheets are in this section.
              </p>
              <p className="mt-1 text-sm text-stone-500">
                {tab === "submitted"
                  ? "Newly submitted sheets will appear here automatically."
                  : "This list is currently empty."}
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
