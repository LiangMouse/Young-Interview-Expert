"use client";

import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Camera, Bell, Palette, Settings, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { UserProfile } from "@/types/profile";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/store/user";

interface PersonaCardProps {
  userProfile: UserProfile | null;
  onProfileUpdate?: (profile: UserProfile) => void;
}

export function PersonaCard({
  userProfile,
  onProfileUpdate,
}: PersonaCardProps) {
  const { setUserInfo } = useUserStore();
  const [nickname, setNickname] = useState(userProfile?.nickname || "");
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name?: string | null) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return "U";
  };

  const getLevelBadge = (experienceYears?: number | null) => {
    if (!experienceYears || experienceYears < 2) {
      return { level: 1, title: "Junior Candidate" };
    } else if (experienceYears < 5) {
      return { level: 2, title: "Mid-Level Candidate" };
    } else if (experienceYears < 8) {
      return { level: 3, title: "Senior Candidate" };
    } else {
      return { level: 4, title: "Expert Candidate" };
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith("image/")) {
      toast.error("请上传图片文件");
      return;
    }

    // 验证文件大小 (最大 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("图片大小不能超过 5MB");
      return;
    }

    try {
      setIsUploadingAvatar(true);
      const supabase = createClient();

      // 获取当前用户
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("请先登录");
        return;
      }

      // 上传到 Supabase Storage
      const fileName = `${user.id}/avatar-${Date.now()}.${file.name.split(".").pop()}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast.error("头像上传失败");
        return;
      }

      // 获取公开 URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        toast.error("获取头像链接失败");
        return;
      }

      // 更新用户资料
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: urlData.publicUrl }),
      });

      if (!response.ok) {
        toast.error("保存头像失败");
        return;
      }

      const result = await response.json();
      if (result.data) {
        setUserInfo(result.data);
        onProfileUpdate?.(result.data);
        toast.success("头像更新成功");
      }
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast.error("头像上传失败");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleNicknameSave = async () => {
    if (!nickname.trim()) {
      toast.error("昵称不能为空");
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nickname.trim() }),
      });

      if (!response.ok) {
        toast.error("保存昵称失败");
        return;
      }

      const result = await response.json();
      if (result.data) {
        setUserInfo(result.data);
        onProfileUpdate?.(result.data);
        toast.success("昵称更新成功");
      }
      setIsEditingNickname(false);
    } catch (error) {
      console.error("Nickname save error:", error);
      toast.error("保存昵称失败");
    } finally {
      setIsSaving(false);
    }
  };

  const levelInfo = getLevelBadge(userProfile?.experience_years);

  return (
    <div className="sticky top-6 h-fit rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm">
      {/* Avatar Section */}
      <div className="relative mb-6 flex justify-center">
        <div className="relative">
          <Avatar className="h-32 w-32">
            <AvatarImage src={userProfile?.avatar_url || undefined} />
            <AvatarFallback className="bg-[#F5F5F5] text-2xl text-[#141414]">
              {getInitials(userProfile?.nickname)}
            </AvatarFallback>
          </Avatar>
          <Button
            size="icon"
            variant="outline"
            disabled={isUploadingAvatar}
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 h-10 w-10 rounded-full border-2 border-white bg-white shadow-md hover:bg-[#F5F5F5]"
          >
            {isUploadingAvatar ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#141414]" />
            ) : (
              <Camera className="h-4 w-4 text-[#141414]" />
            )}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </div>
      </div>

      {/* Nickname Field */}
      <div className="mb-4">
        <label className="mb-2 block text-xs font-medium text-[#666666]">
          昵称
        </label>
        {isEditingNickname ? (
          <div className="flex gap-2">
            <Input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="border-[#E5E5E5] bg-white text-center text-lg font-bold text-[#141414]"
              placeholder="输入昵称"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleNicknameSave();
                if (e.key === "Escape") setIsEditingNickname(false);
              }}
            />
            <Button
              size="sm"
              onClick={handleNicknameSave}
              disabled={isSaving}
              className="shrink-0"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "保存"}
            </Button>
          </div>
        ) : (
          <div
            onClick={() => setIsEditingNickname(true)}
            className="cursor-pointer rounded-md border border-transparent px-3 py-2 text-center text-lg font-bold text-[#141414] hover:border-[#E5E5E5] hover:bg-[#F5F5F5] transition-colors"
          >
            {userProfile?.nickname || "点击设置昵称"}
          </div>
        )}
      </div>

      {/* Job Intention */}
      {userProfile?.job_intention && (
        <div className="mb-4 text-center">
          <span className="text-sm text-[#666666]">
            {userProfile.job_intention}
          </span>
        </div>
      )}

      {/* Level Badge */}
      <div className="mb-6 flex justify-center">
        <Badge
          variant="secondary"
          className="bg-[#F5F5F5] px-4 py-1.5 text-sm font-medium text-[#141414]"
        >
          Level {levelInfo.level}: {levelInfo.title}
        </Badge>
      </div>

      {/* Settings List */}
      <div className="space-y-1 border-t border-[#E5E5E5] pt-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-[#666666] hover:bg-[#F5F5F5] hover:text-[#141414]"
        >
          <Settings className="h-4 w-4" />
          账号设置
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-[#666666] hover:bg-[#F5F5F5] hover:text-[#141414]"
        >
          <Bell className="h-4 w-4" />
          通知设置
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-[#666666] hover:bg-[#F5F5F5] hover:text-[#141414]"
        >
          <Palette className="h-4 w-4" />
          主题设置
        </Button>
      </div>
    </div>
  );
}
