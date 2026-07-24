"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../supabase";

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

type ProcessingDay = {
  day: string;
};

type GalleryImage = {
  id: string;
  image_url: string;
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
          const value = row.setting_value as {
            title?: string;
          };

          setGalleryTitle(value.title || "Our Gallery");
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
    async function handleGalleryUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploadingGalleryImage(true);
    setMessage("");

    try {
      const fileExtension =
        file.name.split(".").pop() || "jpg";

      const storagePath =
        `gallery/${crypto.randomUUID()}.${fileExtension}`;

      const { error: uploadError } = await supabase.storage
        .from("gallery")
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } =
        supabase.storage
          .from("gallery")
          .getPublicUrl(storagePath);

      const imageUrl = publicUrlData.publicUrl;

      const { data: insertedImage, error: insertError } =
        await supabase
          .from("gallery_images")
          .insert({
            image_url: imageUrl,
            storage_path: storagePath,
          })
          .select("id, image_url, storage_path")
          .single();

      if (insertError) {
        await supabase.storage
          .from("gallery")
          .remove([storagePath]);

        throw insertError;
      }

      setGalleryImages((current) => [
        ...current,
        insertedImage,
      ]);

      setMessage("Gallery image added successfully.");
      event.target.value = "";
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to upload gallery image."
      );
    } finally {
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
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Homepage Gallery
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Edit the gallery title and manage the pictures shown
                on the homepage.
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
              <label className="inline-flex cursor-pointer items-center rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
                {uploadingGalleryImage
                  ? "Uploading..."
                  : "Add Picture"}

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={uploadingGalleryImage}
                  onChange={handleGalleryUpload}
                  className="sr-only"
                />
              </label>

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