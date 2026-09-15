"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Status =
  | "Waiting for Deer"
  | "Waiting to Be Cut"
  | "Ready for Pickup"
  | "Done";

type CutType = "Burger" | "Basic Cut" | "Deluxe Cut";

type DeerOrder = {
  id: string;
  name: string;
  phone: string;
  status: Status;
  cut_type: CutType;
};

const statusOptions: Status[] = [
  "Waiting for Deer",
  "Waiting to Be Cut",
  "Ready for Pickup",
  "Done",
];

const cutOptions: CutType[] = [
  "Burger",
  "Basic Cut",
  "Deluxe Cut",
];

export default function Home() {
  const [orders, setOrders] = useState<DeerOrder[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cutType, setCutType] = useState<CutType>("Burger");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    const { data, error } = await supabase
      .from("deer_orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("Could not load customers.");
    } else {
      setOrders(data as DeerOrder[]);
    }

    setLoading(false);
  }

  async function addCustomer(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !phone.trim()) {
      alert("Enter a customer name and phone number.");
      return;
    }

    const { error } = await supabase
      .from("deer_orders")
      .insert({
        name: name.trim(),
        phone: phone.trim(),
        status: "Waiting for Deer",
        cut_type: cutType,
      });

    if (error) {
      console.error(error);
      alert("Could not add customer.");
      return;
    }

    setName("");
    setPhone("");
    setCutType("Burger");

    await loadOrders();
  }

  async function updateStatus(id: string, status: Status) {
    const { error } = await supabase
      .from("deer_orders")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Could not update status.");
      return;
    }

    setOrders((current) =>
      current.map((order) =>
        order.id === id ? { ...order, status } : order
      )
    );
  }

  async function updateCut(id: string, cut_type: CutType) {
    const { error } = await supabase
      .from("deer_orders")
      .update({ cut_type })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Could not update cut.");
      return;
    }

    setOrders((current) =>
      current.map((order) =>
        order.id === id ? { ...order, cut_type } : order
      )
    );
  }

  async function deleteOrder(id: string) {
    if (!confirm("Delete this customer?")) return;

    const { error } = await supabase
      .from("deer_orders")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Could not delete customer.");
      return;
    }

    setOrders((current) =>
      current.filter((order) => order.id !== id)
    );
  }

  if (loading) {
    return (
      <main>
        <h1>Loading...</h1>
      </main>
    );
  }

  return (
    <main>
      <section className="hero">
        <p className="eyebrow">DEER PROCESSING</p>
        <h1>Processing Dashboard</h1>
        <p>
          Keep track of customers, cuts, and processing progress.
        </p>
      </section>

      <section className="stats">
        {statusOptions.map((status) => (
          <div className="statCard" key={status}>
            <span>{status}</span>
            <strong>
              {
                orders.filter(
                  (order) => order.status === status
                ).length
              }
            </strong>
          </div>
        ))}
      </section>

      <section className="grid">
        <div className="panel">
          <p className="eyebrow">NEW ORDER</p>
          <h2>New Customer</h2>

          <form onSubmit={addCustomer}>
            <label>
              Customer Name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Smith"
              />
            </label>

            <label>
              Phone Number
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="989-555-1234"
              />
            </label>

            <label>
              Cut
              <select
                value={cutType}
                onChange={(e) =>
                  setCutType(e.target.value as CutType)
                }
              >
                {cutOptions.map((cut) => (
                  <option key={cut}>{cut}</option>
                ))}
              </select>
            </label>

            <button type="submit">
              Add Customer
            </button>
          </form>
        </div>

        <div className="panel">
          <p className="eyebrow">CURRENT WORK</p>
          <h2>Customers</h2>

          <div className="orders">
            {orders.length === 0 ? (
              <div className="empty">
                No customers yet.
              </div>
            ) : (
              orders.map((order) => (
                <div className="orderCard" key={order.id}>
                  <div className="customer">
                    <h3>{order.name}</h3>
                    <a href={`tel:${order.phone}`}>
                      {order.phone}
                    </a>
                  </div>

                  <div className="controls">
                    <label>
                      Progress
                      <select
                        value={order.status}
                        onChange={(e) =>
                          updateStatus(
                            order.id,
                            e.target.value as Status
                          )
                        }
                      >
                        {statusOptions.map((status) => (
                          <option key={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Cut
                      <select
                        value={order.cut_type}
                        onChange={(e) =>
                          updateCut(
                            order.id,
                            e.target.value as CutType
                          )
                        }
                      >
                        {cutOptions.map((cut) => (
                          <option key={cut}>
                            {cut}
                          </option>
                        ))}
                      </select>
                    </label>

                    <button
                      className="delete"
                      onClick={() =>
                        deleteOrder(order.id)
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}