import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();

  const { data, error } =
    await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/login");
  }

  // return children directly to avoid JSX in a .ts file
  return children;
}