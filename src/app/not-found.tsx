"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-purple-50 to-amber-50 flex flex-col items-center justify-center text-center p-4">
      <div className="backdrop-blur-md bg-white/60 border-white/30 shadow-xl rounded-3xl p-8 max-w-md w-full">
        <h1 className="text-6xl font-bold text-gray-800">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mt-4">
          页面未找到
        </h2>
        <p className="text-gray-600 mt-4 text-lg">🚧 WIP</p>
        <div className="text-gray-600 mt-4 text-lg">
          您访问的页面正在规划中...
        </div>
        <div className="flex items-center justify-center gap-4 mt-8">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="rounded-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回上一页
          </Button>
          <Link href="/dashboard">
            <Button className=" black rounded-full">
              <Home className="w-4 h-4 mr-2" />
              返回主页
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
