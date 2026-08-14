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

type QueueItem =
  | { kind: "beef"; sheet: CutSheet }
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

const porkChoiceMarks: ChoiceMark[] = [
  { name: "pork_hams_cured", left: 11.521, top: 30.723, size: "tiny" },
  { name: "pork_hams_fresh", left: 11.521, top: 33.523, size: "tiny" },
  { name: "pork_ham_quarter", left: 15.377, top: 36.107, size: "tiny" },
  { name: "pork_ham_half", left: 15.377, top: 38.766, size: "tiny" },
  { name: "pork_ham_whole", left: 15.377, top: 41.425, size: "tiny" },
  { name: "pork_ham_steaks", left: 15.377, top: 44.084, size: "tiny" },
  { name: "pork_hocks_cured", left: 47.938, top: 29.932, size: "tiny" },
  { name: "pork_hocks_fresh", left: 47.938, top: 32.732, size: "tiny" },
  { name: "pork_jowls_cured", left: 47.938, top: 39.928, size: "tiny" },
  { name: "pork_jowls_fresh", left: 47.938, top: 42.729, size: "tiny" },
  { name: "pork_tongue_yes", left: 78.887, top: 30.045, size: "tiny" },
  { name: "pork_tongue_no", left: 78.887, top: 32.845, size: "tiny" },
  { name: "pork_liver_yes", left: 78.887, top: 39.994, size: "tiny" },
  { name: "pork_liver_no", left: 78.887, top: 42.79, size: "tiny" },
  { name: "pork_ribs_yes", left: 47.938, top: 49.972, size: "tiny" },
  { name: "pork_ribs_no", left: 47.938, top: 52.767, size: "tiny" },
  { name: "pork_lard_yes", left: 79.094, top: 50.028, size: "tiny" },
  { name: "pork_lard_no", left: 79.094, top: 52.833, size: "tiny" },
  { name: "pork_bacon_cured", left: 11.508, top: 53.323, size: "tiny" },
  { name: "pork_bacon_fresh", left: 11.508, top: 56.123, size: "tiny" },
  { name: "pork_bacon_1lb", left: 15.517, top: 58.707, size: "tiny" },
  { name: "pork_bacon_2lb", left: 15.517, top: 61.361, size: "tiny" },
  { name: "pork_heart_yes", left: 47.681, top: 60.104, size: "tiny" },
  { name: "pork_heart_no", left: 47.681, top: 62.905, size: "tiny" },
  { name: "pork_porkchops_yes", left: 79.094, top: 60.104, size: "tiny" },
  { name: "pork_porkchops_no", left: 79.094, top: 62.905, size: "tiny" },
  { name: "pork_loin_yes", left: 47.681, top: 70.181, size: "tiny" },
  { name: "pork_loin_no", left: 47.681, top: 72.986, size: "tiny" },
  { name: "pork_loin_roast_yes", left: 79.094, top: 70.181, size: "tiny" },
  { name: "pork_loin_roast_no", left: 79.094, top: 72.986, size: "tiny" },
  { name: "pork_shoulder_steak", left: 4.351, top: 71.263, size: "tiny" },
  { name: "pork_shoulder_roast", left: 4.351, top: 75.428, size: "tiny" },
  { name: "pork_pulled_pork", left: 4.351, top: 79.688, size: "tiny" },
  { name: "pork_sausage_links", left: 40.725, top: 77.024, size: "tiny" },
  { name: "pork_bulk_sausage", left: 40.725, top: 80.845, size: "tiny" },
  { name: "pork_patties", left: 75.885, top: 77.099, size: "tiny" },
  { name: "pork_brats", left: 75.885, top: 80.921, size: "tiny" },
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
    width: 5,
    fontScale: 0.016,
  },
  {
    name: "pork_patties_lbs",
    left: 87.45,
    top: 76.35,
    width: 5,
    fontScale: 0.016,
  },
  {
    name: "pork_bulk_sausage_lbs",
    left: 61.3,
    top: 80.15,
    width: 5,
    fontScale: 0.016,
  },
  {
    name: "pork_brats_lbs",
    left: 85.9,
    top: 80.15,
    width: 5,
    fontScale: 0.016,
  },
  {
    name: "notes",
    left: 3.3,
    top: 84,
    width: 93,
    fontScale: 0.016,
    multiline: true,
  },
];

const porkSausageChoiceMarks: ChoiceMark[] = [
  { name: "pork_sausage_farmstyle", left: 24.824, top: 27.015, size: "tiny" },
  {
    name: "pork_sausage_sweet_italian",
    left: 27.859,
    top: 36.746,
    size: "tiny",
  },
  { name: "pork_sausage_italian", left: 19.877, top: 46.127, size: "tiny" },
  { name: "pork_sausage_regular", left: 21.654, top: 55.727, size: "tiny" },
  { name: "pork_sausage_hot", left: 15.441, top: 65.458, size: "tiny" },
  { name: "pork_sausage_maple", left: 18.762, top: 75.136, size: "tiny" },
];

