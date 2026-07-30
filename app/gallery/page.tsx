"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";

const supabase = createClient();
type GalleryImage = { id: string; image_url: string };

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    async function loadGallery() {
      const { data, error } = await supabase.from("gallery_images").select("id, image_url").order("created_at", { ascending: true });
      if (error) console.error(error);
      else setImages(data ?? []);
      setLoading(false);
    }
    void loadGallery();
  }, []);

  function previousImage() {
    if (selectedIndex === null || !images.length) return;
    setSelectedIndex((selectedIndex - 1 + images.length) % images.length);
  }

  function nextImage() {
    if (selectedIndex === null || !images.length) return;
    setSelectedIndex((selectedIndex + 1) % images.length);
  }

  return (
    <main className="min-h-screen bg-stone-100 text-stone-950">
      <header className="bg-stone-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-6 sm:px-8 lg:px-12">
          <div><p className="text-xs font-bold uppercase tracking-[0.3em] text-red-400">Apex Custom Butchering</p><h1 className="mt-2 text-3xl font-black uppercase tracking-tight">Our Gallery</h1></div>
          <Link href="/#gallery" className="rounded-md border border-white/30 px-4 py-3 text-sm font-bold transition hover:bg-white hover:text-stone-950">Back to Website</Link>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-12">
        {loading ? <div className="h-80 animate-pulse rounded-lg bg-stone-200" /> : images.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((image, index) => (
              <button key={image.id} type="button" onClick={() => setSelectedIndex(index)} className="group aspect-[4/3] overflow-hidden rounded-lg bg-stone-200 shadow-sm">
                <img src={image.image_url} alt={`Apex gallery image ${index + 1}`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              </button>
            ))}
          </div>
        ) : <div className="rounded-lg border border-dashed border-stone-300 bg-white px-6 py-16 text-center text-stone-600">No gallery pictures have been added yet.</div>}
      </section>
      {selectedIndex !== null && images[selectedIndex] ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" role="dialog" aria-modal="true">
          <button type="button" onClick={() => setSelectedIndex(null)} className="absolute right-5 top-5 rounded-md bg-white/10 px-4 py-2 font-bold text-white hover:bg-white hover:text-black">Close</button>
          <button type="button" onClick={previousImage} className="absolute left-3 rounded-full bg-white/15 px-4 py-3 text-2xl font-black text-white hover:bg-white hover:text-black sm:left-8">‹</button>
          <img src={images[selectedIndex].image_url} alt={`Apex gallery image ${selectedIndex + 1}`} className="max-h-[85vh] max-w-[88vw] object-contain" />
          <button type="button" onClick={nextImage} className="absolute right-3 rounded-full bg-white/15 px-4 py-3 text-2xl font-black text-white hover:bg-white hover:text-black sm:right-8">›</button>
          <p className="absolute bottom-5 text-sm font-bold text-white">{selectedIndex + 1} of {images.length}</p>
        </div>
      ) : null}
    </main>
  );
}