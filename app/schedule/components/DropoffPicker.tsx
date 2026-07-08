import { getTimesForDate } from "../scheduleData";

type DropoffPickerProps = {
  dropoffDate: string;
  setDropoffDate: (value: string) => void;
  dropoffTime: string;
  setDropoffTime: (value: string) => void;
};

export default function DropoffPicker({
  dropoffDate,
  setDropoffDate,
  dropoffTime,
  setDropoffTime,
}: DropoffPickerProps) {
  const availableTimes = getTimesForDate(dropoffDate);

  function handleDateChange(value: string) {
    const date = new Date(`${value}T00:00:00`);
    const day = date.getDay();

    if (day !== 1 && day !== 2) {
      alert("Drop-off is only available Monday evening or Tuesday morning.");
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
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full rounded-lg border px-4 py-3"
          />
          <p className="mt-2 text-sm text-gray-600">
            Monday 4:00 PM-5:30 PM or Tuesday 7:00 AM-9:00 AM.
          </p>
        </div>

        <div>
          <label className="mb-2 block font-semibold">Drop-Off Time</label>
          <select
            value={dropoffTime}
            onChange={(e) => setDropoffTime(e.target.value)}
            className="w-full rounded-lg border px-4 py-3"
          >
            <option value="">Select time</option>
            {availableTimes.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}