"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../supabase";

type ShopInformation = { name: string; phone: string; address: string };
type ShopLink = { id: string; label: string; url: string };
type GalleryImage = { id: string; image_url: string };
type PublicCutSheet = { id: string; title: string; file_url: string; storage_path?: string | null };

const DEFAULT_SHOP_INFORMATION: ShopInformation = {
  name: "Apex Custom Butchering",
  phone: "(989) 323-1187",
  address: "155 W Henderson Rd, Owosso, MI 48867",
};

function normalizePhoneForLink(phone: string) {
  return phone.replace(/[^\d+]/g, "");
}

function normalizePublicUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return "#";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function CalendarIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3.75 9.75h16.5M5.25 5.25h13.5A1.5 1.5 0 0 1 20.25 6.75v12A1.5 1.5 0 0 1 18.75 20.25H5.25a1.5 1.5 0 0 1-1.5-1.5v-12a1.5 1.5 0 0 1 1.5-1.5Z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106a1.125 1.125 0 0 0-1.173.417l-.97 1.293a1.125 1.125 0 0 1-1.21.38 12.035 12.035 0 0 1-7.143-7.143 1.125 1.125 0 0 1 .38-1.21l1.293-.97c.37-.278.534-.758.417-1.173L6.963 3.102A1.125 1.125 0 0 0 5.872 2.25H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 3.75H6.75A1.5 1.5 0 0 0 5.25 5.25v13.5a1.5 1.5 0 0 0 1.5 1.5h10.5a1.5 1.5 0 0 0 1.5-1.5V8.25l-4.5-4.5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 3.75v4.5h4.5M8.25 13.5h7.5M8.25 16.5h7.5M8.25 10.5h2.25" />
    </svg>
  );
}

