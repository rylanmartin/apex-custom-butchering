"use client";

import Image from "next/image";

type AnimalSelectorProps = {
  animalType: string;
  setAnimalType: (value: string) => void;
};

const animals = [
  { name: "Beef", image: "/images/-beef.jpg" },
  { name: "Pork", image: "/images/-pork.jpg" },
  { name: "Sheep", image: "/images/-sheep.jpg" },
  { name: "Goat", image: "/images/-goat.jpg" },
];

export default function AnimalSelector({
  animalType,
  setAnimalType,
}: AnimalSelectorProps) {
  return (
    <section className="rounded-2xl border bg-white p-8 shadow">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-700 text-xl font-bold text-white">
          1
        </div>

        <div>
          <h2 className="text-3xl font-bold">Choose Animal</h2>
          <p className="text-gray-600">
            Select the type of animal you are bringing in.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {animals.map((animal) => {
          const selected = animal.name === animalType;

          return (
            <button
              key={animal.name}
              type="button"
              onClick={() => setAnimalType(animal.name)}
              className={`group relative h-[420px] overflow-hidden rounded-3xl border-2 text-white shadow-sm transition-all duration-300 ${
                selected
                  ? "scale-[1.02] border-red-700 shadow-2xl"
                  : "border-gray-200 hover:-translate-y-1 hover:border-red-500 hover:shadow-xl"
              }`}
            >
              <Image
                src={animal.image}
                alt={animal.name}
                fill
                className="object-cover transition duration-500 group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

              <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center">
                <h3 className="text-4xl font-black text-white drop-shadow-lg">
                  {animal.name}
                </h3>

                <div
                  className={`mx-auto mt-5 flex h-12 w-12 items-center justify-center rounded-full border-2 text-xl font-bold transition-all duration-300 ${
                    selected
                      ? "scale-110 border-red-700 bg-red-700 text-white"
                      : "border-white bg-white/10 text-transparent group-hover:bg-white/20"
                  }`}
                >
                  ✓
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}