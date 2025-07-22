import { getCurrentUser } from "@/lib/auth";
import DashboardClient from "./dashboard-client";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  // 中间件已经处理了鉴权，这里只需要获取用户信息
  const user = await getCurrentUser();

  // 非空断言
  if (!user) {
    redirect("/auth/login");
  }

  return <DashboardClient user={user} />;
}
