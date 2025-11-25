"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Loader2, Cloud } from "lucide-react";
import React from "react";

interface UserResumeProps {
  isUploading: boolean;
  uploadProgress: string;
  resumeUrl: string | undefined;
  resumeFile: File | null;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleResumeUpload: (file: File) => void;
  setResumeFile: (file: File | null) => void;
}

export function UserResume({
  isUploading,
  uploadProgress,
  resumeUrl,
  resumeFile,
  handleFileChange,
  handleResumeUpload,
  setResumeFile,
}: UserResumeProps) {
  return (
    <div className="rounded-xl border-2 border-dashed border-emerald-500/30 bg-emerald-50/50 p-8 text-center">
      <div
        className={`transition-all ${
          isUploading ? "opacity-50 pointer-events-none" : ""
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.dataTransfer.files && e.dataTransfer.files[0] && !isUploading) {
            setResumeFile(e.dataTransfer.files[0]);
            handleResumeUpload(e.dataTransfer.files[0]);
          }
        }}
      >
        {isUploading ? (
          <div className="flex flex-col items-center py-4">
            <Loader2 className="h-12 w-12 text-emerald-600 animate-spin mb-4" />
            <p className="text-sm text-emerald-700 font-medium mb-2">
              {uploadProgress}
            </p>
            <p className="text-xs text-gray-500">
              预计需要 30 秒左右，请耐心等待...
            </p>
          </div>
        ) : resumeUrl ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <FileText className="h-12 w-12 text-emerald-600" />
            <div>
              <p className="text-base font-medium text-[#141414] mb-1">
                简历已上传
              </p>
              <p className="text-sm text-gray-500">
                点击下方按钮查看或替换简历
              </p>
            </div>
            <div className="flex gap-3 mt-2">
              <Button
                asChild
                size="sm"
                variant="outline"
                className="border-[#E5E5E5]"
              >
                <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                  查看简历
                </a>
              </Button>
              <Button
                size="sm"
                variant="default"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() =>
                  document.getElementById("resume-upload")?.click()
                }
              >
                替换简历
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Cloud className="mx-auto mb-4 h-12 w-12 text-emerald-600" />
            <h3 className="mb-2 text-lg font-medium text-[#141414]">
              智能简历解析
            </h3>
            <p className="mb-4 text-sm text-[#666666]">
              {resumeFile
                ? `已选择文件: ${resumeFile.name}`
                : "拖拽 PDF 简历到此处，或点击上传按钮"}
            </p>
            <Button
              variant="outline"
              className="border-[#E5E5E5] bg-white hover:bg-[#F5F5F5]"
              onClick={() => document.getElementById("resume-upload")?.click()}
            >
              选择文件
            </Button>
          </>
        )}
      </div>
      <Input
        id="resume-upload"
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept=".pdf"
        disabled={isUploading}
      />
    </div>
  );
}
