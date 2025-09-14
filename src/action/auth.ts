"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logOut() {
  const supabase = createServerActionClient({ cookies });
  await supabase.auth.signOut();
  redirect("/login");
}
