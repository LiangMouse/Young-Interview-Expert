import { getCurrentUser } from "@/lib/auth";
import ProfileClient from "./profile-client";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  // 中间件已经处理了鉴权，这里只需要获取用户信息
  const user = await getCurrentUser();

  // 非空断言
  if (!user) {
    redirect("/auth/login");
  }

  return <ProfileClient user={user} />;
}
