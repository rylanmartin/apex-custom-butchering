type CustomerInfoProps = {
  customerName: string;
  setCustomerName: (value: string) => void;
  customerPhone: string;
  setCustomerPhone: (value: string) => void;
  customerEmail: string;
  setCustomerEmail: (value: string) => void;
};

export default function CustomerInfo({
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  customerEmail,
  setCustomerEmail,
}: CustomerInfoProps) {
  return (
    <section className="rounded-xl border p-6">
      <h2 className="mb-4 text-2xl font-bold">3. Customer Information</h2>

      <div className="space-y-4">
        <input
          placeholder="Customer Name"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="w-full rounded-lg border px-4 py-3"
        />

        <input
          placeholder="Phone Number"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          className="w-full rounded-lg border px-4 py-3"
        />

        <input
          placeholder="Email"
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
          className="w-full rounded-lg border px-4 py-3"
        />
      </div>
    </section>
  );
}