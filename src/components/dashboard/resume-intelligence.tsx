"use client";

import type React from "react";
import { useState, useCallback, useEffect } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Cloud,
  X,
  Plus,
  FileText,
  Loader2,
  CheckCircle2,
  Save,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { uploadResume } from "@/action/upload-resume";
import { updateUserProfile } from "@/action/user-profile";
import { useUserStore } from "@/store/user";
import { toast } from "sonner";
import type { WorkExperience } from "@/types/profile";

/** 简历上传配置 */
const RESUME_CONFIG = {
  maxSize: 10 * 1024 * 1024, // 10MB
  accept: {
    "application/pdf": [".pdf"],
  },
} as const;

export function ResumeIntelligence() {
  const t = useTranslations("profile.resume");
  const { userInfo, setUserInfo } = useUserStore();

  // 表单状态
  const [jobIntention, setJobIntention] = useState<string>("");
  const [experienceYears, setExperienceYears] = useState<number | undefined>(
    undefined,
  );
  const [techStack, setTechStack] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);

  // 上传状态
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "parsing" | "success" | "error"
  >("idle");

  // 保存状态
  const [isSaving, setIsSaving] = useState(false);

  // 从 userInfo 初始化表单数据
  useEffect(() => {
    if (userInfo) {
      setJobIntention(userInfo.job_intention || "");
      setExperienceYears(userInfo.experience_years ?? undefined);
      setTechStack(userInfo.skills || []);
      setWorkExperiences(userInfo.work_experiences || []);
    }
  }, [userInfo]);

  // 处理文件验证失败
  const handleDropRejected = useCallback((rejections: FileRejection[]) => {
    const rejection = rejections[0];
    if (!rejection) return;

    const error = rejection.errors[0];
    if (error?.code === "file-too-large") {
      toast.error("文件大小不能超过 10MB");
    } else if (error?.code === "file-invalid-type") {
      toast.error("请上传 PDF 格式的简历文件");
    } else {
      toast.error("文件上传失败，请重试");
    }
  }, []);

  // 处理文件上传
  const handleDropAccepted = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;

      setUploadedFile(file);
      setIsUploading(true);
      setUploadStatus("uploading");

      try {
        // 创建 FormData
        const formData = new FormData();
        formData.append("file", file);

        setUploadStatus("parsing");
        const result = await uploadResume(formData);

        if (!result.success) {
          toast.error(result.error || "上传失败");
          setUploadStatus("error");
          return;
        }

        // 更新 store 中的用户信息，并同步到表单
        if (result.data) {
          setUserInfo(result.data);
          // 自动填充表单数据
          if (result.data.job_intention) {
            setJobIntention(result.data.job_intention);
          }
          if (
            result.data.experience_years !== null &&
            result.data.experience_years !== undefined
          ) {
            setExperienceYears(result.data.experience_years);
          }
          if (result.data.skills) {
            setTechStack(result.data.skills);
          }
          if (result.data.work_experiences) {
            setWorkExperiences(result.data.work_experiences);
          }
        }

        toast.success("简历解析成功，信息已自动填充");
        setUploadStatus("success");
      } catch (err) {
        console.error("Failed to upload resume:", err);
        toast.error("上传失败，请重试");
        setUploadStatus("error");
      } finally {
        setIsUploading(false);
      }
    },
    [setUserInfo],
  );

  // 使用 react-dropzone hook
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: RESUME_CONFIG.accept,
    maxSize: RESUME_CONFIG.maxSize,
    multiple: false,
    noClick: false,
    onDropAccepted: handleDropAccepted,
    onDropRejected: handleDropRejected,
    disabled: isUploading,
  });

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newSkill.trim()) {
      if (!techStack.includes(newSkill.trim())) {
        setTechStack([...techStack, newSkill.trim()]);
      }
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setTechStack(techStack.filter((skill) => skill !== skillToRemove));
  };

  // 保存表单数据
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const result = await updateUserProfile({
        job_intention: jobIntention || undefined,
        experience_years: experienceYears,
        skills: techStack.join(", "),
        work_experiences:
          workExperiences.length > 0 ? workExperiences : undefined,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.profile) {
        setUserInfo(result.profile);
        toast.success("保存成功");
      }
    } catch (err) {
      console.error("Failed to save profile:", err);
      toast.error("保存失败，请重试");
    } finally {
      setIsSaving(false);
    }
  }, [jobIntention, experienceYears, techStack, workExperiences, setUserInfo]);

  // 添加工作经历
  const handleAddWorkExperience = () => {
    const newExp: WorkExperience = {
      company: "",
      position: "",
      start_date: "",
      end_date: "",
      description: "",
    };
    setWorkExperiences([...workExperiences, newExp]);
  };

  // 删除工作经历
  const handleRemoveWorkExperience = (index: number) => {
    setWorkExperiences(workExperiences.filter((_, i) => i !== index));
  };

  // 更新工作经历
  const handleUpdateWorkExperience = (
    index: number,
    field: keyof WorkExperience,
    value: string,
  ) => {
    const updated = [...workExperiences];
    updated[index] = { ...updated[index], [field]: value };
    setWorkExperiences(updated);
  };

  // 渲染上传区域内容
  const renderDropzoneContent = () => {
    if (isUploading) {
      return (
        <>
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-emerald-600" />
          <h3 className="mb-2 text-lg font-medium text-[#141414]">
            {uploadStatus === "parsing" ? "AI 正在解析简历..." : "正在上传..."}
          </h3>
          <p className="text-sm text-[#666666]">{uploadedFile?.name}</p>
        </>
      );
    }

    if (uploadStatus === "success" && uploadedFile) {
      return (
        <>
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-600" />
          <h3 className="mb-2 text-lg font-medium text-[#141414]">解析完成</h3>
          <div className="mb-4 flex items-center justify-center gap-2 text-sm text-[#666666]">
            <FileText className="h-4 w-4" />
            {uploadedFile.name}
          </div>
          <Button
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              setUploadStatus("idle");
              setUploadedFile(null);
            }}
            className="border-[#E5E5E5] bg-white hover:bg-[#F5F5F5]"
          >
            重新上传
          </Button>
        </>
      );
    }

    return (
      <>
        <Cloud
          className={`mx-auto mb-4 h-12 w-12 transition-colors ${
            isDragActive ? "text-emerald-700" : "text-emerald-600"
          }`}
        />
        <h3 className="mb-2 text-lg font-medium text-[#141414]">
          {isDragActive ? "松开以上传文件" : t("autoParseTitle")}
        </h3>
        <p className="mb-4 text-sm text-[#666666]">
          {isDragActive ? "支持 PDF 格式" : t("autoParseDesc")}
        </p>
        <Button
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
          className="border-[#E5E5E5] bg-white hover:bg-[#F5F5F5]"
        >
          {t("chooseFile")}
        </Button>
      </>
    );
  };

  return (
    <div className="space-y-6">
      {/* 拖拽上传区域 */}
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-all ${
          isDragActive
            ? "border-emerald-500 bg-emerald-100/50"
            : isUploading
              ? "border-emerald-400/50 bg-emerald-50/30"
              : uploadStatus === "success"
                ? "border-emerald-500/50 bg-emerald-50/50"
                : "border-emerald-500/30 bg-emerald-50/50 hover:border-emerald-500/50 hover:bg-emerald-50/70"
        }`}
      >
        <input {...getInputProps()} />
        {renderDropzoneContent()}
      </div>

      {/* Professional Details Form */}
      <div className="space-y-6 rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#141414]">
            {t("professionalDetails")}
          </h2>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2 bg-[#0F3E2E] text-white hover:bg-[#0F3E2E]/90"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                保存
              </>
            )}
          </Button>
        </div>

        <div className="flex gap-4">
          <div className="w-[60%] space-y-2">
            <Label htmlFor="target-role" className="text-[#141414]">
              {t("targetRole")}
            </Label>
            <Select value={jobIntention} onValueChange={setJobIntention}>
              <SelectTrigger
                id="target-role"
                className="border-[#E5E5E5] bg-white"
              >
                <SelectValue placeholder={t("targetRole")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="frontend">{t("roles.frontend")}</SelectItem>
                <SelectItem value="backend">{t("roles.backend")}</SelectItem>
                <SelectItem value="fullstack">
                  {t("roles.fullstack")}
                </SelectItem>
                <SelectItem value="devops">{t("roles.devops")}</SelectItem>
                <SelectItem value="mobile">{t("roles.mobile")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-[40%] space-y-2">
            <Label htmlFor="experience" className="text-[#141414]">
              {t("yearsOfExperience")}
            </Label>
            <Input
              id="experience"
              type="number"
              placeholder="0"
              value={experienceYears ?? ""}
              onChange={(e) =>
                setExperienceYears(
                  e.target.value ? parseInt(e.target.value, 10) : undefined,
                )
              }
              className="border-[#E5E5E5] bg-white"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tech-stack" className="text-[#141414]">
            {t("techStack")}
          </Label>
          <div className="mb-3 flex flex-wrap gap-2">
            {techStack.map((skill) => (
              <Badge
                key={skill}
                variant="secondary"
                className="gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-sm text-[#141414]"
              >
                {skill}
                <button
                  onClick={() => handleRemoveSkill(skill)}
                  className="hover:text-[#0F3E2E]"
                  aria-label={`Remove ${skill}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <Input
            id="tech-stack"
            placeholder={t("typeSkillHint")}
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={handleAddSkill}
            className="border-[#E5E5E5] bg-white"
          />
          <p className="text-xs text-[#666666]">{t("pressEnterHint")}</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-[#141414]">{t("workExperience")}</Label>
            <Button
              variant="ghost"
              onClick={handleAddWorkExperience}
              className="gap-2 text-[#0F3E2E] hover:bg-[#0F3E2E]/5 hover:text-[#0F3E2E]"
            >
              <Plus className="h-4 w-4" />
              {t("addExperience")}
            </Button>
          </div>

          {/* Timeline Container */}
          {workExperiences.length > 0 ? (
            <div className="relative space-y-6 pl-6">
              {/* Vertical Timeline Line */}
              <div className="absolute left-0 top-2 bottom-2 w-px bg-[#E5E5E5]" />

              {workExperiences.map((exp, index) => (
                <div key={index} className="relative">
                  {/* Timeline Dot */}
                  <div
                    className={`absolute -left-6 top-2 h-3 w-3 rounded-full border-2 ${
                      index === 0
                        ? "border-[#0F3E2E] bg-white"
                        : "border-[#E5E5E5] bg-white"
                    }`}
                  />

                  <div className="space-y-3 rounded-lg border border-[#E5E5E5] bg-white p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder="职位名称"
                          value={exp.position}
                          onChange={(e) =>
                            handleUpdateWorkExperience(
                              index,
                              "position",
                              e.target.value,
                            )
                          }
                          className="border-[#E5E5E5] bg-white font-bold"
                        />
                        <Input
                          placeholder="公司名称"
                          value={exp.company}
                          onChange={(e) =>
                            handleUpdateWorkExperience(
                              index,
                              "company",
                              e.target.value,
                            )
                          }
                          className="border-[#E5E5E5] bg-white text-sm"
                        />
                        <div className="flex gap-2">
                          <Input
                            placeholder="开始日期 (YYYY-MM)"
                            value={exp.start_date}
                            onChange={(e) =>
                              handleUpdateWorkExperience(
                                index,
                                "start_date",
                                e.target.value,
                              )
                            }
                            className="border-[#E5E5E5] bg-white text-xs"
                          />
                          <Input
                            placeholder="结束日期 (YYYY-MM) 或 至今"
                            value={exp.end_date}
                            onChange={(e) =>
                              handleUpdateWorkExperience(
                                index,
                                "end_date",
                                e.target.value,
                              )
                            }
                            className="border-[#E5E5E5] bg-white text-xs"
                          />
                        </div>
                        <textarea
                          placeholder="工作描述（每行一条，用 • 开头）"
                          value={exp.description}
                          onChange={(e) =>
                            handleUpdateWorkExperience(
                              index,
                              "description",
                              e.target.value,
                            )
                          }
                          rows={4}
                          className="w-full resize-none rounded-md border border-[#E5E5E5] bg-white p-2 text-sm text-[#666666] focus:outline-none focus:ring-2 focus:ring-[#0F3E2E]/20"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveWorkExperience(index)}
                        className="ml-2 h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-[#E5E5E5] bg-[#F5F5F5] p-8 text-center">
              <p className="text-sm text-[#666666]">
                暂无工作经历，点击上方按钮添加
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
