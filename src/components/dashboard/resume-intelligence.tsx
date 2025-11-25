"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Loader2, Save, Briefcase, FolderKanban } from "lucide-react";
import { toast } from "sonner";
import { UserResume } from "@/components/profile/user-resume";
import { ResumeParseConfirmDialog } from "@/components/resume-parse-confirm-dialog";
import { uploadResume } from "@/action/upload-resume";
import { useUserStore } from "@/store/user";
import type {
  UserProfile,
  WorkExperience,
  ProjectExperience,
  UserProfileFormData,
} from "@/types/profile";

interface ResumeIntelligenceProps {
  userProfile: UserProfile | null;
  onProfileUpdate?: (profile: UserProfile) => void;
}

export function ResumeIntelligence({
  userProfile,
  onProfileUpdate,
}: ResumeIntelligenceProps) {
  const { setUserInfo } = useUserStore();

  // Resume upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [parsedResumeData, setParsedResumeData] = useState<Record<
    string,
    unknown
  > | null>(null);

  // Form states
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<UserProfileFormData>({
    nickname: userProfile?.nickname || "",
    bio: userProfile?.bio || "",
    job_intention: userProfile?.job_intention || "",
    company_intention: userProfile?.company_intention || "",
    skills: userProfile?.skills?.join(", ") || "",
    experience_years: userProfile?.experience_years || 0,
    graduation_date: userProfile?.graduation_date || "",
    work_experiences: (userProfile?.work_experiences || []).map((exp) => ({
      company: exp.company || "",
      position: exp.position || "",
      start_date: exp.start_date || "",
      end_date: exp.end_date || "",
      description: exp.description || "",
    })),
    project_experiences: (userProfile?.project_experiences || []).map(
      (proj) => ({
        project_name: proj.project_name || "",
        role: proj.role || "",
        start_date: proj.start_date || "",
        end_date: proj.end_date || "",
        tech_stack: proj.tech_stack || [],
        description: proj.description || "",
      }),
    ),
    resume_url: userProfile?.resume_url || "",
  });

  const [newSkill, setNewSkill] = useState("");

  // Skills management
  const skills = formData.skills
    ? formData.skills
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean)
    : [];

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newSkill.trim()) {
      e.preventDefault();
      const updatedSkills = [...skills, newSkill.trim()].join(", ");
      setFormData({ ...formData, skills: updatedSkills });
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const updatedSkills = skills
      .filter((s: string) => s !== skillToRemove)
      .join(", ");
    setFormData({ ...formData, skills: updatedSkills });
  };

  // Work experience management
  const handleWorkExperienceChange = (
    index: number,
    field: keyof WorkExperience,
    value: string,
  ) => {
    const newWorkExperiences = [...(formData.work_experiences || [])];
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
        ...(formData.work_experiences || []),
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
    const newWorkExperiences = (formData.work_experiences || []).filter(
      (_, i) => i !== index,
    );
    setFormData({ ...formData, work_experiences: newWorkExperiences });
  };

  // Project experience management
  const handleProjectExperienceChange = (
    index: number,
    field: keyof ProjectExperience,
    value: string | string[],
  ) => {
    const newProjectExperiences = [...(formData.project_experiences || [])];
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
        ...(formData.project_experiences || []),
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
    const newProjectExperiences = (formData.project_experiences || []).filter(
      (_, i) => i !== index,
    );
    setFormData({ ...formData, project_experiences: newProjectExperiences });
  };

  // Resume upload handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setResumeFile(file);
      handleResumeUpload(file);
    }
  };

  const handleResumeUpload = async (file: File) => {
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadProgress("正在上传文件...");

      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      // Progress simulation
      const progressTimer = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev === "正在上传文件...") return "正在解析 PDF 内容...";
          if (prev === "正在解析 PDF 内容...") return "正在使用 AI 分析简历...";
          return prev;
        });
      }, 2000);

      const result = await uploadResume(uploadFormData);
      clearInterval(progressTimer);

      if (result.success && result.data) {
        setParsedResumeData(result.data);
        setIsConfirmDialogOpen(true);
        toast.success("简历解析成功，请确认信息");
      } else {
        toast.error(`简历处理失败: ${result.error}`);
      }
    } catch (error) {
      console.error("Error processing resume:", error);
      toast.error("处理简历时出错");
    } finally {
      setIsUploading(false);
      setUploadProgress("");
    }
  };

  const handleConfirmParse = () => {
    if (parsedResumeData) {
      const {
        skills: parsedSkills,
        work_experiences,
        project_experiences,
        ...restData
      } = parsedResumeData as Record<string, unknown>;

      const formattedWorkExperiences = (
        (work_experiences as Array<Record<string, unknown>>) || []
      ).map((exp) => ({
        company: (exp.company as string) || "",
        position: (exp.position as string) || "",
        start_date: (exp.start_date as string) || "",
        end_date: (exp.end_date as string) || "",
        description: Array.isArray(exp.responsibilities)
          ? (exp.responsibilities as string[]).join("\n")
          : (exp.description as string) || "",
      }));

      const formattedProjectExperiences = (
        (project_experiences as Array<Record<string, unknown>>) || []
      ).map((proj) => {
        const projDescriptionParts: string[] = [];
        if (proj.description)
          projDescriptionParts.push(proj.description as string);
        if (Array.isArray(proj.achievements)) {
          projDescriptionParts.push(...(proj.achievements as string[]));
        } else if (Array.isArray(proj.responsibilities)) {
          projDescriptionParts.push(...(proj.responsibilities as string[]));
        }

        return {
          project_name:
            (proj.name as string) || (proj.project_name as string) || "",
          role: (proj.role as string) || "",
          start_date: (proj.start_date as string) || "",
          end_date: (proj.end_date as string) || "",
          tech_stack: Array.isArray(proj.tech_stack)
            ? (proj.tech_stack as string[])
            : [],
          description: projDescriptionParts.join("\n"),
        };
      });

      setFormData((prev) => ({
        ...prev,
        ...restData,
        skills: Array.isArray(parsedSkills)
          ? (parsedSkills as string[]).join(", ")
          : (parsedSkills as string) || "",
        work_experiences: formattedWorkExperiences,
        project_experiences: formattedProjectExperiences,
        resume_url: (parsedResumeData.resume_url as string) || prev.resume_url,
      }));
    }
    setIsConfirmDialogOpen(false);
    setParsedResumeData(null);
  };

  // Save profile
  const saveProfile = async () => {
    try {
      setIsSaving(true);
      const profileData = {
        ...formData,
        skills: (formData.skills || "")
          .split(",")
          .map((skill: string) => skill.trim())
          .filter(Boolean),
      };

      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Error saving profile:", result.error);
        toast.error("保存失败，请稍后重试");
        return;
      }

      setUserInfo(result.data);
      onProfileUpdate?.(result.data);
      toast.success("个人资料保存成功");
    } catch (error) {
      console.error("Error:", error);
      toast.error("保存失败，请稍后重试");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "experience_years" ? parseInt(value) || 0 : value,
    }));
  };

  return (
    <div className="space-y-6">
      <ResumeParseConfirmDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        onConfirm={handleConfirmParse}
      />

      {/* Resume Upload Section */}
      <UserResume
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        resumeUrl={formData.resume_url}
        resumeFile={resumeFile}
        handleFileChange={handleFileChange}
        handleResumeUpload={handleResumeUpload}
        setResumeFile={setResumeFile}
      />

      {/* Professional Details Form */}
      <div className="space-y-6 rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#141414]">职业信息</h2>
          <Button
            onClick={saveProfile}
            disabled={isSaving}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            保存信息
          </Button>
        </div>

        {/* Basic Info */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="job_intention" className="text-[#141414]">
              目标岗位
            </Label>
            <Input
              id="job_intention"
              name="job_intention"
              value={formData.job_intention}
              onChange={handleInputChange}
              placeholder="如：前端工程师"
              className="border-[#E5E5E5] bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_intention" className="text-[#141414]">
              目标公司
            </Label>
            <Input
              id="company_intention"
              name="company_intention"
              value={formData.company_intention || ""}
              onChange={handleInputChange}
              placeholder="如：字节跳动, 腾讯"
              className="border-[#E5E5E5] bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="experience_years" className="text-[#141414]">
              工作年限
            </Label>
            <Input
              id="experience_years"
              name="experience_years"
              type="number"
              value={formData.experience_years || ""}
              onChange={handleInputChange}
              placeholder="3"
              className="border-[#E5E5E5] bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="graduation_date" className="text-[#141414]">
              毕业时间
            </Label>
            <Input
              id="graduation_date"
              name="graduation_date"
              value={formData.graduation_date || ""}
              onChange={handleInputChange}
              placeholder="如：2020-06"
              className="border-[#E5E5E5] bg-white"
            />
          </div>
        </div>

        {/* Tech Stack & Skills */}
        <div className="space-y-2">
          <Label htmlFor="tech-stack" className="text-[#141414]">
            技术栈 & 技能
          </Label>
          <div className="mb-3 flex flex-wrap gap-2">
            {skills.map((skill: string) => (
              <Badge
                key={skill}
                variant="secondary"
                className="gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-sm text-[#141414]"
              >
                {skill}
                <button
                  onClick={() => handleRemoveSkill(skill)}
                  className="hover:text-red-500"
                  aria-label={`移除 ${skill}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <Input
            id="tech-stack"
            placeholder="输入技能后按 Enter 添加"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={handleAddSkill}
            className="border-[#E5E5E5] bg-white"
          />
          <p className="text-xs text-[#666666]">按 Enter 添加新技能</p>
        </div>

        {/* Work Experience */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-[#141414]">
              <Briefcase className="h-4 w-4" />
              工作经历
            </Label>
            <Button
              type="button"
              variant="ghost"
              onClick={addWorkExperience}
              className="gap-2 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
            >
              <Plus className="h-4 w-4" />
              添加经历
            </Button>
          </div>

          {(formData.work_experiences || []).length > 0 ? (
            <div className="relative space-y-6 pl-6">
              {/* Timeline Line */}
              <div className="absolute left-0 top-2 bottom-2 w-px bg-[#E5E5E5]" />

              {(formData.work_experiences || []).map(
                (exp: WorkExperience, index: number) => (
                  <div key={index} className="relative">
                    {/* Timeline Dot */}
                    <div className="absolute -left-6 top-2 h-3 w-3 rounded-full border-2 border-emerald-600 bg-white" />

                    <div className="space-y-3 rounded-lg border border-[#E5E5E5] bg-white p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 grid gap-3 sm:grid-cols-2">
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
                            className="border-[#E5E5E5]"
                          />
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
                            className="border-[#E5E5E5]"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeWorkExperience(index)}
                          className="ml-2 text-red-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input
                          value={exp.start_date}
                          onChange={(e) =>
                            handleWorkExperienceChange(
                              index,
                              "start_date",
                              e.target.value,
                            )
                          }
                          placeholder="开始时间 (如: 2022-01)"
                          className="border-[#E5E5E5]"
                        />
                        <Input
                          value={exp.end_date}
                          onChange={(e) =>
                            handleWorkExperienceChange(
                              index,
                              "end_date",
                              e.target.value,
                            )
                          }
                          placeholder="结束时间 (如: 至今)"
                          className="border-[#E5E5E5]"
                        />
                      </div>
                      <textarea
                        value={exp.description}
                        onChange={(e) =>
                          handleWorkExperienceChange(
                            index,
                            "description",
                            e.target.value,
                          )
                        }
                        placeholder="工作职责和成就..."
                        className="w-full min-h-[80px] rounded-md border border-[#E5E5E5] bg-white p-3 text-sm"
                      />
                    </div>
                  </div>
                ),
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-[#E5E5E5] p-6 text-center">
              <p className="text-sm text-[#666666]">
                暂无工作经历，点击上方按钮添加
              </p>
            </div>
          )}
        </div>

        {/* Project Experience */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-[#141414]">
              <FolderKanban className="h-4 w-4" />
              项目经历
            </Label>
            <Button
              type="button"
              variant="ghost"
              onClick={addProjectExperience}
              className="gap-2 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
            >
              <Plus className="h-4 w-4" />
              添加项目
            </Button>
          </div>

          {(formData.project_experiences || []).length > 0 ? (
            <div className="relative space-y-6 pl-6">
              {/* Timeline Line */}
              <div className="absolute left-0 top-2 bottom-2 w-px bg-[#E5E5E5]" />

              {(formData.project_experiences || []).map(
                (proj: ProjectExperience, index: number) => (
                  <div key={index} className="relative">
                    {/* Timeline Dot */}
                    <div className="absolute -left-6 top-2 h-3 w-3 rounded-full border-2 border-[#E5E5E5] bg-white" />

                    <div className="space-y-3 rounded-lg border border-[#E5E5E5] bg-white p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 grid gap-3 sm:grid-cols-2">
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
                            className="border-[#E5E5E5]"
                          />
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
                            className="border-[#E5E5E5]"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeProjectExperience(index)}
                          className="ml-2 text-red-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input
                          value={proj.start_date}
                          onChange={(e) =>
                            handleProjectExperienceChange(
                              index,
                              "start_date",
                              e.target.value,
                            )
                          }
                          placeholder="开始时间"
                          className="border-[#E5E5E5]"
                        />
                        <Input
                          value={proj.end_date}
                          onChange={(e) =>
                            handleProjectExperienceChange(
                              index,
                              "end_date",
                              e.target.value,
                            )
                          }
                          placeholder="结束时间"
                          className="border-[#E5E5E5]"
                        />
                      </div>
                      <Input
                        value={
                          Array.isArray(proj.tech_stack)
                            ? proj.tech_stack.join(", ")
                            : ""
                        }
                        onChange={(e) =>
                          handleProjectExperienceChange(
                            index,
                            "tech_stack",
                            e.target.value.split(",").map((s) => s.trim()),
                          )
                        }
                        placeholder="技术栈 (用逗号分隔)"
                        className="border-[#E5E5E5]"
                      />
                      <textarea
                        value={proj.description}
                        onChange={(e) =>
                          handleProjectExperienceChange(
                            index,
                            "description",
                            e.target.value,
                          )
                        }
                        placeholder="项目描述和成果..."
                        className="w-full min-h-[80px] rounded-md border border-[#E5E5E5] bg-white p-3 text-sm"
                      />
                    </div>
                  </div>
                ),
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-[#E5E5E5] p-6 text-center">
              <p className="text-sm text-[#666666]">
                暂无项目经历，点击上方按钮添加
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
