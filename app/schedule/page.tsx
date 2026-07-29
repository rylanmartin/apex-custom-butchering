"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import { supabase } from "../../supabase";

import ProgressBar from "./components/ProgressBar";
import AnimalSelector from "./components/AnimalSelector";
import DropoffPicker from "./components/DropoffPicker";

import FarmerBooking, {
  createBookingForm,
  type BookingFormValue,
  type SaleType,
} from "./components/FarmerBooking";

type CapacityData = {
  processing_week: string;
  beef_booked: number;
  beef_remaining: number;
  pork_booked: number;
  pork_remaining: number;
};

function getSaleTypeLabel(saleType: SaleType) {
  if (saleType === "halves") {
    return "Halves";
  }

  if (saleType === "quarters") {
    return "Quarters";
  }

  return "Whole";
}

function getPortionFormData(saleType: SaleType) {
  return {
    portion_whole: saleType === "whole",
    portion_half: saleType === "halves",
    portion_quarter: saleType === "quarters",
  };
}

function getProcessingWeek(dropoffDate: string) {
  const [year, month, day] = dropoffDate
    .split("-")
    .map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  if (date.getUTCDay() === 2) {
    date.setUTCDate(date.getUTCDate() - 1);
  }

  return date.toISOString().slice(0, 10);
}

