"use client";

import { useState } from "react";

type SaleType = "whole" | "halves" | "quarters";

type Customer = {
  name: string;
  phone: string;
};

type Beef = {
  saleType: SaleType;
  customers: Customer[];
};

function createCustomers(type: SaleType): Customer[] {
  if (type === "whole") {
    return [{ name: "", phone: "" }];
  }

  if (type === "halves") {
    return [
      { name: "", phone: "" },
      { name: "", phone: "" },
    ];
  }

  return [
    { name: "", phone: "" },
    { name: "", phone: "" },
    { name: "", phone: "" },
    { name: "", phone: "" },
  ];
}

export default function FarmerBooking() {
  const [farmerName, setFarmerName] = useState("");
  const [farmerPhone, setFarmerPhone] = useState("");

  const [beefs, setBeefs] = useState<Beef[]>([
    {
      saleType: "whole",
      customers: createCustomers("whole"),
    },
  ]);

  function changeSaleType(index: number, type: SaleType) {
    const updated = [...beefs];
    updated[index] = {
      saleType: type,
      customers: createCustomers(type),
    };
    setBeefs(updated);
  }

  function updateCustomer(
    beefIndex: number,
    customerIndex: number,
    field: "name" | "phone",
    value: string
  ) {
    const updated = [...beefs];
    updated[beefIndex].customers[customerIndex][field] = value;
    setBeefs(updated);
  }

  function addBeef() {
    setBeefs([
      ...beefs,
      {
        saleType: "whole",
        customers: createCustomers("whole"),
      },
    ]);
  }

  return (
    <section className="rounded-xl border p-6">
      <h2 className="mb-4 text-2xl font-bold">
        3. Farmer Booking
      </h2>

      <div className="space-y-4">

        <input
          placeholder="Farmer Name"
          value={farmerName}
          onChange={(e) => setFarmerName(e.target.value)}
          className="w-full rounded-lg border px-4 py-3"
        />

        <input
          placeholder="Farmer Phone"
          value={farmerPhone}
          onChange={(e) => setFarmerPhone(e.target.value)}
          className="w-full rounded-lg border px-4 py-3"
        />

        {beefs.map((beef, beefIndex) => (
          <div
            key={beefIndex}
            className="rounded-lg bg-gray-100 p-5 mt-6"
          >
            <h3 className="text-xl font-bold mb-4">
              Beef #{beefIndex + 1}
            </h3>

            <select
              value={beef.saleType}
              onChange={(e) =>
                changeSaleType(
                  beefIndex,
                  e.target.value as SaleType
                )
              }
              className="w-full rounded-lg border px-4 py-3 mb-4"
            >
              <option value="whole">Whole</option>
              <option value="halves">Halves</option>
              <option value="quarters">Quarters</option>
            </select>

            {beef.customers.map((customer, customerIndex) => (
              <div
                key={customerIndex}
                className="grid md:grid-cols-2 gap-4 mb-3"
              >
                <input
                  placeholder={`Customer ${customerIndex + 1} Name`}
                  value={customer.name}
                  onChange={(e) =>
                    updateCustomer(
                      beefIndex,
                      customerIndex,
                      "name",
                      e.target.value
                    )
                  }
                  className="rounded-lg border px-4 py-3"
                />

                <input
                  placeholder={`Customer ${customerIndex + 1} Phone`}
                  value={customer.phone}
                  onChange={(e) =>
                    updateCustomer(
                      beefIndex,
                      customerIndex,
                      "phone",
                      e.target.value
                    )
                  }
                  className="rounded-lg border px-4 py-3"
                />
              </div>
            ))}
          </div>
        ))}

        <button
          type="button"
          onClick={addBeef}
          className="rounded-lg bg-red-700 text-white px-5 py-3 font-bold hover:bg-red-800"
        >
          + Add Another Beef
        </button>
      </div>
    </section>
  );
}