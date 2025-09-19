import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import StoreInitializer from "@/components/store-initializer";
import { getOrCreateUserProfile } from "@/action/user-profile";
import { createClient } from "@/lib/supabase/server";
import { SingletonProvider } from "@/components/singleton-provider";

const inter = Inter({ subsets: ["latin"] });

// 定义index.html中 header部分
export const metadata: Metadata = {
  title: "AI面试助手",
  description: "专为中文互联网技术岗求职者打造的AI面试官智能体应用",
  icons: {
    icon: "/favicon.svg", // favicon.ico
    shortcut: "/favicon-16x16.png", // favicon-16x16.png
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  const userProfile =
    user && !error ? await getOrCreateUserProfile(user) : null;

  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <StoreInitializer userInfo={userProfile} />
        {children}
        <SingletonProvider />
      </body>
    </html>
  );
}
