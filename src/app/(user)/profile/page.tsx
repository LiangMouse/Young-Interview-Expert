import { getCurrentUser } from "@/lib/auth";
import ProfileClient from "./profile-client";
import { redirect } from "next/navigation";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const supabase = createServerActionClient({ cookies });
  const { data: userProfile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return <ProfileClient user={user} userProfile={userProfile} />;
}
