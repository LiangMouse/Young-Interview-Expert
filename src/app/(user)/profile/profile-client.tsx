"use client";

import React, { useState, useEffect } from "react";
import type { User } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Home,
  Settings,
  X,
  Upload,
  User as UserIcon,
  Briefcase,
  Target,
  FileText,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type {
  UserProfile,
  WorkExperience,
  ProjectExperience,
} from "@/types/profile";
import { uploadResume } from "@/action/upload-resume";
import { ResumeParseConfirmDialog } from "@/components/resume-parse-confirm-dialog";

interface ProfileClientProps {
  user: User;
}

export default function ProfileClient({ user }: ProfileClientProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<any>({
    nickname: "",
    bio: "",
    job_intention: "",
    skills: "",
    experience_years: 0,
    graduation_date: "",
    work_experiences: [],
    project_experiences: [],
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [parsedResumeData, setParsedResumeData] = useState<any>(null);

  const handleWorkExperienceChange = (
    index: number,
    field: any,
    value: string,
  ) => {
    const newWorkExperiences = [...formData.work_experiences];
    newWorkExperiences[index] = {
      ...newWorkExperiences[index],
      [field]: value,
    };
    setFormData({ ...formData, work_experiences: newWorkExperiences });
  };

  const addWorkExperience = () => {
    setFormData({
      ...formData,
      work_experiences: [
        ...formData.work_experiences,
        {
          company: "",
          position: "",
          start_date: "",
          end_date: "",
          description: "",
        },
      ],
    });
  };

  const removeWorkExperience = (index: number) => {
    const newWorkExperiences = formData.work_experiences.filter(
      (_: any, i: any) => i !== index,
    );
    setFormData({ ...formData, work_experiences: newWorkExperiences });
  };

  const handleProjectExperienceChange = (
    index: number,
    field: any,
    value: string | string[],
  ) => {
    const newProjectExperiences = [...formData.project_experiences];
    newProjectExperiences[index] = {
      ...newProjectExperiences[index],
      [field]: value,
    };
    setFormData({ ...formData, project_experiences: newProjectExperiences });
  };

  const addProjectExperience = () => {
    setFormData({
      ...formData,
      project_experiences: [
        ...formData.project_experiences,
        {
          project_name: "",
          role: "",
          start_date: "",
          end_date: "",
          tech_stack: [],
          description: "",
        },
      ],
    });
  };

  const removeProjectExperience = (index: number) => {
    const newProjectExperiences = formData.project_experiences.filter(
      (_: any, i: number) => i !== index,
    );
    setFormData({ ...formData, project_experiences: newProjectExperiences });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setResumeFile(file);
      handleResumeUpload(file);
    }
  };

  const handleResumeUpload = async (file: File) => {
    if (!file) {
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress("正在上传文件...");

      const formData = new FormData();
      formData.append("file", file);

      // 模拟进度更新
      setTimeout(() => setUploadProgress("正在解析PDF内容..."), 1000);
      setTimeout(() => setUploadProgress("正在使用AI分析简历..."), 3000);
      setTimeout(() => setUploadProgress("正在保存数据..."), 15000);

      const result = await uploadResume(formData);
      console.log(result, "提交结果");

      if (result.success && result.data) {
        setUploadProgress("解析完成！");
        setParsedResumeData(result.data);
        setIsConfirmDialogOpen(true);
      } else {
        alert(`简历处理失败: ${result.error}`);
      }
    } catch (error) {
      console.error("Error processing resume:", error);
      alert("处理简历时出错，请查看控制台获取更多信息。");
    } finally {
      setIsUploading(false);
      setUploadProgress("");
    }
  };

  const handleConfirmParse = () => {
    if (parsedResumeData) {
      const { skills, ...restData } = parsedResumeData;
      setFormData((prev: any) => ({
        ...prev,
        ...restData,
        skills: skills || "",
      }));
      alert("简历内容已填充！");
    }
    setIsConfirmDialogOpen(false);
    setParsedResumeData(null);
  };

  const handlePreview = async () => {
    // TODO: 预览支持仅查看右侧表单信息，简历仅作为快速导入作用
    // if (!resumeFile) {
    //   alert("请先选择一个简历文件");
    //   return;
    // }
    // TODO: Implement resume parsing and form filling
    alert("WIP...");
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(formData, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = "profile_data.json";

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const supabase = createClientComponentClient();
  const userName =
    user.user_metadata?.name || user.email?.split("@")[0] || "用户";

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
          nickname: result.data.nickname || "",
          bio: result.data.bio || "",
          job_intention: result.data.job_intention || "",
          skills: result.data.skills?.join(", ") || "",
          experience_years: result.data.experience_years || 0,
          graduation_date: result.data.graduation_date || "",
          work_experiences: result.data.work_experiences || [],
          project_experiences: result.data.project_experiences || [],
        });
      } else {
        // 如果没有资料，使用默认值
        setFormData({
          nickname: "",
          bio: "",
          job_intention: "",
          skills: "",
          experience_years: 0,
          graduation_date: "",
          work_experiences: [],
          project_experiences: [],
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
        ...formData,
        skills: formData.skills
          .split(",")
          .map((skill: string) => skill.trim())
          .filter(Boolean),
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: name === "experience_years" ? parseInt(value) || 0 : value,
    }));
  };

  const cancelEdit = () => {
    if (userProfile) {
      setFormData({
        nickname: userProfile.nickname || "",
        bio: userProfile.bio || "",
        job_intention: userProfile.job_intention || "",
        skills: userProfile.skills?.join(", ") || "",
        experience_years: userProfile.experience_years || 0,
        graduation_date: userProfile.graduation_date || "",
        work_experiences: userProfile.work_experiences || [],
        project_experiences: userProfile.project_experiences || [],
      });
    }
    setIsEditing(false);
  };

  useEffect(() => {
    fetchUserProfile();
  }, [user.id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-purple-50 to-amber-50">
      <ResumeParseConfirmDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        onConfirm={handleConfirmParse}
      />
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

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="col-span-1 flex flex-col gap-6">
            {/* 简历导入 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  简历导入
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isUploading
                      ? "border-blue-400 bg-blue-50"
                      : "border-gray-300 hover:border-blue-400"
                  }`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && !isUploading) {
                      setResumeFile(e.dataTransfer.files[0]);
                      handleResumeUpload(e.dataTransfer.files[0]);
                    }
                  }}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-3" />
                      <p className="text-sm text-blue-600 mb-2 font-medium">
                        {uploadProgress}
                      </p>
                      <p className="text-xs text-gray-500">
                        预计需要 20-30 秒，请耐心等待...
                      </p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600 mb-2">
                        {resumeFile
                          ? `已选择文件: ${resumeFile.name}`
                          : "拖拽PDF简历到此处或点击上传"}
                      </p>
                      <Input
                        id="resume-upload"
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".pdf"
                        disabled={isUploading}
                      />
                      <Button
                        size="sm"
                        onClick={() =>
                          document.getElementById("resume-upload")?.click()
                        }
                        disabled={isUploading}
                      >
                        选择文件
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
            {/* 预览信息 */}
            <Card>
              <CardContent className="flex flex-col gap-3 pt-6">
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handlePreview}
                >
                  预览信息
                </Button>
                <Button className="w-full" onClick={saveProfile}>
                  保存信息
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleExport}
                >
                  导出数据
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="col-span-2 flex flex-col gap-6">
            {/* 基本信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="w-5 h-5" />
                  基本信息
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="nickname">个人昵称</Label>
                  <Input
                    id="nickname"
                    name="nickname"
                    value={formData.nickname}
                    onChange={handleInputChange}
                    placeholder="请输入个人昵称"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="email">邮箱地址</Label>
                  <Input
                    id="email"
                    value={user.email ?? ""}
                    disabled
                    placeholder="请输入邮箱地址"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="job_intention">意向岗位</Label>
                  <Input
                    id="job_intention"
                    name="job_intention"
                    value={formData.job_intention}
                    onChange={handleInputChange}
                    placeholder="请输入意向岗位"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 教育背景 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  教育背景
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="graduation_date">毕业时间</Label>
                  <Input
                    id="graduation_date"
                    name="graduation_date"
                    value={formData.graduation_date}
                    onChange={handleInputChange}
                    type="month"
                    placeholder="----年--月"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 工作经历 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  工作经历
                </CardTitle>
                <Button size="sm" onClick={addWorkExperience}>
                  + 添加
                </Button>
              </CardHeader>
              <CardContent>
                {formData.work_experiences.length > 0 ? (
                  <div className="space-y-4">
                    {formData.work_experiences.map(
                      (exp: WorkExperience, index: number) => (
                        <div
                          key={index}
                          className="border rounded-lg p-4 relative"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-semibold text-lg">
                              {exp.company} - {exp.position}
                            </p>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 absolute top-2 right-2"
                              onClick={() => removeWorkExperience(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <Label>公司名称</Label>
                              <Input
                                value={exp.company}
                                onChange={(e) =>
                                  handleWorkExperienceChange(
                                    index,
                                    "company",
                                    e.target.value,
                                  )
                                }
                                placeholder="公司名称"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label>职位</Label>
                              <Input
                                value={exp.position}
                                onChange={(e) =>
                                  handleWorkExperienceChange(
                                    index,
                                    "position",
                                    e.target.value,
                                  )
                                }
                                placeholder="职位"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label>开始时间</Label>
                              <Input
                                type="month"
                                value={exp.start_date}
                                onChange={(e) =>
                                  handleWorkExperienceChange(
                                    index,
                                    "start_date",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <Label>结束时间</Label>
                              <Input
                                type="month"
                                value={exp.end_date}
                                onChange={(e) =>
                                  handleWorkExperienceChange(
                                    index,
                                    "end_date",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div className="col-span-2 space-y-1">
                              <Label>工作描述</Label>
                              <textarea
                                className="w-full min-h-[80px] p-2 border rounded-md"
                                value={exp.description}
                                onChange={(e) =>
                                  handleWorkExperienceChange(
                                    index,
                                    "description",
                                    e.target.value,
                                  )
                                }
                                placeholder="工作描述"
                              ></textarea>
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-6">
                    <p>暂无工作经历, 点击上方“添加”按钮添加工作经历</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 项目经历 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  项目经历
                </CardTitle>
                <Button size="sm" onClick={addProjectExperience}>
                  + 添加
                </Button>
              </CardHeader>
              <CardContent>
                {formData.project_experiences.length > 0 ? (
                  <div className="space-y-4">
                    {formData.project_experiences.map(
                      (proj: ProjectExperience, index: number) => (
                        <div
                          key={index}
                          className="border rounded-lg p-4 relative"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-semibold text-lg">
                              {proj.project_name || `项目经历 ${index + 1}`}
                            </p>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 absolute top-2 right-2"
                              onClick={() => removeProjectExperience(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <Label>项目名称</Label>
                              <Input
                                value={proj.project_name}
                                onChange={(e) =>
                                  handleProjectExperienceChange(
                                    index,
                                    "project_name",
                                    e.target.value,
                                  )
                                }
                                placeholder="项目名称"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label>担任角色</Label>
                              <Input
                                value={proj.role}
                                onChange={(e) =>
                                  handleProjectExperienceChange(
                                    index,
                                    "role",
                                    e.target.value,
                                  )
                                }
                                placeholder="担任角色"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label>开始时间</Label>
                              <Input
                                type="month"
                                value={proj.start_date}
                                onChange={(e) =>
                                  handleProjectExperienceChange(
                                    index,
                                    "start_date",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <Label>结束时间</Label>
                              <Input
                                type="month"
                                value={proj.end_date}
                                onChange={(e) =>
                                  handleProjectExperienceChange(
                                    index,
                                    "end_date",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div className="col-span-2 space-y-1">
                              <Label>技术栈 (用逗号分隔)</Label>
                              <Input
                                value={proj.tech_stack.join(", ")}
                                onChange={(e) =>
                                  handleProjectExperienceChange(
                                    index,
                                    "tech_stack",
                                    e.target.value
                                      .split(",")
                                      .map((s) => s.trim()),
                                  )
                                }
                                placeholder="技术栈"
                              />
                            </div>
                            <div className="col-span-2 space-y-1">
                              <Label>项目描述</Label>
                              <textarea
                                className="w-full min-h-[80px] p-2 border rounded-md"
                                value={proj.description}
                                onChange={(e) =>
                                  handleProjectExperienceChange(
                                    index,
                                    "description",
                                    e.target.value,
                                  )
                                }
                                placeholder="项目描述"
                              ></textarea>
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-6">
                    <p>暂无项目经历, 点击上方“添加”按钮添加项目经历</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
