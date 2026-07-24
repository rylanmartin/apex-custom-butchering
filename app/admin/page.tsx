"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type ShopInformation = {
  name: string;
  phone: string;
  address: string;
};

type GalleryImage = {
  id: string;
  image_url: string;
};

const DEFAULT_SHOP_INFORMATION: ShopInformation = {
  name: "Apex Custom Butchering",
  phone: "(989) 323-1187",
  address: "155 W Henderson Rd, Owosso, MI 48867",
};

const DEFAULT_GALLERY_TITLE = "Our Gallery";

function PhoneIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106a1.125 1.125 0 0 0-1.173.417l-.97 1.293a1.125 1.125 0 0 1-1.21.38 12.035 12.035 0 0 1-7.143-7.143 1.125 1.125 0 0 1 .38-1.21l1.293-.97c.37-.278.534-.758.417-1.173L6.963 3.102A1.125 1.125 0 0 0 5.872 2.25H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3.75 9.75h16.5M5.25 5.25h13.5A1.5 1.5 0 0 1 20.25 6.75v12A1.5 1.5 0 0 1 18.75 20.25H5.25a1.5 1.5 0 0 1-1.5-1.5v-12a1.5 1.5 0 0 1 1.5-1.5Z"
      />
    </svg>
  );
}

function KnifeIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-9 w-9"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m4.5 19.5 5.15-5.15m0 0 2.12 2.12m-2.12-2.12 8.86-8.86a2.25 2.25 0 0 1 3.18 3.18l-8.86 8.86m-3.18-3.18 3.18 3.18m0 0-2.12 2.12a2.25 2.25 0 0 1-3.18-3.18l2.12-2.12"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-9 w-9"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3 4.5 6v5.25c0 4.97 3.163 8.566 7.5 9.75 4.337-1.184 7.5-4.78 7.5-9.75V6L12 3Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m8.75 12 2.1 2.1 4.4-4.4"
      />
    </svg>
  );
}

function HandsIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-9 w-9"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 11.25 5.5 8.5a1.768 1.768 0 0 0-2.5 2.5l4.75 4.75A4.25 4.25 0 0 0 10.755 17H12"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m15.75 11.25 2.75-2.75A1.768 1.768 0 0 1 21 11l-4.75 4.75A4.25 4.25 0 0 1 13.245 17H12"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 8.25 12 11.5l3-3.25"
      />
    </svg>
  );
}

function normalizePhoneForLink(phone: string) {
  return phone.replace(/[^\d+]/g, "");
}

