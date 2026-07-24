"use client";

import dynamic from "next/dynamic";

const CutSheetClient = dynamic(
  () => import("./CutSheetClient"),
  {
    ssr: false,
    loading: () => (
      <main className="min-h-screen bg-gray-100 p-10 text-center text-2xl">
        Loading cut sheet...
      </main>
    ),
  }
);

export default function CutSheetPage() {
  return <CutSheetClient />;
}