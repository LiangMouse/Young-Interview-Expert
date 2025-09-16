"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createInterview() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to create an interview." };
  }

  const { data, error } = await supabase
    .from("interviews")
    .insert([{ user_id: user.id }])
    .select("id")
    .single();

  if (error) {
    console.error("Error creating interview:", error);
    return { error: "Failed to create interview." };
  }

  revalidatePath("/dashboard");

  return { interviewId: data.id };
}
