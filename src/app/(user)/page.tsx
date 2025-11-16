import { getCurrentUser } from "@/lib/auth";
import DashboardClient from "./dashboard/dashboard-client";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  // 非空断言
  if (!user) {
    redirect("/auth/login");
  }

  return <DashboardClient />;
}