const porkSausageTextFields: TextField[] = [
  {
    name: "pork_sausage_brats_batches",
    left: 64.08,
    top: 26.1,
    width: 4.2,
    fontScale: 0.017,
  },
  {
    name: "pork_sausage_brats_cheese_batches",
    left: 64.7,
    top: 30.93,
    width: 4.2,
    fontScale: 0.017,
  },
  {
    name: "pork_sausage_patties_batches",
    left: 65.48,
    top: 35.75,
    width: 4.2,
    fontScale: 0.017,
  },
  {
    name: "pork_sausage_patties_cheese_batches",
    left: 64.37,
    top: 40.59,
    width: 4.2,
    fontScale: 0.017,
  },
  {
    name: "pork_sausage_links_batches",
    left: 64.07,
    top: 45.41,
    width: 4.2,
    fontScale: 0.017,
  },
  {
    name: "pork_sausage_links_cheese_batches",
    left: 64.42,
    top: 50.24,
    width: 4.2,
    fontScale: 0.017,
  },
  {
    name: "pork_sausage_ground_pork_lbs",
    left: 75.21,
    top: 55.08,
    width: 4.2,
    fontScale: 0.017,
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
  const needsPork = items.some(
    (item) =>
      item.kind === "beef" &&
      String(item.sheet.animal_type || "")
        .toLowerCase()
        .includes("pork"),
  );
  const needsBeef = items.some((item) => {
    if (item.kind !== "beef") return false;
    const animalType = String(item.sheet.animal_type || "").toLowerCase();
    return !animalType.includes("pork");
  });
  const needsDeer = items.some((item) => item.kind === "deer");

  const [beefResponse, porkResponse, deerResponse] = await Promise.all([
    needsBeef ? fetch("/images/beef-cut-sheet.pdf") : null,
    needsPork ? fetch("/images/pork-cut-sheet.pdf") : null,
    needsDeer ? fetch("/images/deer-cut-sheet.pdf") : null,
  ]);

  if (beefResponse && !beefResponse.ok)
    throw new Error("The beef cut-sheet PDF could not be loaded.");
  if (porkResponse && !porkResponse.ok)
    throw new Error("The pork cut-sheet PDF could not be loaded.");
  if (deerResponse && !deerResponse.ok)
    throw new Error("The deer cut-sheet PDF could not be loaded.");

  const beefTemplate = beefResponse
    ? await PDFDocument.load(await beefResponse.arrayBuffer())
    : null;
  const porkTemplate = porkResponse
    ? await PDFDocument.load(await porkResponse.arrayBuffer())
    : null;
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

    const animalType = String(item.sheet.animal_type || "").toLowerCase();

    if (animalType.includes("pork")) {
      if (!porkTemplate) continue;
      if (porkTemplate.getPageCount() < 2) {
        throw new Error(
          "The pork cut-sheet PDF must contain the cut sheet first and sausage sheet second.",
        );
      }

      const [cutPage, sausagePage] = await output.copyPages(
        porkTemplate,
        [0, 1],
      );
      output.addPage(cutPage);
      output.addPage(sausagePage);
      const data = getFormData(item.sheet);

      drawTextFields(cutPage, data, porkTextFields, font);
      for (const mark of porkChoiceMarks) {
        if (data[mark.name] === true)
          drawRedCheck(cutPage, mark.left, mark.top, mark.size);
      }

      drawTextFields(sausagePage, data, porkSausageTextFields, font);
      for (const mark of porkSausageChoiceMarks) {
        if (data[mark.name] === true)
          drawRedCheck(sausagePage, mark.left, mark.top, mark.size);
      }
      continue;
    }

    if (!beefTemplate) continue;
    const [page] = await output.copyPages(beefTemplate, [0]);
    output.addPage(page);
    const data = getFormData(item.sheet);

    drawTextFields(page, data, textFields, font);

    for (const mark of choiceMarks) {
      if (data[mark.name] === true)
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

    const [beefResult, deerResult] = await Promise.all([
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

    if (beefResult.error) {
      console.error(beefResult.error);
      setMessage(
        `Could not load livestock cut sheets: ${beefResult.error.message}`,
      );
      setSheets([]);
    } else {
      const rows = (beefResult.data ?? []) as unknown as CutSheet[];
      setSheets(
        rows.filter((sheet) => {
          const animal = String(sheet.animal_type || "").toLowerCase();
          return (
            animal.includes("beef") ||
            animal.includes("cow") ||
            animal.includes("cattle") ||
            animal.includes("pork") ||
            animal.includes("pig") ||
            animal.includes("hog")
          );
        }),
      );
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
        .map((sheet): QueueItem => ({ kind: "beef", sheet })),
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
        .map((sheet): QueueItem => ({ kind: "beef", sheet })),
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
        .map((sheet): QueueItem => ({ kind: "beef", sheet })),
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
      const beefIds = eligible
        .filter(
          (item): item is Extract<QueueItem, { kind: "beef" }> =>
            item.kind === "beef",
        )
        .map((item) => item.sheet.id);
      const deerIds = eligible
        .filter(
          (item): item is Extract<QueueItem, { kind: "deer" }> =>
            item.kind === "deer",
        )
        .map((item) => item.sheet.id);

      const [beefUpdate, deerUpdate] = await Promise.all([
        beefIds.length
          ? supabase
              .from("cut_sheets")
              .update({ printed_at: printedAt })
              .in("id", beefIds)
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

      if (beefUpdate.error) throw beefUpdate.error;
      if (deerUpdate.error) throw deerUpdate.error;

      setSheets((current) =>
        current.map((sheet) =>
          beefIds.includes(sheet.id)
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
                  item.kind === "beef" ? getAnimal(item.sheet) : null;
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
                            : String(item.sheet.animal_type || "Livestock")}
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