import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// 定义index.html中 header部分
export const metadata: Metadata = {
  title: "AI面试助手",
  description: "专为中文互联网技术岗求职者打造的AI面试官智能体应用",
  icons: {
    icon: "/favicon.svg", // favicon.ico
    shortcut: "/favicon-16x16.png", // favicon-16x16.png

    // TODO
    // apple: '/apple-touch-icon.png', // apple-touch-icon.png
    // other: {
    //   rel: 'apple-touch-icon-precomposed',
    //   url: '/apple-touch-icon-precomposed.png',
    // },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
