"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Home, Settings, MessageCircle } from "lucide-react";

interface PageHeaderProps {
  userName: string;
  userAvatar?: string;
}

export function PageHeader({ userName, userAvatar }: PageHeaderProps) {
  return (
    <header className="backdrop-blur-md bg-white/70 border-b border-white/20 px-6 py-4 sticky top-0 z-10">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-3">
          <Link href="/dashboard" className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="rounded-full">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="w-8 h-8 bg-gradient-to-r from-sky-400 to-purple-400 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
          </Link>
          <h1 className="text-xl font-bold bg-gradient-to-r from-sky-600 to-purple-600 bg-clip-text text-transparent">
            AI智能面试助手
          </h1>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="rounded-full">
              <Home className="w-4 h-4" />
            </Button>
          </Link>
          <Button variant="ghost" size="sm" className="rounded-full">
            <Settings className="w-4 h-4" />
          </Button>
          <Avatar className="w-8 h-8">
            <AvatarImage src={userAvatar || "/placeholder.svg"} />
            <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
