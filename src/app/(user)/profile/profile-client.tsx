"use client";

import React, { useState, useEffect } from "react";
import type { User } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Home,
  Settings,
  Edit3,
  Save,
  X,
  Upload,
  User,
  Mail,
  Briefcase,
  Target,
  FileText,
  Calendar,
  MapPin,
  Phone,
  MessageCircle,
} from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { UserProfile, ProfileFormData } from "@/types/profile";

interface ProfileClientProps {
  user: User;
}

export default function ProfileClient({ user }: ProfileClientProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    full_name: "",
    bio: "",
    phone: "",
    location: "",
    job_title: "",
    job_intention: "",
    skills: "",
    experience_years: 0,
    education: "",
  });

  const supabase = createClientComponentClient();
  const userName = user.user_metadata?.name || user.email?.split("@")[0] || "用户";

  // 获取用户资料
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/profile");
      const result = await response.json();

      if (!response.ok) {
        console.error("Error fetching profile:", result.error);
        return;
      }

      if (result.data) {
        setUserProfile(result.data);
        setFormData({
          full_name: result.data.full_name || "",
          bio: result.data.bio || "",
          phone: result.data.phone || "",
          location: result.data.location || "",
          job_title: result.data.job_title || "",
          job_intention: result.data.job_intention || "",
          skills: result.data.skills?.join(", ") || "",
          experience_years: result.data.experience_years || 0,
          education: result.data.education || "",
        });
      } else {
        // 如果没有资料，使用默认值
        setFormData({
          full_name: userName,
          bio: "",
          phone: "",
          location: "",
          job_title: "",
          job_intention: "",
          skills: "",
          experience_years: 0,
          education: "",
        });
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // 保存用户资料
  const saveProfile = async () => {
    try {
      setLoading(true);
      const profileData = {
        full_name: formData.full_name,
        bio: formData.bio,
        phone: formData.phone,
        location: formData.location,
        job_title: formData.job_title,
        job_intention: formData.job_intention,
        skills: formData.skills.split(",").map(skill => skill.trim()).filter(Boolean),
        experience_years: formData.experience_years,
        education: formData.education,
      };

      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Error saving profile:", result.error);
        return;
      }

      setUserProfile(result.data);
      setIsEditing(false);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "experience_years" ? parseInt(value) || 0 : value,
    }));
  };

  const cancelEdit = () => {
    if (userProfile) {
      setFormData({
        full_name: userProfile.full_name || "",
        bio: userProfile.bio || "",
        phone: userProfile.phone || "",
        location: userProfile.location || "",
        job_title: userProfile.job_title || "",
        job_intention: userProfile.job_intention || "",
        skills: userProfile.skills?.join(", ") || "",
        experience_years: userProfile.experience_years || 0,
        education: userProfile.education || "",
      });
    }
    setIsEditing(false);
  };

  useEffect(() => {
    fetchUserProfile();
  }, [user.id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-purple-50 to-amber-50">
      {/* 顶部导航栏 */}
      <header className="backdrop-blur-md bg-white/70 border-b border-white/20 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="rounded-full">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="w-8 h-8 bg-gradient-to-r from-sky-400 to-purple-400 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-sky-600 to-purple-600 bg-clip-text text-transparent">
              个人资料
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
              <AvatarImage
                src={user.user_metadata?.avatar_url || "/placeholder.svg"}
              />
              <AvatarFallback>
                {userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        {/* 个人信息卡片 */}
        <Card className="backdrop-blur-md bg-white/60 border-white/30 shadow-xl rounded-3xl mb-6">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <Avatar className="w-24 h-24">
                <AvatarImage
                  src={user.user_metadata?.avatar_url || "/placeholder.svg"}
                />
                <AvatarFallback className="text-2xl">
                  {userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              {isEditing ? (
                <Input
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="text-center text-2xl font-bold"
                  placeholder="请输入姓名"
                />
              ) : (
                formData.full_name || userName
              )}
            </CardTitle>
            <CardDescription className="text-gray-600 flex items-center justify-center gap-2">
              <Mail className="w-4 h-4" />
              {user.email}
            </CardDescription>
            <div className="flex justify-center mt-4">
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-gradient-to-r from-sky-400 to-purple-400 hover:from-sky-500 hover:to-purple-500 rounded-full"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  编辑资料
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={saveProfile}
                    disabled={loading}
                    className="bg-gradient-to-r from-green-400 to-emerald-400 hover:from-green-500 hover:to-emerald-500 rounded-full"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    保存
                  </Button>
                  <Button
                    onClick={cancelEdit}
                    variant="outline"
                    className="rounded-full"
                  >
                    <X className="w-4 h-4 mr-2" />
                    取消
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 基本信息 */}
          <Card className="backdrop-blur-md bg-white/60 border-white/30 shadow-xl rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                基本信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-4 h-4" />
                  当前职位
                </Label>
                {isEditing ? (
                  <Input
                    name="job_title"
                    value={formData.job_title}
                    onChange={handleInputChange}
                    placeholder="请输入当前职位"
                  />
                ) : (
                  <p className="text-gray-700">{formData.job_title || "暂未填写"}</p>
                )}
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4" />
                  所在地区
                </Label>
                {isEditing ? (
                  <Input
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="请输入所在地区"
                  />
                ) : (
                  <p className="text-gray-700">{formData.location || "暂未填写"}</p>
                )}
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4" />
                  联系电话
                </Label>
                {isEditing ? (
                  <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="请输入联系电话"
                  />
                ) : (
                  <p className="text-gray-700">{formData.phone || "暂未填写"}</p>
                )}
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4" />
                  工作经验
                </Label>
                {isEditing ? (
                  <Input
                    name="experience_years"
                    type="number"
                    value={formData.experience_years}
                    onChange={handleInputChange}
                    placeholder="请输入工作年限"
                    min="0"
                  />
                ) : (
                  <p className="text-gray-700">
                    {formData.experience_years > 0 ? `${formData.experience_years} 年` : "暂未填写"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 求职信息 */}
          <Card className="backdrop-blur-md bg-white/60 border-white/30 shadow-xl rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                求职信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4" />
                  求职意向
                </Label>
                {isEditing ? (
                  <Input
                    name="job_intention"
                    value={formData.job_intention}
                    onChange={handleInputChange}
                    placeholder="请输入求职意向"
                  />
                ) : (
                  <p className="text-gray-700">{formData.job_intention || "暂未填写"}</p>
                )}
              </div>

              <div>
                <Label className="mb-2">技能标签</Label>
                {isEditing ? (
                  <Input
                    name="skills"
                    value={formData.skills}
                    onChange={handleInputChange}
                    placeholder="请输入技能，用逗号分隔"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.split(",").filter(Boolean).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="rounded-full">
                        {skill.trim()}
                      </Badge>
                    ))}
                    {!formData.skills && (
                      <p className="text-gray-500">暂未添加技能标签</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4" />
                  教育背景
                </Label>
                {isEditing ? (
                  <Input
                    name="education"
                    value={formData.education}
                    onChange={handleInputChange}
                    placeholder="请输入教育背景"
                  />
                ) : (
                  <p className="text-gray-700">{formData.education || "暂未填写"}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 个人简介 */}
        <Card className="backdrop-blur-md bg-white/60 border-white/30 shadow-xl rounded-3xl mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              个人简介
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                className="w-full min-h-[120px] p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-sky-400"
                placeholder="请输入个人简介..."
              />
            ) : (
              <p className="text-gray-700 leading-relaxed">
                {formData.bio || "暂未填写个人简介"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* 简历上传 */}
        <Card className="backdrop-blur-md bg-white/60 border-white/30 shadow-xl rounded-3xl mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              简历管理
            </CardTitle>
            <CardDescription>
              上传您的简历文件，支持 PDF、DOC、DOCX 格式
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-sky-400 transition-colors">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">点击上传或拖拽文件到此处</p>
              <p className="text-sm text-gray-500">支持 PDF、DOC、DOCX 格式，最大 10MB</p>
              <Button className="mt-4 bg-gradient-to-r from-sky-400 to-purple-400 hover:from-sky-500 hover:to-purple-500 rounded-full">
                选择文件
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
