"use client";

import type React from "react";

import { useState } from "react";
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
import { Cloud, X, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

export function ResumeIntelligence() {
  const t = useTranslations("profile.resume");
  const [techStack, setTechStack] = useState([
    "React",
    "Node.js",
    "TypeScript",
  ]);
  const [newSkill, setNewSkill] = useState("");

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newSkill.trim()) {
      setTechStack([...techStack, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setTechStack(techStack.filter((skill) => skill !== skillToRemove));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border-2 border-dashed border-emerald-500/30 bg-emerald-50/50 p-12 text-center">
        <Cloud className="mx-auto mb-4 h-12 w-12 text-emerald-600" />
        <h3 className="mb-2 text-lg font-medium text-[#141414]">
          {t("autoParseTitle")}
        </h3>
        <p className="mb-4 text-sm text-[#666666]">{t("autoParseDesc")}</p>
        <Button
          variant="outline"
          className="border-[#E5E5E5] bg-white hover:bg-[#F5F5F5]"
        >
          {t("chooseFile")}
        </Button>
      </div>

      {/* Professional Details Form */}
      <div className="space-y-6 rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-[#141414]">
          {t("professionalDetails")}
        </h2>

        <div className="flex gap-4">
          <div className="w-[60%] space-y-2">
            <Label htmlFor="target-role" className="text-[#141414]">
              {t("targetRole")}
            </Label>
            <Select defaultValue="frontend">
              <SelectTrigger
                id="target-role"
                className="border-[#E5E5E5] bg-white"
              >
                <SelectValue />
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
              placeholder="3"
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
              className="gap-2 text-[#0F3E2E] hover:bg-[#0F3E2E]/5 hover:text-[#0F3E2E]"
            >
              <Plus className="h-4 w-4" />
              {t("addExperience")}
            </Button>
          </div>

          {/* Timeline Container */}
          <div className="relative space-y-6 pl-6">
            {/* Vertical Timeline Line */}
            <div className="absolute left-0 top-2 bottom-2 w-px bg-[#E5E5E5]" />

            {/* Experience Item 1 */}
            <div className="relative">
              {/* Timeline Dot */}
              <div className="absolute -left-6 top-2 h-3 w-3 rounded-full border-2 border-[#0F3E2E] bg-white" />

              <div className="space-y-2 rounded-lg border border-[#E5E5E5] bg-white p-4">
                <div>
                  <h3 className="font-bold text-[#141414]">
                    Senior Frontend Developer
                  </h3>
                  <p className="text-sm text-[#666666]">TechCorp</p>
                  <p className="text-xs text-[#999999]">
                    Jan 2022 - {t("present")}
                  </p>
                </div>
                <ul className="space-y-1 text-sm text-[#666666]">
                  <li>
                    • Led development of customer dashboard using React and
                    TypeScript
                  </li>
                  <li>• Improved application performance by 40%</li>
                  <li>
                    • Mentored junior developers and conducted code reviews
                  </li>
                </ul>
              </div>
            </div>

            {/* Experience Item 2 */}
            <div className="relative">
              {/* Timeline Dot */}
              <div className="absolute -left-6 top-2 h-3 w-3 rounded-full border-2 border-[#E5E5E5] bg-white" />

              <div className="space-y-2 rounded-lg border border-[#E5E5E5] bg-white p-4">
                <div>
                  <h3 className="font-bold text-[#141414]">
                    Frontend Developer
                  </h3>
                  <p className="text-sm text-[#666666]">StartupXYZ</p>
                  <p className="text-xs text-[#999999]">Jun 2020 - Dec 2021</p>
                </div>
                <ul className="space-y-1 text-sm text-[#666666]">
                  <li>
                    • Built responsive web applications using modern JavaScript
                    frameworks
                  </li>
                  <li>
                    • Collaborated with design team to implement pixel-perfect
                    UIs
                  </li>
                  <li>
                    • Integrated RESTful APIs and managed state with Redux
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
