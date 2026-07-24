"use client";

export type SaleType = "whole" | "halves" | "quarters";

export type ShareCustomer = {
  name: string;
  phone: string;
};

export type AnimalBooking = {
  saleType: SaleType;
  customers: ShareCustomer[];
};

export type BookingFormValue = {
  farmerName: string;
  farmerPhone: string;
  farmerEmail: string;
  animals: AnimalBooking[];
};

type FarmerBookingProps = {
  animalType: string;
  value: BookingFormValue;
  onChange: (value: BookingFormValue) => void;
  maxAnimals?: number | null;
};

function customerCountForSaleType(saleType: SaleType) {
  if (saleType === "whole") {
    return 1;
  }

  if (saleType === "halves") {
    return 2;
  }

  return 4;
}

function createCustomers(saleType: SaleType): ShareCustomer[] {
  return Array.from(
    { length: customerCountForSaleType(saleType) },
    () => ({
      name: "",
      phone: "",
    })
  );
}

function allowedSaleTypes(animalType: string): SaleType[] {
  if (animalType === "Beef") {
    return ["whole", "halves", "quarters"];
  }

  if (animalType === "Pork") {
    return ["whole", "halves"];
  }

  return ["whole"];
}

function createAnimalBooking(animalType: string): AnimalBooking {
  const saleType: SaleType = "whole";

  return {
    saleType,
    customers: createCustomers(saleType),
  };
}

export function createBookingForm(
  animalType: string
): BookingFormValue {
  return {
    farmerName: "",
    farmerPhone: "",
    farmerEmail: "",
    animals: [createAnimalBooking(animalType)],
  };
}

function getAnimalName(animalType: string) {
  if (animalType === "Pork") {
    return "Pig";
  }

  return animalType || "Animal";
}

function getSaleTypeLabel(saleType: SaleType) {
  if (saleType === "halves") {
    return "Halves";
  }

  if (saleType === "quarters") {
    return "Quarters";
  }

  return "Whole";
}

function getCustomerLabel(
  saleType: SaleType,
  customerIndex: number
) {
  if (saleType === "whole") {
    return "Whole Animal Customer";
  }

  if (saleType === "halves") {
    return `Half ${customerIndex + 1} Customer`;
  }

  return `Quarter ${customerIndex + 1} Customer`;
}

