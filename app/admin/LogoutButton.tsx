"use client";

import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();

    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-lg bg-gray-900 px-4 py-2 font-bold text-white hover:bg-black"
    >
      Log Out
    </button>
  );
}