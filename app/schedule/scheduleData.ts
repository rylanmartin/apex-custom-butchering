export const animalTypes = ["Beef", "Pork", "Sheep", "Goat"];

export const mondayTimes = [
  "4:00 PM",
  "4:15 PM",
  "4:30 PM",
  "4:45 PM",
  "5:00 PM",
  "5:15 PM",
  "5:30 PM",
];

export const tuesdayTimes = [
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

export function getTimesForDate(dateValue: string) {
  if (!dateValue) return [];

  const date = new Date(`${dateValue}T00:00:00`);
  const day = date.getDay();

  if (day === 1) return mondayTimes;
  if (day === 2) return tuesdayTimes;

  return [];
}