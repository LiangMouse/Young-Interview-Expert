"use client";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/user";
import { HeaderAvatar } from "@/components/header-avatar";
import { LogOut } from "lucide-react";

export function PageHeader() {
  const { userInfo } = useUserStore();
  const userName = userInfo?.nickname || "";
  const userAvatar = userInfo?.avatar_url || "";
  const loading = false;
  return (
    <header className="backdrop-blur-md border-b border-white/20 px-6 py-4">
      <div className="flex w-full items-center justify-between max-w-7xl mx-auto">
        <nav className="flex items-center space-x-3">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <Image
              src="/favicon.svg"
              alt="MockMate Logo"
              width={38}
              height={32}
            />
            <h2 className="text-black">小面</h2>
          </Link>
        </nav>
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full"
            onClick={() => {
              console.log("TODO");
            }}
            disabled={loading}
          >
            <LogOut className="w-4 h-4" />
          </Button>
          <HeaderAvatar avatarUrl={userAvatar} userName={userName} />
        </div>
      </div>
    </header>
  );
}