export default function HomePage() {
  const [shopInformation, setShopInformation] =
    useState<ShopInformation>(DEFAULT_SHOP_INFORMATION);
  const [galleryTitle, setGalleryTitle] = useState(DEFAULT_GALLERY_TITLE);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadHomepageContent() {
      const [settingsResult, galleryResult] = await Promise.all([
        supabase
          .from("shop_settings")
          .select("setting_key, setting_value")
          .in("setting_key", ["shop_information", "gallery_title"]),
        supabase
          .from("gallery_images")
          .select("id, image_url")
          .order("created_at", { ascending: true }),
      ]);

      if (!isMounted) {
        return;
      }

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

          if (row.setting_key === "gallery_title") {
            const value = row.setting_value as { title?: string };
            setGalleryTitle(value.title?.trim() || DEFAULT_GALLERY_TITLE);
          }
        }
      } else {
        console.error("Unable to load homepage settings:", settingsResult.error);
      }

      if (!galleryResult.error) {
        setGalleryImages(galleryResult.data ?? []);
      } else {
        console.error("Unable to load gallery images:", galleryResult.error);
      }

      setGalleryLoading(false);
    }

    loadHomepageContent();

    return () => {
      isMounted = false;
    };
  }, []);

  const phoneHref = `tel:${normalizePhoneForLink(shopInformation.phone)}`;

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <section className="relative isolate flex min-h-[760px] items-center overflow-hidden bg-stone-950">
        <img
          src="/apex-hero.jpg"
          alt=""
          className="absolute inset-0 -z-30 h-full w-full object-cover"
        />

        <div className="absolute inset-0 -z-20 bg-black/65" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/35 via-transparent to-black/55" />

        <div className="mx-auto flex w-full max-w-7xl flex-col items-center px-6 py-24 text-center sm:px-8 lg:px-12">
          <img
            src="/images/apex-logo.png"
            alt={`${shopInformation.name} logo`}
            className="mb-8 h-auto w-full max-w-[260px] opacity-90 drop-shadow-[0_10px_28px_rgba(0,0,0,0.45)] sm:max-w-[330px]"
          />

          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.34em] text-stone-200 sm:text-base">
            Custom Processing Done Right
          </p>

          <h1 className="max-w-5xl text-4xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Quality You Can Trust
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-stone-200 sm:text-lg">
            Professional custom butchering with careful handling, dependable
            service, and attention to every order.
          </p>

          <div className="mt-10 flex w-full max-w-xl flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/schedule"
              className="inline-flex min-h-14 flex-1 items-center justify-center gap-3 rounded-md bg-red-800 px-7 py-4 text-sm font-bold uppercase tracking-[0.12em] text-white shadow-lg transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-stone-950"
            >
              <CalendarIcon />
              Schedule Processing
            </Link>

            <a
              href={phoneHref}
              className="inline-flex min-h-14 flex-1 items-center justify-center gap-3 rounded-md border border-white/60 bg-white/10 px-7 py-4 text-sm font-bold uppercase tracking-[0.12em] text-white backdrop-blur-sm transition hover:bg-white hover:text-stone-950 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-stone-950"
            >
              <PhoneIcon />
              Call Now
            </a>
          </div>

          <p className="mt-6 text-sm font-medium text-stone-300">
            {shopInformation.phone}
          </p>
        </div>
      </section>

      <section className="border-b border-stone-200 bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-red-800">
              Inside Apex
            </p>

            <h2 className="mt-4 text-3xl font-black uppercase tracking-tight text-stone-950 sm:text-5xl">
              {galleryTitle}
            </h2>

            <div className="mx-auto mt-6 h-1 w-16 bg-red-800" />
          </div>

          {galleryLoading ? (
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="aspect-[4/3] animate-pulse rounded-sm bg-stone-200"
                />
              ))}
            </div>
          ) : galleryImages.length > 0 ? (
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {galleryImages.map((image, index) => (
                <figure
                  key={image.id}
                  className="group relative aspect-[4/3] overflow-hidden rounded-sm bg-stone-200 shadow-sm"
                >
                  <img
                    src={image.image_url}
                    alt={`${galleryTitle} image ${index + 1}`}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                </figure>
              ))}
            </div>
          ) : (
            <div className="mt-12 rounded-sm border border-dashed border-stone-300 bg-stone-50 px-6 py-14 text-center">
              <p className="text-base font-semibold text-stone-700">
                Gallery pictures will appear here after they are added in Shop
                Settings.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="bg-stone-100 py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-12">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-red-800">
              Our Commitment
            </p>

            <h2 className="mt-4 text-4xl font-black uppercase leading-tight tracking-tight text-stone-950 sm:text-5xl">
              Quality You Can Trust
            </h2>

            <div className="mt-6 h-1 w-16 bg-red-800" />

            <p className="mt-8 max-w-2xl text-lg leading-8 text-stone-700">
              At Apex Custom Butchering, every animal is handled with care and
              every order is processed with precision. We focus on clean work,
              dependable communication, and cuts prepared to your instructions.
            </p>

            <p className="mt-5 max-w-2xl leading-7 text-stone-600">
              From scheduling through pickup, our goal is straightforward:
              provide honest service and quality processing your family can rely
              on.
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/schedule"
                className="inline-flex items-center justify-center gap-3 rounded-md bg-red-800 px-7 py-4 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-red-700"
              >
                <CalendarIcon />
                Schedule Processing
              </Link>

              <a
                href={phoneHref}
                className="inline-flex items-center justify-center gap-3 rounded-md border border-stone-400 bg-white px-7 py-4 text-sm font-bold uppercase tracking-[0.12em] text-stone-900 transition hover:border-stone-900"
              >
                <PhoneIcon />
                {shopInformation.phone}
              </a>
            </div>
          </div>

          <div className="relative min-h-[440px] overflow-hidden rounded-sm bg-stone-300 shadow-xl">
            <img
              src="/images/-beef.jpg"
              alt="Custom meat processing at Apex Custom Butchering"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-7 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-stone-200">
                Local Service
              </p>
              <p className="mt-2 text-2xl font-bold">
                Careful work from start to finish.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="grid gap-8 md:grid-cols-3">
            <article className="border-t-4 border-red-800 bg-stone-50 p-8 shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-800 text-white">
                <KnifeIcon />
              </div>
              <h3 className="mt-6 text-xl font-black uppercase tracking-tight text-stone-950">
                Custom Cuts
              </h3>
              <p className="mt-3 leading-7 text-stone-600">
                Your order is processed according to the cut instructions you
                provide, not a one-size-fits-all list.
              </p>
            </article>

            <article className="border-t-4 border-red-800 bg-stone-50 p-8 shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-800 text-white">
                <ShieldIcon />
              </div>
              <h3 className="mt-6 text-xl font-black uppercase tracking-tight text-stone-950">
                Careful Handling
              </h3>
              <p className="mt-3 leading-7 text-stone-600">
                Clean procedures, organized tracking, and careful attention help
                protect the quality of every order.
              </p>
            </article>

            <article className="border-t-4 border-red-800 bg-stone-50 p-8 shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-800 text-white">
                <HandsIcon />
              </div>
              <h3 className="mt-6 text-xl font-black uppercase tracking-tight text-stone-950">
                Dependable Service
              </h3>
              <p className="mt-3 leading-7 text-stone-600">
                Straightforward scheduling and clear communication keep the
                process simple from drop-off to pickup.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-red-900 py-16 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-6 text-center sm:px-8 lg:flex-row lg:px-12 lg:text-left">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-red-200">
              Ready to Get Scheduled?
            </p>
            <h2 className="mt-3 text-3xl font-black uppercase tracking-tight sm:text-4xl">
              Reserve Your Processing Date
            </h2>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/schedule"
              className="inline-flex items-center justify-center gap-3 rounded-md bg-white px-7 py-4 text-sm font-bold uppercase tracking-[0.12em] text-red-900 transition hover:bg-stone-100"
            >
              <CalendarIcon />
              Schedule Now
            </Link>

            <a
              href={phoneHref}
              className="inline-flex items-center justify-center gap-3 rounded-md border border-white/70 px-7 py-4 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-white hover:text-red-900"
            >
              <PhoneIcon />
              Call Now
            </a>
          </div>
        </div>
      </section>

      <footer className="bg-stone-950 py-12 text-stone-300">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 sm:px-8 md:grid-cols-3 lg:px-12">
          <div>
            <img
              src="/images/apex-logo.png"
              alt={`${shopInformation.name} logo`}
              className="h-auto w-44 opacity-85"
            />
          </div>

          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white">
              Contact
            </h2>
            <a
              href={phoneHref}
              className="mt-4 block transition hover:text-white"
            >
              {shopInformation.phone}
            </a>
            <p className="mt-2 leading-6">{shopInformation.address}</p>
          </div>

          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white">
              Scheduling
            </h2>
            <p className="mt-4 leading-6">
              Use the online scheduler to reserve an available processing time.
            </p>
            <Link
              href="/schedule"
              className="mt-4 inline-block font-semibold text-white underline decoration-red-700 decoration-2 underline-offset-4"
            >
              Schedule Processing
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-7xl border-t border-white/10 px-6 pt-6 text-sm text-stone-500 sm:px-8 lg:px-12">
          © {new Date().getFullYear()} {shopInformation.name}. All rights
          reserved.
        </div>
      </footer>
    </main>
  );
}