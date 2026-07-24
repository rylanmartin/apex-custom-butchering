"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../supabase";

type DropoffPickerProps = {
  dropoffDate: string;
  setDropoffDate: (value: string) => void;
  dropoffTime: string;
  setDropoffTime: (value: string) => void;
};

const mondayTimes = [
  "4:00 PM",
  "4:15 PM",
  "4:30 PM",
  "4:45 PM",
  "5:00 PM",
  "5:15 PM",
  "5:30 PM",
];

const fallbackTuesdayTimes = [
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

function readStringArray(value: unknown, objectKeys: string[]) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;

    for (const key of objectKeys) {
      const possibleArray = record[key];

      if (Array.isArray(possibleArray)) {
        return possibleArray.filter(
          (item): item is string => typeof item === "string"
        );
      }
    }
  }

  return [];
}

function formatTuesdayTimeRange(times: string[]) {
  if (times.length === 0) {
    return "Tuesday morning";
  }

  if (times.length === 1) {
    return `Tuesday at ${times[0]}`;
  }

  return `Tuesday ${times[0]}-${times[times.length - 1]}`;
}

export default function DropoffPicker({
  dropoffDate,
  setDropoffDate,
  dropoffTime,
  setDropoffTime,
}: DropoffPickerProps) {
  const [tuesdayTimes, setTuesdayTimes] = useState(fallbackTuesdayTimes);
  const [closedDates, setClosedDates] = useState<string[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsMessage, setSettingsMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSchedulingSettings() {
      setSettingsLoading(true);
      setSettingsMessage("");

      const { data, error } = await supabase
        .from("shop_settings")
        .select("setting_key, setting_value")
        .in("setting_key", ["tuesday_times", "closed_dates"]);

      if (!active) return;

      if (error) {
        console.error(error);
        setSettingsMessage(
          "Could not load scheduling settings. Default Tuesday times are being used."
        );
        setSettingsLoading(false);
        return;
      }

      const timeSetting = data?.find(
        (row) => row.setting_key === "tuesday_times"
      )?.setting_value;

      const closedDateSetting = data?.find(
        (row) => row.setting_key === "closed_dates"
      )?.setting_value;

      const savedTimes = readStringArray(timeSetting, ["times", "values"]);
      const savedClosedDates = readStringArray(closedDateSetting, [
        "dates",
        "values",
      ]);

      if (savedTimes.length > 0) {
        setTuesdayTimes(savedTimes);
      }

      setClosedDates(savedClosedDates);
      setSettingsLoading(false);
    }

    void loadSchedulingSettings();

    return () => {
      active = false;
    };
  }, []);

  const closedDateSet = useMemo(() => new Set(closedDates), [closedDates]);

  const availableTimes = useMemo(() => {
    if (!dropoffDate) return [];

    const [year, month, day] = dropoffDate.split("-").map(Number);
    const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

    if (weekday === 1) return mondayTimes;
    if (weekday === 2) return tuesdayTimes;

    return [];
  }, [dropoffDate, tuesdayTimes]);

  function handleDateChange(value: string) {
    if (!value) {
      setDropoffDate("");
      setDropoffTime("");
      return;
    }

    const [year, month, day] = value.split("-").map(Number);
    const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

    if (weekday !== 1 && weekday !== 2) {
      alert("Drop-off is only available Monday evening or Tuesday morning.");
      setDropoffDate("");
      setDropoffTime("");
      return;
    }

    if (closedDateSet.has(value)) {
      alert("The shop is closed on that date. Please choose another Monday or Tuesday.");
      setDropoffDate("");
      setDropoffTime("");
      return;
    }

    setDropoffDate(value);
    setDropoffTime("");
  }

  return (
    <section className="rounded-xl border p-6">
      <h2 className="mb-4 text-2xl font-bold">2. Choose Drop-Off</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block font-semibold">Drop-Off Date</label>
          <input
            type="date"
            value={dropoffDate}
            onChange={(event) => handleDateChange(event.target.value)}
            className="w-full rounded-lg border px-4 py-3"
          />
          <p className="mt-2 text-sm text-gray-600">
            Monday 4:00 PM-5:30 PM or {formatTuesdayTimeRange(tuesdayTimes)}.
          </p>
        </div>

        <div>
          <label className="mb-2 block font-semibold">Drop-Off Time</label>
          <select
            value={dropoffTime}
            disabled={!dropoffDate || settingsLoading || availableTimes.length === 0}
            onChange={(event) => setDropoffTime(event.target.value)}
            className="w-full rounded-lg border px-4 py-3 disabled:bg-gray-100"
          >
            <option value="">
              {settingsLoading ? "Loading times..." : "Select time"}
            </option>
            {availableTimes.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>
      </div>

      {settingsMessage && (
        <div className="mt-4 rounded-lg bg-yellow-100 p-3 text-sm font-bold text-yellow-900">
          {settingsMessage}
        </div>
      )}
    </section>
  );
}