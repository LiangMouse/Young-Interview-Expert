import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import InterviewClient from "./interview-client";

export default async function InterviewPage() {
  const supabase = createClientComponentClient();

  let session = null;
  try {
    const {
      data: { session: sessionData },
    } = await supabase.auth.getSession();
    session = sessionData;
  } catch (error) {
    console.error("Error getting session:", error);
    session = null;
  }

  if (!session) {
    redirect("/auth/login");
  }

  return <InterviewClient user={session.user} />;
}
