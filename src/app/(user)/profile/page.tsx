import { getCurrentUser } from "@/lib/auth";
import ProfileClient from "./profile-client";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const supabase = await createClient();
  const { data: userProfile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <ProfileClient
      user={{ ...user, email: user.email || "" }}
      userProfile={userProfile}
    />
  );
}
