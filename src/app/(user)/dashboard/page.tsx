import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { redirect } from "next/navigation"
import DashboardClient from "./dashboard-client"

export default async function DashboardPage() {
  let session = null
  try {
    const supabase = createClientComponentClient()
    session = await supabase.auth.getSession().then((res) => res.data.session)
  } catch {
    /* ignore – 多数为未配置 env */
  }

  if (!session) {
    redirect("/auth/login")
  }

  return <DashboardClient user={session.user} />
}
