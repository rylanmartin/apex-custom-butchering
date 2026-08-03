"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../supabase";

type PricingCategory = "beef" | "pork" | "goat-sheep" | "deer";
type PricingItem = {
  id: string;
  item: string;
  price: string;
  category: PricingCategory;
};

const pricingSections: Array<{ id: PricingCategory; label: string; description: string }> = [
  { id: "beef", label: "Beef", description: "Beef processing prices and additional services." },
  { id: "pork", label: "Pork", description: "Pork processing prices and additional services." },
  { id: "goat-sheep", label: "Goat & Sheep", description: "Goat, sheep, and lamb processing prices." },
  { id: "deer", label: "Deer", description: "Deer and venison processing prices." },
];

function inferPricingCategory(item: string): PricingCategory {
  const normalized = item.toLowerCase();
  if (normalized.includes("pork") || normalized.includes("pig") || normalized.includes("hog")) return "pork";
  if (normalized.includes("goat") || normalized.includes("sheep") || normalized.includes("lamb")) return "goat-sheep";
  if (normalized.includes("deer") || normalized.includes("venison")) return "deer";
  return "beef";
}

function normalizePricingItems(value: unknown): PricingItem[] {
  if (!Array.isArray(value)) return [];

  return value.map((entry, index) => {
    const record = entry && typeof entry === "object"
      ? entry as Record<string, unknown>
      : {};
    const item = typeof record.item === "string" ? record.item : "";
    const savedCategory = record.category;
    const category = savedCategory === "beef" || savedCategory === "pork" || savedCategory === "goat-sheep" || savedCategory === "deer"
      ? savedCategory
      : inferPricingCategory(item);

    return {
      id: typeof record.id === "string" && record.id ? record.id : `pricing-${index}`,
      item,
      price: typeof record.price === "string" ? record.price : "",
      category,
    };
  });
}

export default function PricingPage() {
  const [pricingItems, setPricingItems] = useState<PricingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadPricing() {
      const { data, error } = await supabase
        .from("shop_settings")
        .select("setting_value")
        .eq("setting_key", "pricing_items")
        .maybeSingle();

      if (!active) return;

      if (error) {
        console.error(error);
        setPricingItems([]);
      } else {
        setPricingItems(normalizePricingItems(data?.setting_value));
      }

      setLoading(false);
    }

    void loadPricing();
    return () => { active = false; };
  }, []);

  return (
    <main className="min-h-screen bg-stone-100 text-stone-950">
      <header className="border-b border-white/10 bg-stone-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4 sm:px-8 lg:px-12">
          <Link href="/" className="font-black uppercase tracking-[0.16em]">
            Apex Custom Butchering
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/" className="rounded-md border border-white/30 px-4 py-2 text-sm font-bold uppercase tracking-[0.08em] transition hover:bg-white hover:text-stone-950">
              Home
            </Link>
            <Link href="/schedule" className="rounded-md bg-red-800 px-4 py-2 text-sm font-bold uppercase tracking-[0.08em] transition hover:bg-red-700">
              Schedule
            </Link>
          </nav>
        </div>
      </header>

      <section className="bg-stone-950 px-6 py-16 text-center text-white sm:py-20">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-red-400">Current Rates</p>
        <h1 className="mt-4 text-4xl font-black uppercase tracking-tight sm:text-6xl">Processing Pricing</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-stone-300">
          Select a section below to review our current processing prices and available services.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14 sm:px-8 sm:py-20 lg:px-12">
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {pricingSections.map((section) => (
              <div key={section.id} className="h-72 animate-pulse rounded-xl bg-stone-200" />
            ))}
          </div>
        ) : (
          <div className="grid items-start gap-6 md:grid-cols-2">
            {pricingSections.map((section) => {
              const sectionItems = pricingItems.filter((entry) => entry.category === section.id);

              return (
                <article key={section.id} className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
                  <div className="bg-red-900 px-6 py-5 text-white">
                    <h2 className="text-2xl font-black uppercase tracking-tight">{section.label}</h2>
                    <p className="mt-1 text-sm text-red-100">{section.description}</p>
                  </div>

                  {sectionItems.length ? (
                    <div>
                      {sectionItems.map((entry, index) => (
                        <div key={entry.id} className={`flex flex-col gap-2 px-6 py-5 sm:flex-row sm:items-center sm:justify-between ${index ? "border-t border-stone-200" : ""}`}>
                          <span className="font-bold text-stone-900">{entry.item}</span>
                          <span className="text-lg font-black text-red-800">{entry.price}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="px-6 py-10 text-center font-semibold text-stone-500">
                      Pricing will be posted here soon.
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="bg-red-900 px-6 py-14 text-center text-white">
        <h2 className="text-3xl font-black uppercase tracking-tight">Ready to Schedule?</h2>
        <p className="mx-auto mt-3 max-w-xl text-red-100">Choose your processing date through our online scheduling form.</p>
        <Link href="/schedule" className="mt-7 inline-flex min-h-14 items-center justify-center rounded-md bg-white px-8 py-4 text-sm font-bold uppercase tracking-[0.12em] text-red-900 transition hover:bg-stone-100">
          Schedule Processing
        </Link>
      </section>

      <footer className="bg-stone-950 px-6 py-8 text-center text-sm text-stone-500">
        © {new Date().getFullYear()} Apex Custom Butchering. All rights reserved.
      </footer>
    </main>
  );
}