export default function FarmerBooking({
  animalType,
  value,
  onChange,
  maxAnimals = null,
}: FarmerBookingProps) {
  const saleTypes = allowedSaleTypes(animalType);
  const animalName = getAnimalName(animalType);

  const limitApplies = typeof maxAnimals === "number";
  const reachedLimit =
    limitApplies && value.animals.length >= maxAnimals;

  function updateFarmerField(
    field: "farmerName" | "farmerPhone" | "farmerEmail",
    fieldValue: string
  ) {
    onChange({
      ...value,
      [field]: fieldValue,
    });
  }

  function changeSaleType(
    animalIndex: number,
    saleType: SaleType
  ) {
    const updatedAnimals = value.animals.map(
      (animal, index) => {
        if (index !== animalIndex) {
          return animal;
        }

        const requiredCustomerCount =
          customerCountForSaleType(saleType);

        const customers = Array.from(
          { length: requiredCustomerCount },
          (_, customerIndex) =>
            animal.customers[customerIndex] || {
              name: "",
              phone: "",
            }
        );

        return {
          saleType,
          customers,
        };
      }
    );

    onChange({
      ...value,
      animals: updatedAnimals,
    });
  }

  function updateCustomer(
    animalIndex: number,
    customerIndex: number,
    field: "name" | "phone",
    fieldValue: string
  ) {
    const updatedAnimals = value.animals.map(
      (animal, index) => {
        if (index !== animalIndex) {
          return animal;
        }

        const updatedCustomers = animal.customers.map(
          (customer, index) => {
            if (index !== customerIndex) {
              return customer;
            }

            return {
              ...customer,
              [field]: fieldValue,
            };
          }
        );

        return {
          ...animal,
          customers: updatedCustomers,
        };
      }
    );

    onChange({
      ...value,
      animals: updatedAnimals,
    });
  }

  function addAnimal() {
    if (reachedLimit) {
      return;
    }

    onChange({
      ...value,
      animals: [
        ...value.animals,
        createAnimalBooking(animalType),
      ],
    });
  }

  function removeAnimal(animalIndex: number) {
    if (value.animals.length <= 1) {
      return;
    }

    onChange({
      ...value,
      animals: value.animals.filter(
        (_, index) => index !== animalIndex
      ),
    });
  }

  return (
    <section className="rounded-2xl bg-white p-8 shadow">
      <h2 className="mb-2 text-3xl font-bold">
        3. Booking Details
      </h2>

      <p className="mb-8 text-gray-600">
        Enter the farmer or producer information, then assign
        customers to each animal.
      </p>

      <div className="grid gap-5 md:grid-cols-3">
        <div>
          <label className="mb-2 block font-bold">
            Farmer or Producer Name
          </label>

          <input
            type="text"
            value={value.farmerName}
            onChange={(event) =>
              updateFarmerField(
                "farmerName",
                event.target.value
              )
            }
            placeholder="Full name"
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-2 block font-bold">
            Farmer or Producer Phone
          </label>

          <input
            type="tel"
            value={value.farmerPhone}
            onChange={(event) =>
              updateFarmerField(
                "farmerPhone",
                event.target.value
              )
            }
            placeholder="Phone number"
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-2 block font-bold">
            Email
          </label>

          <input
            type="email"
            value={value.farmerEmail}
            onChange={(event) =>
              updateFarmerField(
                "farmerEmail",
                event.target.value
              )
            }
            placeholder="Email address"
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>
      </div>

      <div className="mt-8 space-y-6">
        {value.animals.map((animal, animalIndex) => (
          <div
            key={animalIndex}
            className="rounded-xl border bg-gray-50 p-6"
          >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <h3 className="text-2xl font-bold">
                {animalName} #{animalIndex + 1}
              </h3>

              {value.animals.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    removeAnimal(animalIndex)
                  }
                  className="rounded-lg border border-red-700 px-4 py-2 font-bold text-red-700 hover:bg-red-50"
                >
                  Remove {animalName}
                </button>
              )}
            </div>

            <div className="mb-6">
              <label className="mb-2 block font-bold">
                Animal Portion
              </label>

              {saleTypes.length === 1 ? (
                <div className="rounded-lg border bg-white px-4 py-3 font-bold">
                  Whole Animal
                </div>
              ) : (
                <select
                  value={animal.saleType}
                  onChange={(event) =>
                    changeSaleType(
                      animalIndex,
                      event.target.value as SaleType
                    )
                  }
                  className="w-full rounded-lg border bg-white px-4 py-3"
                >
                  {saleTypes.map((saleType) => (
                    <option
                      key={saleType}
                      value={saleType}
                    >
                      {getSaleTypeLabel(saleType)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-4">
              {animal.customers.map(
                (customer, customerIndex) => (
                  <div
                    key={customerIndex}
                    className="rounded-lg border bg-white p-5"
                  >
                    <h4 className="mb-4 text-lg font-bold">
                      {getCustomerLabel(
                        animal.saleType,
                        customerIndex
                      )}
                    </h4>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block font-semibold">
                          Customer Name
                        </label>

                        <input
                          type="text"
                          value={customer.name}
                          onChange={(event) =>
                            updateCustomer(
                              animalIndex,
                              customerIndex,
                              "name",
                              event.target.value
                            )
                          }
                          placeholder="Customer full name"
                          className="w-full rounded-lg border px-4 py-3"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block font-semibold">
                          Customer Phone
                        </label>

                        <input
                          type="tel"
                          value={customer.phone}
                          onChange={(event) =>
                            updateCustomer(
                              animalIndex,
                              customerIndex,
                              "phone",
                              event.target.value
                            )
                          }
                          placeholder="Customer phone number"
                          className="w-full rounded-lg border px-4 py-3"
                        />
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addAnimal}
        disabled={reachedLimit}
        className="mt-6 rounded-lg bg-red-700 px-5 py-3 font-bold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {reachedLimit
          ? "Weekly Capacity Reached"
          : `+ Add Another ${animalName}`}
      </button>

      {limitApplies && (
        <p className="mt-3 text-sm font-semibold text-gray-600">
          This processing week currently has room for up to{" "}
          {maxAnimals} {animalName.toLowerCase()}
          {maxAnimals === 1 ? "" : "s"} in this booking.
        </p>
      )}
    </section>
  );
}