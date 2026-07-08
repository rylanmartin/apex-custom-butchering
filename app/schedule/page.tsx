"use client";

import { useState } from "react";

import ProgressBar from "./components/ProgressBar";
import AnimalSelector from "./components/AnimalSelector";
import DropoffPicker from "./components/DropoffPicker";
import CustomerInfo from "./components/CustomerInfo";
import FarmerBooking from "./components/FarmerBooking";

export default function SchedulePage() {
  const [animalType, setAnimalType] = useState("");

  const [dropoffDate, setDropoffDate] = useState("");
  const [dropoffTime, setDropoffTime] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  const [bookingType, setBookingType] = useState<
    "individual" | "farmer"
  >("individual");

  const currentStep = !animalType
    ? 1
    : !dropoffDate
    ? 2
    : 3;

  return (
    <main className="min-h-screen bg-gray-100 py-12">
      <div className="mx-auto max-w-7xl px-6">

        <ProgressBar step={currentStep} />

        <h1 className="mb-2 text-5xl font-black">
          Schedule Processing
        </h1>

        <p className="mb-10 text-lg text-gray-600">
          Schedule your animal drop-off in a few simple steps.
        </p>

        <AnimalSelector
          animalType={animalType}
          setAnimalType={setAnimalType}
        />

        {animalType && (
          <>
            <div className="my-8" />

            <DropoffPicker
              dropoffDate={dropoffDate}
              setDropoffDate={setDropoffDate}
              dropoffTime={dropoffTime}
              setDropoffTime={setDropoffTime}
            />
          </>
        )}

        {animalType === "Beef" && dropoffDate && (
          <>
            <div className="my-8" />

            <section className="rounded-2xl bg-white p-8 shadow">

              <h2 className="mb-6 text-3xl font-bold">
                Booking Type
              </h2>

              <div className="grid gap-6 md:grid-cols-2">

                <button
                  type="button"
                  onClick={() => setBookingType("individual")}
                  className={`rounded-xl border p-6 text-xl font-bold transition ${
                    bookingType === "individual"
                      ? "bg-red-700 text-white"
                      : "hover:bg-gray-100"
                  }`}
                >
                  Individual Customer
                </button>

                <button
                  type="button"
                  onClick={() => setBookingType("farmer")}
                  className={`rounded-xl border p-6 text-xl font-bold transition ${
                    bookingType === "farmer"
                      ? "bg-red-700 text-white"
                      : "hover:bg-gray-100"
                  }`}
                >
                  Farmer Booking
                </button>

              </div>

            </section>
          </>
        )}

        {animalType &&
          dropoffDate &&
          (animalType !== "Beef" ||
            bookingType === "individual") && (
            <>
              <div className="my-8" />

              <CustomerInfo
                customerName={customerName}
                setCustomerName={setCustomerName}
                customerPhone={customerPhone}
                setCustomerPhone={setCustomerPhone}
                customerEmail={customerEmail}
                setCustomerEmail={setCustomerEmail}
              />
            </>
        )}

        {animalType === "Beef" &&
          bookingType === "farmer" &&
          dropoffDate && (
            <>
              <div className="my-8" />

              <FarmerBooking />
            </>
        )}

      </div>
    </main>
  );
}