export default function SchedulePage() {
  const [animalType, setAnimalType] = useState("");
  const [dropoffDate, setDropoffDate] = useState("");
  const [dropoffTime, setDropoffTime] = useState("");

  const [bookingData, setBookingData] =
    useState<BookingFormValue>(
      createBookingForm("Beef")
    );

  const [capacity, setCapacity] =
    useState<CapacityData | null>(null);

  const [capacityLoading, setCapacityLoading] =
    useState(false);

  const [capacityError, setCapacityError] =
    useState("");

  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const submitLockRef = useRef(false);

  const currentStep = !animalType
    ? 1
    : !dropoffDate || !dropoffTime
      ? 2
      : 3;

  const loadCapacity = useCallback(
    async (dateValue: string) => {
      if (!dateValue) {
        setCapacity(null);
        setCapacityError("");
        return null;
      }

      setCapacityLoading(true);
      setCapacityError("");

      const { data, error } = await supabase
        .rpc("get_weekly_capacity", {
          p_dropoff_date: dateValue,
        })
        .single();

      setCapacityLoading(false);

      if (error) {
        console.error(error);
        setCapacity(null);
        setCapacityError(
          `Capacity error: ${error.message}`
        );
        return null;
      }

      const result = data as CapacityData;
      setCapacity(result);

      return result;
    },
    []
  );

  useEffect(() => {
    void loadCapacity(dropoffDate);
  }, [dropoffDate, loadCapacity]);

  const handleSetAnimalType: Dispatch<
    SetStateAction<string>
  > = (value) => {
    const nextAnimalType =
      typeof value === "function"
        ? value(animalType)
        : value;

    setAnimalType(nextAnimalType);
    setBookingData(
      createBookingForm(nextAnimalType)
    );
    setMessage("");
    setSubmitted(false);
    submitLockRef.current = false;
  };

  function getRemainingCapacity(
    capacityRow: CapacityData | null
  ) {
    if (!capacityRow) {
      return null;
    }

    if (animalType === "Beef") {
      return capacityRow.beef_remaining;
    }

    if (animalType === "Pork") {
      return capacityRow.pork_remaining;
    }

    return null;
  }

  function validateBooking(
    currentCapacity: CapacityData | null
  ) {
    if (
      !animalType ||
      !dropoffDate ||
      !dropoffTime
    ) {
      return "Please complete the animal type, drop-off date, and drop-off time.";
    }

    if (!bookingData.farmerName.trim()) {
      return "Please enter the farmer or producer name.";
    }

    if (!bookingData.farmerPhone.trim()) {
      return "Please enter the farmer or producer phone number.";
    }

    if (bookingData.animals.length === 0) {
      return "Please add at least one animal.";
    }

    const remaining =
      getRemainingCapacity(currentCapacity);

    if (
      typeof remaining === "number" &&
      bookingData.animals.length > remaining
    ) {
      if (remaining === 0) {
        return `The selected processing week is full for ${animalType.toLowerCase()}.`;
      }

      return `Only ${remaining} ${animalType.toLowerCase()} slot${
        remaining === 1 ? "" : "s"
      } remain for this processing week.`;
    }

    for (
      let animalIndex = 0;
      animalIndex < bookingData.animals.length;
      animalIndex += 1
    ) {
      const animal = bookingData.animals[animalIndex];

      for (
        let customerIndex = 0;
        customerIndex < animal.customers.length;
        customerIndex += 1
      ) {
        const customer =
          animal.customers[customerIndex];

        if (!customer.name.trim()) {
          return `Please enter the name for customer ${
            customerIndex + 1
          } on animal ${animalIndex + 1}.`;
        }

        if (!customer.phone.trim()) {
          return `Please enter the phone number for customer ${
            customerIndex + 1
          } on animal ${animalIndex + 1}.`;
        }
      }
    }

    return "";
  }

  async function handleSubmit() {
    if (saving || submitted || submitLockRef.current) {
      return;
    }

    submitLockRef.current = true;
    setSaving(true);
    setMessage("Checking weekly capacity...");

    const latestCapacity =
      await loadCapacity(dropoffDate);

    const validationMessage =
      validateBooking(latestCapacity);

    if (validationMessage) {
      setMessage(validationMessage);
      submitLockRef.current = false;
      setSaving(false);
      return;
    }

    setMessage("Saving appointment...");

    try {
      const {
        data: farmerCustomer,
        error: farmerCustomerError,
      } = await supabase
        .from("customers")
        .insert({
          name: bookingData.farmerName.trim(),
          phone: bookingData.farmerPhone.trim(),
          email:
            bookingData.farmerEmail.trim() || null,
        })
        .select("id")
        .single();

      if (farmerCustomerError) {
        throw new Error(
          `Farmer information error: ${farmerCustomerError.message}`
        );
      }

      const {
        data: appointment,
        error: appointmentError,
      } = await supabase
        .from("appointments")
        .insert({
          booking_type: "farmer",
          animal_type: animalType.toLowerCase(),
          processing_week:
            getProcessingWeek(dropoffDate),
          dropoff_date: dropoffDate,
          dropoff_time: dropoffTime,
          customer_id: farmerCustomer.id,
        })
        .select("id")
        .single();

      if (appointmentError) {
        throw new Error(
          `Appointment error: ${appointmentError.message}`
        );
      }

      for (
        let animalIndex = 0;
        animalIndex < bookingData.animals.length;
        animalIndex += 1
      ) {
        const animalBooking =
          bookingData.animals[animalIndex];

        const {
          data: animal,
          error: animalError,
        } = await supabase
          .from("animals")
          .insert({
            appointment_id: appointment.id,
            animal_type: animalType.toLowerCase(),
            animal_number: animalIndex + 1,
            status: "scheduled",
          })
          .select("id")
          .single();

        if (animalError) {
          throw new Error(
            `Animal ${animalIndex + 1} error: ${
              animalError.message
            }`
          );
        }

        for (
          let customerIndex = 0;
          customerIndex <
          animalBooking.customers.length;
          customerIndex += 1
        ) {
          const shareCustomer =
            animalBooking.customers[customerIndex];

          const {
            data: customer,
            error: customerError,
          } = await supabase
            .from("customers")
            .insert({
              name: shareCustomer.name.trim(),
              phone: shareCustomer.phone.trim(),
              email: null,
            })
            .select("id")
            .single();

          if (customerError) {
            throw new Error(
              `Customer ${
                customerIndex + 1
              } on animal ${
                animalIndex + 1
              } error: ${customerError.message}`
            );
          }

          const { error: cutSheetError } =
            await supabase
              .from("cut_sheets")
              .insert({
                animal_id: animal.id,
                customer_id: customer.id,
                animal_type:
                  animalType.toLowerCase(),
                unlocked: false,
                form_data: {
                  customer_name:
                    shareCustomer.name.trim(),
                  phone_number:
                    shareCustomer.phone.trim(),
                  farmer_name:
                    bookingData.farmerName.trim(),
                  ...getPortionFormData(
                    animalBooking.saleType
                  ),
                },
              });

          if (cutSheetError) {
            throw new Error(
              `Cut sheet for customer ${
                customerIndex + 1
              } on animal ${
                animalIndex + 1
              } error: ${cutSheetError.message}`
            );
          }
        }
      }

      setMessage(
        "Appointment scheduled successfully."
      );
      setSubmitted(true);

      await loadCapacity(dropoffDate);
    } catch (error) {
      submitLockRef.current = false;
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while saving the appointment."
      );
    } finally {
      setSaving(false);
    }
  }

  const remainingCapacity =
    getRemainingCapacity(capacity);

  const beefCapacity = capacity
    ? capacity.beef_booked + capacity.beef_remaining
    : 0;

  const porkCapacity = capacity
    ? capacity.pork_booked + capacity.pork_remaining
    : 0;

  const totalCustomerShares =
    bookingData.animals.reduce(
      (total, animal) =>
        total + animal.customers.length,
      0
    );

  const weekIsFull =
    typeof remainingCapacity === "number" &&
    remainingCapacity === 0;

  return (
    <main className="min-h-screen bg-gray-100 py-12">
      <div className="mx-auto max-w-7xl px-6">
        <ProgressBar step={currentStep} />

        <h1 className="mb-2 text-5xl font-black">
          Schedule Processing
        </h1>

        <p className="mb-10 text-lg text-gray-600">
          Schedule your animal drop-off in a few
          simple steps.
        </p>

        <AnimalSelector
          animalType={animalType}
          setAnimalType={handleSetAnimalType}
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

        {dropoffDate && (
          <>
            <div className="my-8" />

            <section className="rounded-2xl bg-white p-8 shadow">
              <h2 className="mb-2 text-3xl font-bold">
                Weekly Capacity
              </h2>

              <p className="mb-6 text-gray-600">
                Monday and Tuesday drop-offs count toward the same
                processing week.
              </p>

              {capacityLoading && (
                <p className="font-bold">
                  Checking available spaces...
                </p>
              )}

              {capacityError && (
                <div className="rounded-lg bg-red-100 p-4 font-bold text-red-800">
                  {capacityError}
                </div>
              )}

              {capacity && !capacityLoading && (
                <div className="grid gap-5 md:grid-cols-2">
                  <div
                    className={`rounded-xl border p-5 ${
                      capacity.beef_remaining === 0
                        ? "border-red-300 bg-red-50"
                        : "bg-gray-50"
                    }`}
                  >
                    <h3 className="text-2xl font-bold">
                      Beef
                    </h3>

                    <p className="mt-2 text-lg">
                      {capacity.beef_booked} of {beefCapacity} booked
                    </p>

                    <p className="mt-1 text-xl font-black">
                      {capacity.beef_remaining} remaining
                    </p>
                  </div>

                  <div
                    className={`rounded-xl border p-5 ${
                      capacity.pork_remaining === 0
                        ? "border-red-300 bg-red-50"
                        : "bg-gray-50"
                    }`}
                  >
                    <h3 className="text-2xl font-bold">
                      Pork
                    </h3>

                    <p className="mt-2 text-lg">
                      {capacity.pork_booked} of {porkCapacity} booked
                    </p>

                    <p className="mt-1 text-xl font-black">
                      {capacity.pork_remaining} remaining
                    </p>
                  </div>
                </div>
              )}
            </section>
          </>
        )}

        {animalType &&
          dropoffDate &&
          dropoffTime &&
          !weekIsFull && (
            <>
              <div className="my-8" />

              <FarmerBooking
                animalType={animalType}
                value={bookingData}
                onChange={setBookingData}
                maxAnimals={remainingCapacity}
              />
            </>
          )}

        {animalType &&
          dropoffDate &&
          dropoffTime &&
          weekIsFull && (
            <>
              <div className="my-8" />

              <section className="rounded-2xl border border-red-300 bg-red-50 p-8 shadow">
                <h2 className="text-3xl font-bold text-red-800">
                  This Processing Week Is Full
                </h2>

                <p className="mt-3 text-lg text-red-800">
                  There are no remaining{" "}
                  {animalType.toLowerCase()} spaces for
                  this week. Please select another Monday or Tuesday.
                </p>
              </section>
            </>
          )}

        {animalType &&
          dropoffDate &&
          dropoffTime &&
          !weekIsFull && (
            <>
              <div className="my-8" />

              <section className="rounded-2xl bg-white p-8 shadow">
                <h2 className="mb-6 text-3xl font-bold">
                  4. Review and Submit
                </h2>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-xl bg-gray-100 p-5">
                    <h3 className="mb-3 text-xl font-bold">
                      Appointment
                    </h3>

                    <p>
                      <strong>Animal:</strong>{" "}
                      {animalType}
                    </p>

                    <p>
                      <strong>Drop-off Date:</strong>{" "}
                      {dropoffDate}
                    </p>

                    <p>
                      <strong>Drop-off Time:</strong>{" "}
                      {dropoffTime}
                    </p>

                    <p>
                      <strong>
                        Number of Animals:
                      </strong>{" "}
                      {bookingData.animals.length}
                    </p>

                    <p>
                      <strong>
                        Customer Shares:
                      </strong>{" "}
                      {totalCustomerShares}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-100 p-5">
                    <h3 className="mb-3 text-xl font-bold">
                      Farmer or Producer
                    </h3>

                    <p>
                      <strong>Name:</strong>{" "}
                      {bookingData.farmerName ||
                        "Not entered"}
                    </p>

                    <p>
                      <strong>Phone:</strong>{" "}
                      {bookingData.farmerPhone ||
                        "Not entered"}
                    </p>

                    <p>
                      <strong>Email:</strong>{" "}
                      {bookingData.farmerEmail ||
                        "Not entered"}
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {bookingData.animals.map(
                    (animal, index) => (
                      <div
                        key={index}
                        className="rounded-lg border p-4"
                      >
                        <strong>
                          {animalType === "Pork"
                            ? "Pig"
                            : animalType}{" "}
                          #{index + 1}:
                        </strong>{" "}
                        {getSaleTypeLabel(
                          animal.saleType
                        )}{" "}
                        with{" "}
                        {animal.customers.length}{" "}
                        customer
                        {animal.customers.length === 1
                          ? ""
                          : "s"}
                      </div>
                    )
                  )}
                </div>

                {message && (
                  <div
                    className={`mt-6 rounded-lg p-4 font-bold ${
                      message.includes(
                        "successfully"
                      )
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-900"
                    }`}
                  >
                    {message}
                  </div>
                )}

                <button
                  type="button"
                  disabled={
                    saving ||
                    submitted ||
                    capacityLoading ||
                    Boolean(capacityError)
                  }
                  onClick={handleSubmit}
                  className="mt-6 rounded-lg bg-red-700 px-6 py-3 text-lg font-bold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving Appointment..."
                    : submitted
                      ? "Appointment Scheduled"
                      : "Schedule Appointment"}
                </button>
              </section>
            </>
          )}
      </div>
    </main>
  );
}