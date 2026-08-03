"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "../../../lib/supabase/client";

const supabase = createClient();

type WeeklyCapacity = {
  beef: number;
  pork: number;
  sheep: number;
  goat: number;
};

type ShopInformation = {
  name: string;
  phone: string;
  address: string;
};

type ShopLink = {
  id: string;
  label: string;
  url: string;
};

type ProcessingDay = {
  day: string;
};

type GalleryImage = {
  id: string;
  image_url: string;
  storage_path: string | null;
};

type PricingCategory = "beef" | "pork" | "goat-sheep" | "deer";

type PricingItem = {
  id: string;
  item: string;
  price: string;
  category: PricingCategory;
};

const pricingSections: Array<{ id: PricingCategory; label: string }> = [
  { id: "beef", label: "Beef" },
  { id: "pork", label: "Pork" },
  { id: "goat-sheep", label: "Goat & Sheep" },
  { id: "deer", label: "Deer" },
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

type PublicCutSheet = {
  id: string;
  title: string;
  file_url: string;
  storage_path: string | null;
};

const defaultTimes = [
  "7:00 AM",
  "7:15 AM",
  "7:30 AM",
  "7:45 AM",
  "8:00 AM",
  "8:15 AM",
  "8:30 AM",
  "8:45 AM",
  "9:00 AM",
];

const processingDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [weeklyCapacity, setWeeklyCapacity] =
    useState<WeeklyCapacity>({
      beef: 15,
      pork: 6,
      sheep: 20,
      goat: 20,
    });

  const [shopInformation, setShopInformation] =
    useState<ShopInformation>({
      name: "Apex Custom Butchering",
      phone: "(989) 323-1187",
      address: "155 W Henderson Rd. Owosso, MI 48867",
    });

  const [shopLinks, setShopLinks] = useState<ShopLink[]>([]);

  const [pickupMessage, setPickupMessage] = useState(
    "Hello [Customer Name], your animal is processed and ready for pickup at Apex Custom Butchering. Please give us two days to get your meat completely frozen. If you could bring coolers or boxes to put your meat in, that would be great. We are looking forward to seeing you soon!"
  );

  const [tuesdayTimes, setTuesdayTimes] =
    useState<string[]>(defaultTimes);

  const [processingDay, setProcessingDay] =
    useState<ProcessingDay>({
      day: "Tuesday",
    });

  const [closedDates, setClosedDates] =
    useState<string[]>([]);

  const [galleryTitle, setGalleryTitle] =
    useState("Our Gallery");

  const [galleryImages, setGalleryImages] =
    useState<GalleryImage[]>([]);

  const [uploadingGalleryImage, setUploadingGalleryImage] =
    useState(false);

  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const cutSheetFileInputRef = useRef<HTMLInputElement>(null);

  const [pricingItems, setPricingItems] = useState<PricingItem[]>([]);
  const [cutSheets, setCutSheets] = useState<PublicCutSheet[]>([]);
  const [newCutSheetTitle, setNewCutSheetTitle] = useState("");
  const [uploadingCutSheet, setUploadingCutSheet] = useState(false);

  const sortedClosedDates = useMemo(
    () => [...closedDates].sort(),
    [closedDates]
  );

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      setMessage("");

      const [settingsResult, galleryResult] =
        await Promise.all([
          supabase
            .from("shop_settings")
            .select("setting_key, setting_value"),

          supabase
            .from("gallery_images")
            .select("id, image_url, storage_path")
            .order("created_at", { ascending: true }),
        ]);

      const { data, error } = settingsResult;

      const {
        data: galleryData,
        error: galleryError,
      } = galleryResult;

      if (error) {
        console.error(error);
        setMessage(`Settings error: ${error.message}`);
        setLoading(false);
        return;
      }

      for (const row of data || []) {
        if (row.setting_key === "weekly_capacity") {
          const value =
            row.setting_value as Partial<WeeklyCapacity>;

          setWeeklyCapacity({
            beef: value.beef ?? 15,
            pork: value.pork ?? 6,
            sheep: value.sheep ?? 20,
            goat: value.goat ?? 20,
          });
        }

        if (row.setting_key === "shop_information") {
          setShopInformation(
            row.setting_value as ShopInformation
          );
        }

        if (row.setting_key === "shop_links") {
          setShopLinks(
            Array.isArray(row.setting_value)
              ? (row.setting_value as ShopLink[])
              : []
          );
        }

        if (row.setting_key === "pickup_message") {
          const value = row.setting_value as {
            message?: string;
          };

          setPickupMessage(value.message || "");
        }

        if (row.setting_key === "tuesday_times") {
          setTuesdayTimes(
            Array.isArray(row.setting_value)
              ? (row.setting_value as string[])
              : defaultTimes
          );
        } 
               if (row.setting_key === "processing_day") {
          const value = row.setting_value as ProcessingDay;

          setProcessingDay({
            day: value.day || "Tuesday",
          });
        }

        if (row.setting_key === "closed_dates") {
          setClosedDates(
            Array.isArray(row.setting_value)
              ? (row.setting_value as string[])
              : []
          );
        }

        if (row.setting_key === "gallery_title") {
          const value = row.setting_value as { title?: string };
          setGalleryTitle(value.title || "Our Gallery");
        }

        if (row.setting_key === "pricing_items") {
          setPricingItems(normalizePricingItems(row.setting_value));
        }

        if (row.setting_key === "public_cut_sheets") {
          setCutSheets(
            Array.isArray(row.setting_value)
              ? (row.setting_value as PublicCutSheet[])
              : []
          );
        }
      }

      if (galleryError) {
        console.error(galleryError);
        setMessage(
          `Gallery error: ${galleryError.message}`
        );
      } else {
        setGalleryImages(galleryData || []);
      }

      setLoading(false);
    }

    loadSettings();
  }, []);

  async function saveSetting(
    settingKey: string,
    settingValue: unknown
  ) {
    const { error } = await supabase
      .from("shop_settings")
      .upsert(
        {
          setting_key: settingKey,
          setting_value: settingValue,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "setting_key",
        }
      );

    if (error) {
      throw error;
    }
  }

  async function handleSaveSettings() {
    setSaving(true);
    setMessage("");

    try {
      await Promise.all([
        saveSetting(
          "weekly_capacity",
          weeklyCapacity
        ),
        saveSetting(
          "shop_information",
          shopInformation
        ),
        saveSetting("shop_links", shopLinks),
        saveSetting("pickup_message", {
          message: pickupMessage,
        }),
        saveSetting(
          "tuesday_times",
          tuesdayTimes
        ),
        saveSetting(
          "processing_day",
          processingDay
        ),
        saveSetting(
          "closed_dates",
          closedDates
        ),
        saveSetting("gallery_title", {
          title: galleryTitle,
        }),
        saveSetting("pricing_items", pricingItems),
        saveSetting("public_cut_sheets", cutSheets),
      ]);

      setMessage("Settings saved successfully.");
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save settings."
      );
    } finally {
      setSaving(false);
    }
  }

  function updateCapacity(
    animal: keyof WeeklyCapacity,
    value: string
  ) {
    setWeeklyCapacity((current) => ({
      ...current,
      [animal]: Math.max(
        0,
        Number.parseInt(value, 10) || 0
      ),
    }));
  }

  function updateShopInformation(
    field: keyof ShopInformation,
    value: string
  ) {
    setShopInformation((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function addShopLink() {
    setShopLinks((current) => [
      ...current,
      { id: crypto.randomUUID(), label: "", url: "" },
    ]);
  }

  function updateShopLink(
    id: string,
    field: "label" | "url",
    value: string
  ) {
    setShopLinks((current) =>
      current.map((link) =>
        link.id === id ? { ...link, [field]: value } : link
      )
    );
  }

  function removeShopLink(id: string) {
    setShopLinks((current) =>
      current.filter((link) => link.id !== id)
    );
  }

  function updateTuesdayTime(
    index: number,
    value: string
  ) {
    setTuesdayTimes((current) =>
      current.map((time, currentIndex) =>
        currentIndex === index ? value : time
      )
    );
  }

  function addTuesdayTime() {
    setTuesdayTimes((current) => [
      ...current,
      "",
    ]);
  }

  function removeTuesdayTime(index: number) {
    setTuesdayTimes((current) =>
      current.filter(
        (_, currentIndex) =>
          currentIndex !== index
      )
    );
  }

  function addClosedDate(value: string) {
    if (!value) {
      return;
    }

    setClosedDates((current) => {
      if (current.includes(value)) {
        return current;
      }

      return [...current, value];
    });
  }

  function removeClosedDate(date: string) {
    setClosedDates((current) =>
      current.filter(
        (currentDate) =>
          currentDate !== date
      )
    );
  }
    async function loadGalleryImages() {
    const { data, error } = await supabase
      .from("gallery_images")
      .select("id, image_url, storage_path")
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    setGalleryImages(data || []);
  }

  async function handleGalleryUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setMessage("Please choose a JPG, PNG, or WebP image.");
      input.value = "";
      return;
    }

    setUploadingGalleryImage(true);
    setMessage("");

    let storagePath = "";

    try {
      const fileExtension =
        file.name.split(".").pop()?.toLowerCase() || "jpg";

      storagePath = `gallery/${crypto.randomUUID()}.${fileExtension}`;

      const { error: uploadError } = await supabase.storage
        .from("gallery")
        .upload(storagePath, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from("gallery")
        .getPublicUrl(storagePath);

      const imageUrl = publicUrlData.publicUrl;

      const { error: insertError } = await supabase
        .from("gallery_images")
        .insert({
          image_url: imageUrl,
          storage_path: storagePath,
        });

      if (insertError) {
        await supabase.storage.from("gallery").remove([storagePath]);
        throw insertError;
      }

      await loadGalleryImages();
      setMessage("Gallery image added successfully.");
    } catch (error) {
      console.error("Gallery upload failed:", error);

      setMessage(
        error instanceof Error
          ? `Gallery upload failed: ${error.message}`
          : "Unable to upload gallery image."
      );
    } finally {
      input.value = "";
      setUploadingGalleryImage(false);
    }
  }

  async function handleDeleteGalleryImage(
    image: GalleryImage
  ) {
    const confirmed = window.confirm(
      "Delete this gallery image?"
    );

    if (!confirmed) {
      return;
    }

    setMessage("");

    try {
      const { error: deleteError } = await supabase
        .from("gallery_images")
        .delete()
        .eq("id", image.id);

      if (deleteError) {
        throw deleteError;
      }

      if (image.storage_path) {
        const { error: storageError } =
          await supabase.storage
            .from("gallery")
            .remove([image.storage_path]);

        if (storageError) {
          console.error(storageError);
        }
      }

      setGalleryImages((current) =>
        current.filter(
          (galleryImage) =>
            galleryImage.id !== image.id
        )
      );

      setMessage("Gallery image deleted.");
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to delete gallery image."
      );
    }
  }

  function addPricingItem(category: PricingCategory) {
    setPricingItems((current) => [
      ...current,
      { id: crypto.randomUUID(), item: "", price: "", category },
    ]);
  }

  function updatePricingItem(
    id: string,
    field: "item" | "price",
    value: string
  ) {
    setPricingItems((current) =>
      current.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    );
  }

  function removePricingItem(id: string) {
    setPricingItems((current) =>
      current.filter((entry) => entry.id !== id)
    );
  }

  async function saveCutSheets(nextCutSheets: PublicCutSheet[]) {
    await saveSetting("public_cut_sheets", nextCutSheets);
    setCutSheets(nextCutSheets);
  }

  async function handleCutSheetUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      setMessage("Please choose a PDF file.");
      input.value = "";
      return;
    }

    if (!newCutSheetTitle.trim()) {
      setMessage("Enter a cut sheet title before choosing the PDF.");
      input.value = "";
      return;
    }

    setUploadingCutSheet(true);
    setMessage("");
    let storagePath = "";

    try {
      const safeName = file.name
        .toLowerCase()
        .replace(/[^a-z0-9.]+/g, "-")
        .replace(/^-+|-+$/g, "");

      storagePath = `cut-sheets/${crypto.randomUUID()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(storagePath, file, {
          cacheControl: "3600",
          contentType: "application/pdf",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("documents")
        .getPublicUrl(storagePath);

      const nextCutSheets = [
        ...cutSheets,
        {
          id: crypto.randomUUID(),
          title: newCutSheetTitle.trim(),
          file_url: publicUrlData.publicUrl,
          storage_path: storagePath,
        },
      ];

      await saveCutSheets(nextCutSheets);
      setNewCutSheetTitle("");
      setMessage("Cut sheet PDF uploaded successfully.");
    } catch (error) {
      if (storagePath) {
        await supabase.storage.from("documents").remove([storagePath]);
      }

      console.error(error);
      setMessage(
        error instanceof Error
          ? `Cut sheet upload failed: ${error.message}`
          : "Unable to upload the cut sheet PDF."
      );
    } finally {
      input.value = "";
      setUploadingCutSheet(false);
    }
  }

  async function handleDeleteCutSheet(sheet: PublicCutSheet) {
    const confirmed = window.confirm(
      `Delete ${sheet.title}? This removes it from the website.`
    );

    if (!confirmed) return;

    setMessage("");

    try {
      const nextCutSheets = cutSheets.filter(
        (current) => current.id !== sheet.id
      );

      await saveCutSheets(nextCutSheets);

      if (sheet.storage_path) {
        const { error } = await supabase.storage
          .from("documents")
          .remove([sheet.storage_path]);

        if (error) console.error(error);
      }

      setMessage("Cut sheet deleted.");
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to delete the cut sheet."
      );
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <p className="text-slate-600">
              Loading settings...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-700">
              Apex Custom Butchering
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Shop Settings
            </h1>

            <p className="mt-2 text-slate-600">
              Manage scheduling, capacity, customer messages,
              closures, and the homepage gallery.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={saving}
            className="rounded-lg bg-red-800 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save All Settings"}
          </button>
        </div>

        {message ? (
          <div className="mb-6 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
            {message}
          </div>
        ) : null}

        <div className="grid gap-6">
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Weekly Capacity
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Set the maximum number of animals that can be
                scheduled each week.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Beef
                </span>

                <input
                  type="number"
                  min="0"
                  value={weeklyCapacity.beef}
                  onChange={(event) =>
                    updateCapacity(
                      "beef",
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-red-700 focus:ring-2 focus:ring-red-100"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Pork
                </span>

                <input
                  type="number"
                  min="0"
                  value={weeklyCapacity.pork}
                  onChange={(event) =>
                    updateCapacity(
                      "pork",
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-red-700 focus:ring-2 focus:ring-red-100"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Sheep
                </span>

                <input
                  type="number"
                  min="0"
                  value={weeklyCapacity.sheep}
                  onChange={(event) =>
                    updateCapacity(
                      "sheep",
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-red-700 focus:ring-2 focus:ring-red-100"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Goats
                </span>

                <input
                  type="number"
                  min="0"
                  value={weeklyCapacity.goat}
                  onChange={(event) =>
                    updateCapacity(
                      "goat",
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-red-700 focus:ring-2 focus:ring-red-100"
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Shop Information
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                This information appears throughout the website.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Business Name
                </span>

                <input
                  type="text"
                  value={shopInformation.name}
                  onChange={(event) =>
                    updateShopInformation(
                      "name",
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-red-700 focus:ring-2 focus:ring-red-100"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Phone Number
                </span>

                <input
                  type="tel"
                  value={shopInformation.phone}
                  onChange={(event) =>
                    updateShopInformation(
                      "phone",
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-red-700 focus:ring-2 focus:ring-red-100"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Address
                </span>

                <input
                  type="text"
                  value={shopInformation.address}
                  onChange={(event) =>
                    updateShopInformation(
                      "address",
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-red-700 focus:ring-2 focus:ring-red-100"
                />
              </label>
            </div>

            <div className="mt-8 border-t border-slate-200 pt-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">Public Links</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Add Instagram, Facebook, or any other link you want customers to see.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addShopLink}
                  className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Add Link
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {shopLinks.map((link) => (
                  <div key={link.id} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[240px_1fr_auto] md:items-end">
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">Link Name</span>
                      <input
                        type="text"
                        value={link.label}
                        onChange={(event) => updateShopLink(link.id, "label", event.target.value)}
                        placeholder="Example: Instagram"
                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">Website Address</span>
                      <input
                        type="url"
                        value={link.url}
                        onChange={(event) => updateShopLink(link.id, "url", event.target.value)}
                        placeholder="https://instagram.com/your-page"
                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => removeShopLink(link.id)}
                      className="rounded-lg border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>

              {shopLinks.length === 0 ? (
                <div className="mt-5 rounded-lg border border-dashed border-slate-300 px-4 py-7 text-center text-sm text-slate-500">
                  No public links have been added yet.
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Ready for Pickup Message
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Copy this message when notifying customers that
                their order is ready.
              </p>
            </div>

            <textarea
              value={pickupMessage}
              onChange={(event) =>
                setPickupMessage(event.target.value)
              }
              rows={7}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-red-700 focus:ring-2 focus:ring-red-100"
            />

            <p className="mt-2 text-xs text-slate-500">
              Use [Customer Name] where the customer&apos;s name
              should appear.
            </p>
          </section>
                    <section className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Processing Schedule
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Choose the processing day and manage the available
                Tuesday appointment times.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Processing Day
                </span>

                <select
                  value={processingDay.day}
                  onChange={(event) =>
                    setProcessingDay({
                      day: event.target.value,
                    })
                  }
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-red-700 focus:ring-2 focus:ring-red-100"
                >
                  {processingDays.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Tuesday Appointment Times
                    </h3>

                    <p className="mt-1 text-sm text-slate-600">
                      Add, remove, or edit the appointment times shown
                      to customers.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addTuesdayTime}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Add Time
                  </button>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {tuesdayTimes.map((time, index) => (
                    <div
                      key={`${index}-${time}`}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={time}
                        placeholder="8:00 AM"
                        onChange={(event) =>
                          updateTuesdayTime(
                            index,
                            event.target.value
                          )
                        }
                        className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-red-700 focus:ring-2 focus:ring-red-100"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          removeTuesdayTime(index)
                        }
                        aria-label={`Remove appointment time ${time}`}
                        className="rounded-lg border border-red-200 px-3 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                {tuesdayTimes.length === 0 ? (
                  <div className="mt-4 rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
                    No Tuesday appointment times have been added.
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Holiday and Shop Closures
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Customers will not be able to schedule appointments
                on these dates.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="block w-full sm:max-w-xs">
                <span className="text-sm font-semibold text-slate-700">
                  Add Closed Date
                </span>

                <input
                  type="date"
                  onChange={(event) => {
                    addClosedDate(event.target.value);
                    event.target.value = "";
                  }}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-red-700 focus:ring-2 focus:ring-red-100"
                />
              </label>
            </div>

            {sortedClosedDates.length > 0 ? (
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {sortedClosedDates.map((date) => (
                  <div
                    key={date}
                    className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <span className="font-medium text-slate-800">
                      {new Date(
                        `${date}T12:00:00`
                      ).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        removeClosedDate(date)
                      }
                      className="text-sm font-semibold text-red-700 transition hover:text-red-900"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                No holiday or closure dates have been added.
              </div>
            )}
          </section>
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Pricing Page</h2>
              <p className="mt-1 text-sm text-slate-600">
                Add as many prices as needed inside each animal section. Customers will open the separate Pricing page to view them.
              </p>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              {pricingSections.map((section) => {
                const sectionItems = pricingItems.filter((entry) => entry.category === section.id);

                return (
                  <div key={section.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                    <div className="flex flex-col gap-3 bg-slate-900 px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-lg font-bold">{section.label} Pricing</h3>
                      <button
                        type="button"
                        onClick={() => addPricingItem(section.id)}
                        className="rounded-lg bg-red-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                      >
                        Add {section.label} Item
                      </button>
                    </div>

                    <div className="space-y-3 p-4">
                      {sectionItems.map((entry) => (
                        <div key={entry.id} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_180px_auto] md:items-end">
                          <label className="block">
                            <span className="text-sm font-semibold text-slate-700">Item or Service</span>
                            <input
                              type="text"
                              value={entry.item}
                              onChange={(event) => updatePricingItem(entry.id, "item", event.target.value)}
                              placeholder={`Example: ${section.label} processing`}
                              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
                            />
                          </label>
                          <label className="block">
                            <span className="text-sm font-semibold text-slate-700">Price</span>
                            <input
                              type="text"
                              value={entry.price}
                              onChange={(event) => updatePricingItem(entry.id, "price", event.target.value)}
                              placeholder="Example: $0.95/lb"
                              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => removePricingItem(entry.id)}
                            className="rounded-lg border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      ))}

                      {sectionItems.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                          No {section.label.toLowerCase()} pricing items have been added.
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Homepage Cut Sheet PDFs</h2>
              <p className="mt-1 text-sm text-slate-600">
                Add a title, upload a PDF, and it will immediately appear in the Cut Sheets section on the homepage.
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Cut Sheet Title</span>
                <input
                  type="text"
                  value={newCutSheetTitle}
                  onChange={(event) => setNewCutSheetTitle(event.target.value)}
                  placeholder="Example: Beef Cut Sheet"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
                />
              </label>

              <div>
                <input
                  ref={cutSheetFileInputRef}
                  type="file"
                  accept="application/pdf"
                  disabled={uploadingCutSheet}
                  onChange={handleCutSheetUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={uploadingCutSheet}
                  onClick={() => cutSheetFileInputRef.current?.click()}
                  className="rounded-lg bg-red-800 px-5 py-3 font-semibold text-white transition hover:bg-red-900 disabled:opacity-60"
                >
                  {uploadingCutSheet ? "Uploading PDF..." : "Choose PDF"}
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {cutSheets.map((sheet) => (
                <div key={sheet.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{sheet.title}</p>
                    <a href={sheet.file_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm font-semibold text-red-700 underline">
                      Open PDF
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteCutSheet(sheet)}
                    className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                  >
                    Delete PDF
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Homepage Gallery
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Edit the gallery title and manage every picture. The homepage shows only the first three; the Full Gallery page shows all of them.
              </p>
            </div>

            <label className="block max-w-xl">
              <span className="text-sm font-semibold text-slate-700">
                Gallery Title
              </span>

              <input
                type="text"
                value={galleryTitle}
                onChange={(event) =>
                  setGalleryTitle(event.target.value)
                }
                placeholder="Our Gallery"
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-red-700 focus:ring-2 focus:ring-red-100"
              />
            </label>

            <div className="mt-6">
              <input
                ref={galleryFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={uploadingGalleryImage}
                onChange={handleGalleryUpload}
                className="hidden"
              />

              <button
                type="button"
                disabled={uploadingGalleryImage}
                onClick={() => galleryFileInputRef.current?.click()}
                className="inline-flex items-center rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploadingGalleryImage ? "Uploading..." : "Add Picture"}
              </button>

              <p className="mt-2 text-xs text-slate-500">
                Accepted formats: JPG, PNG, and WebP.
              </p>
            </div>

            {galleryImages.length > 0 ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {galleryImages.map((image) => (
                  <article
                    key={image.id}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-slate-200">
                      <img
                        src={image.image_url}
                        alt="Apex Custom Butchering gallery"
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="p-3">
                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteGalleryImage(image)
                        }
                        className="w-full rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                      >
                        Delete Picture
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center">
                <p className="font-medium text-slate-700">
                  No gallery pictures have been added.
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Use the Add Picture button to upload the first one.
                </p>
              </div>
            )}
          </section>

          <div className="flex flex-col items-stretch justify-between gap-4 rounded-2xl bg-slate-900 p-6 text-white shadow-sm sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold">
                Save Your Changes
              </h2>

              <p className="mt-1 text-sm text-slate-300">
                Gallery pictures are saved immediately. All other
                settings are saved with this button.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={saving}
              className="rounded-lg bg-red-700 px-6 py-3 font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save All Settings"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
