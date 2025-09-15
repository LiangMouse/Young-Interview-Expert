"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileText, Loader2, Upload } from "lucide-react";
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
                预计需要 30 秒左右，请耐心等待...
              </p>
            </div>
          ) : resumeUrl ? (
            <div className="flex flex-col items-center gap-3">
              <FileText className="w-10 h-10 text-green-500" />
              <p className="text-sm font-medium text-gray-700">
                已上传一份简历
              </p>
              <div className="flex gap-2 mt-2">
                <Button asChild size="sm" variant="outline">
                  <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                    查看
                  </a>
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    document.getElementById("resume-upload")?.click()
                  }
                  disabled={isUploading}
                >
                  替换
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-2">
                {resumeFile
                  ? `已选择文件: ${resumeFile.name}`
                  : "拖拽PDF简历到此处或点击上传"}
              </p>
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
          <Input
            id="resume-upload"
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept=".pdf"
            disabled={isUploading}
          />
        </div>
      </CardContent>
    </Card>
  );
}
