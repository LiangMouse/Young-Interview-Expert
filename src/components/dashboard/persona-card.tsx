"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Camera, Bell, Palette, Settings } from "lucide-react";
import { useTranslations } from "next-intl";

export function PersonaCard() {
  const t = useTranslations("profile.persona");
  const [nickname, setNickname] = useState("CodeNinja_99");

  return (
    <div className="sticky top-6 h-fit rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm">
      {/* Avatar Section */}
      <div className="relative mb-6 flex justify-center">
        <div className="relative">
          <Avatar className="h-32 w-32">
            <AvatarImage src="/placeholder.svg?height=128&width=128" />
            <AvatarFallback className="bg-[#F5F5F5] text-2xl text-[#141414]">
              CN
            </AvatarFallback>
          </Avatar>
          <Button
            size="icon"
            variant="outline"
            className="absolute bottom-0 right-0 h-10 w-10 rounded-full border-2 border-white bg-white shadow-md hover:bg-[#F5F5F5]"
          >
            <Camera className="h-4 w-4 text-[#141414]" />
          </Button>
        </div>
      </div>

      {/* Nickname Field */}
      <div className="mb-4">
        <label className="mb-2 block text-xs font-medium text-[#666666]">
          {t("nickname")}
        </label>
        <Input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="border-[#E5E5E5] bg-white text-center text-lg font-bold text-[#141414]"
        />
      </div>

      {/* Level Badge */}
      <div className="mb-6 flex justify-center">
        <Badge
          variant="secondary"
          className="bg-[#F5F5F5] px-4 py-1.5 text-sm font-medium text-[#141414]"
        >
          {t("level", { level: 3, title: t("levelTitle") })}
        </Badge>
      </div>

      {/* Settings List */}
      <div className="space-y-1 border-t border-[#E5E5E5] pt-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-[#666666] hover:bg-[#F5F5F5] hover:text-[#141414]"
        >
          <Settings className="h-4 w-4" />
          {t("account")}
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-[#666666] hover:bg-[#F5F5F5] hover:text-[#141414]"
        >
          <Bell className="h-4 w-4" />
          {t("notifications")}
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-[#666666] hover:bg-[#F5F5F5] hover:text-[#141414]"
        >
          <Palette className="h-4 w-4" />
          {t("theme")}
        </Button>
      </div>
    </div>
  );
}