export default function HomePage() {
  const [shopInformation, setShopInformation] = useState(DEFAULT_SHOP_INFORMATION);
  const [shopLinks, setShopLinks] = useState<ShopLink[]>([]);
  const [galleryTitle, setGalleryTitle] = useState("Our Gallery");
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [cutSheets, setCutSheets] = useState<PublicCutSheet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadHomepageContent() {
      const [settingsResult, galleryResult] = await Promise.all([
        supabase.from("shop_settings").select("setting_key, setting_value").in("setting_key", [
          "shop_information",
          "shop_links",
          "gallery_title",
          "public_cut_sheets",
        ]),
        supabase.from("gallery_images").select("id, image_url").order("created_at", { ascending: true }),
      ]);

      if (!active) return;

      if (!settingsResult.error) {
        for (const row of settingsResult.data ?? []) {
          if (row.setting_key === "shop_information") {
            const value = row.setting_value as Partial<ShopInformation>;
            setShopInformation({
              name: value.name || DEFAULT_SHOP_INFORMATION.name,
              phone: value.phone || DEFAULT_SHOP_INFORMATION.phone,
              address: value.address || DEFAULT_SHOP_INFORMATION.address,
            });
          }
          if (row.setting_key === "shop_links" && Array.isArray(row.setting_value)) {
            setShopLinks(row.setting_value as ShopLink[]);
          }
          if (row.setting_key === "gallery_title") {
            const value = row.setting_value as { title?: string };
            setGalleryTitle(value.title?.trim() || "Our Gallery");
          }
          if (row.setting_key === "public_cut_sheets" && Array.isArray(row.setting_value)) {
            setCutSheets(row.setting_value as PublicCutSheet[]);
          }
        }
      } else {
        console.error(settingsResult.error);
      }

      if (!galleryResult.error) setGalleryImages(galleryResult.data ?? []);
      else console.error(galleryResult.error);

      setLoading(false);
    }

    void loadHomepageContent();
    return () => { active = false; };
  }, []);

  const phoneHref = `tel:${normalizePhoneForLink(shopInformation.phone)}`;
  const homepageGallery = galleryImages.slice(0, 3);

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-stone-950/95 text-white backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4 sm:px-8 lg:px-12">
          <Link href="/" className="font-black uppercase tracking-[0.16em]">Apex Custom Butchering</Link>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-bold uppercase tracking-[0.08em]">
            <Link href="/pricing" className="transition hover:text-red-400">Pricing</Link>
            <a href="#gallery" className="transition hover:text-red-400">Gallery</a>
            <a href="#cut-sheets" className="transition hover:text-red-400">Cut Sheets</a>
            <Link href="/schedule" className="rounded-md bg-red-800 px-4 py-2 transition hover:bg-red-700">Schedule</Link>
          </nav>
        </div>
      </header>

      <section className="relative isolate flex min-h-[700px] items-center overflow-hidden bg-stone-950">
        <img src="/apex-hero.jpg" alt="" className="absolute inset-0 -z-30 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-20 bg-black/65" />
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center px-6 py-24 text-center sm:px-8 lg:px-12">
          <img src="/apex-logo-gray.png" alt={`${shopInformation.name} logo`} className="mb-8 h-auto w-full max-w-[300px] opacity-90" />
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.34em] text-stone-200">Custom Processing Done Right</p>
          <h1 className="max-w-5xl text-4xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl">Quality You Can Trust</h1>
          <p className="mt-6 max-w-2xl text-lg leading-7 text-stone-200">Professional custom butchering with careful handling, dependable service, and attention to every order.</p>
          <div className="mt-10 flex w-full max-w-xl flex-col gap-4 sm:flex-row">
            <Link href="/schedule" className="inline-flex min-h-14 flex-1 items-center justify-center gap-3 rounded-md bg-red-800 px-7 py-4 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-red-700"><CalendarIcon />Schedule Processing</Link>
            <a href={phoneHref} className="inline-flex min-h-14 flex-1 items-center justify-center gap-3 rounded-md border border-white/60 bg-white/10 px-7 py-4 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-white hover:text-stone-950"><PhoneIcon />Call Now</a>
          </div>
        </div>
      </section>

      <section id="pricing" className="scroll-mt-24 bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-6 sm:px-8">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-red-800">Current Rates</p>
            <h2 className="mt-4 text-4xl font-black uppercase tracking-tight sm:text-5xl">Pricing</h2>
            <div className="mx-auto mt-6 h-1 w-16 bg-red-800" />
          </div>
          <p className="mx-auto mt-8 max-w-2xl text-center text-lg leading-8 text-stone-600">
            View our current Beef, Pork, Goat &amp; Sheep, and Deer processing prices.
          </p>
          <div className="mt-10 text-center">
            <Link href="/pricing" className="inline-flex min-h-14 items-center justify-center rounded-md bg-red-800 px-8 py-4 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-red-700">
              View All Pricing
            </Link>
          </div>
        </div>
      </section>

      <section id="gallery" className="scroll-mt-24 border-y border-stone-200 bg-stone-100 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-red-800">Inside Apex</p>
            <h2 className="mt-4 text-4xl font-black uppercase tracking-tight sm:text-5xl">{galleryTitle}</h2>
            <div className="mx-auto mt-6 h-1 w-16 bg-red-800" />
          </div>
          {loading ? <div className="mt-12 h-60 animate-pulse rounded-lg bg-stone-200" /> : homepageGallery.length ? (
            <>
              <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {homepageGallery.map((image, index) => (
                  <figure key={image.id} className="group aspect-[4/3] overflow-hidden rounded-sm bg-stone-200 shadow-sm">
                    <img src={image.image_url} alt={`${galleryTitle} image ${index + 1}`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  </figure>
                ))}
              </div>
              <div className="mt-10 text-center"><Link href="/gallery" className="inline-flex rounded-md bg-stone-950 px-7 py-4 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-red-800">View Full Gallery</Link></div>
            </>
          ) : <p className="mt-12 text-center text-stone-600">Gallery pictures will appear here after they are added.</p>}
        </div>
      </section>

      <section id="cut-sheets" className="scroll-mt-24 bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-6 sm:px-8">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-red-800">Plan Your Order</p>
            <h2 className="mt-4 text-4xl font-black uppercase tracking-tight sm:text-5xl">Cut Sheets</h2>
            <div className="mx-auto mt-6 h-1 w-16 bg-red-800" />
          </div>
          {cutSheets.length ? (
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {cutSheets.map((sheet) => (
                <a key={sheet.id} href={sheet.file_url} target="_blank" rel="noreferrer" className="group flex items-center gap-4 rounded-lg border border-stone-200 bg-stone-50 p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-red-800 hover:shadow-md">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-red-800 text-white"><DocumentIcon /></div>
                  <div><h3 className="font-black uppercase tracking-tight">{sheet.title}</h3><p className="mt-1 text-sm font-semibold text-red-800">Open PDF</p></div>
                </a>
              ))}
            </div>
          ) : <p className="mt-12 text-center text-stone-600">Cut sheet PDFs will be available here soon.</p>}
        </div>
      </section>

      <section className="bg-red-900 py-16 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-6 text-center sm:px-8 lg:flex-row lg:px-12 lg:text-left">
          <div><p className="text-sm font-bold uppercase tracking-[0.3em] text-red-200">Ready to Get Scheduled?</p><h2 className="mt-3 text-3xl font-black uppercase tracking-tight sm:text-4xl">Reserve Your Processing Date</h2></div>
          <Link href="/schedule" className="inline-flex items-center justify-center gap-3 rounded-md bg-white px-7 py-4 text-sm font-bold uppercase tracking-[0.12em] text-red-900"><CalendarIcon />Schedule Now</Link>
        </div>
      </section>

      <footer className="bg-stone-950 py-12 text-stone-300">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 sm:px-8 md:grid-cols-2 lg:grid-cols-4 lg:px-12">
          <img src="/apex-logo-gray.png" alt={`${shopInformation.name} logo`} className="h-auto w-44 opacity-85" />
          <div><h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white">Contact</h2><a href={phoneHref} className="mt-4 block hover:text-white">{shopInformation.phone}</a><p className="mt-2">{shopInformation.address}</p></div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white">Connect</h2>
            {shopLinks.filter((link) => link.label.trim() && link.url.trim()).length ? (
              <div className="mt-4 flex flex-col gap-2">
                {shopLinks.filter((link) => link.label.trim() && link.url.trim()).map((link) => (
                  <a key={link.id} href={normalizePublicUrl(link.url)} target="_blank" rel="noreferrer" className="hover:text-white">
                    {link.label}
                  </a>
                ))}
              </div>
            ) : <p className="mt-4 text-sm text-stone-500">More links coming soon.</p>}
          </div>
          <div><h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white">Quick Links</h2><div className="mt-4 flex flex-col gap-2"><Link href="/pricing">Pricing</Link><Link href="/gallery">Full Gallery</Link><a href="#cut-sheets">Cut Sheets</a></div></div>
        </div>
        <div className="mx-auto mt-10 max-w-7xl border-t border-white/10 px-6 pt-6 text-sm text-stone-500 sm:px-8 lg:px-12">© {new Date().getFullYear()} {shopInformation.name}. All rights reserved.</div>
      </footer>
    </main>
  );
}
