import { getCurrentUser } from "@/lib/auth";
import InterviewClient from "./interview-client";
import { redirect } from "next/navigation";

export default async function InterviewPage() {
  // 中间件已经处理了鉴权，这里只需要获取用户信息
  const user = await getCurrentUser();

  // 非空断言
  if (!user) {
    redirect("/auth/login");
  }
  return <InterviewClient user={user} />;
}
