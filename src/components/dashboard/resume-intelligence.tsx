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

export function ResumeIntelligence() {
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
      {/* Resume Import Section */}
      <div className="rounded-xl border-2 border-dashed border-[#E5E5E5] bg-gray-50/50 p-12 text-center">
        <Cloud className="mx-auto mb-4 h-12 w-12 text-[#666666]" />
        <h3 className="mb-2 text-lg font-medium text-[#141414]">
          Auto-Parse Your Resume
        </h3>
        <p className="mb-4 text-sm text-[#666666]">
          Drag & drop your PDF resume here to extract professional details
          automatically
        </p>
        <Button variant="outline" className="border-[#E5E5E5] bg-white">
          Choose File
        </Button>
      </div>

      {/* Professional Details Form */}
      <div className="space-y-6 rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-[#141414]">
          Professional Details
        </h2>

        {/* Target Position */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="target-role" className="text-[#141414]">
              Target Role
            </Label>
            <Select defaultValue="frontend">
              <SelectTrigger
                id="target-role"
                className="border-[#E5E5E5] bg-white"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="frontend">Frontend Engineer</SelectItem>
                <SelectItem value="backend">Backend Engineer</SelectItem>
                <SelectItem value="fullstack">Full Stack Engineer</SelectItem>
                <SelectItem value="devops">DevOps Engineer</SelectItem>
                <SelectItem value="mobile">Mobile Developer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="experience" className="text-[#141414]">
              Years of Experience
            </Label>
            <Input
              id="experience"
              type="number"
              placeholder="3"
              className="border-[#E5E5E5] bg-white"
            />
          </div>
        </div>

        {/* Tech Stack */}
        <div className="space-y-2">
          <Label htmlFor="tech-stack" className="text-[#141414]">
            Tech Stack & Skills
          </Label>
          <div className="mb-3 flex flex-wrap gap-2">
            {techStack.map((skill) => (
              <Badge
                key={skill}
                variant="secondary"
                className="bg-gray-100 px-3 py-1.5 text-sm text-[#141414]"
              >
                {skill}
                <button
                  onClick={() => handleRemoveSkill(skill)}
                  className="ml-2 hover:text-[#0F3E2E]"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <Input
            id="tech-stack"
            placeholder="Type a skill and press Enter"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={handleAddSkill}
            className="border-[#E5E5E5] bg-white"
          />
          <p className="text-xs text-[#666666]">
            Press Enter to add a new skill
          </p>
        </div>

        {/* Experience & Projects */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-[#141414]">Work & Project Experience</Label>
            <Button
              variant="ghost"
              className="gap-2 text-[#0F3E2E] hover:bg-[#0F3E2E]/5 hover:text-[#0F3E2E]"
            >
              <Plus className="h-4 w-4" />
              Add Experience
            </Button>
          </div>

          {/* Experience Item 1 */}
          <div className="space-y-3 rounded-lg border border-[#E5E5E5] bg-white p-4">
            <div>
              <h3 className="font-medium text-[#141414]">
                Senior Frontend Developer at TechCorp
              </h3>
              <p className="text-sm text-[#666666]">Jan 2022 - Present</p>
            </div>
            <ul className="space-y-1 text-sm text-[#666666]">
              <li>
                • Led development of customer dashboard using React and
                TypeScript
              </li>
              <li>• Improved application performance by 40%</li>
              <li>• Mentored junior developers and conducted code reviews</li>
            </ul>
          </div>

          {/* Experience Item 2 */}
          <div className="space-y-3 rounded-lg border border-[#E5E5E5] bg-white p-4">
            <div>
              <h3 className="font-medium text-[#141414]">
                Frontend Developer at StartupXYZ
              </h3>
              <p className="text-sm text-[#666666]">Jun 2020 - Dec 2021</p>
            </div>
            <ul className="space-y-1 text-sm text-[#666666]">
              <li>
                • Built responsive web applications using modern JavaScript
                frameworks
              </li>
              <li>
                • Collaborated with design team to implement pixel-perfect UIs
              </li>
              <li>• Integrated RESTful APIs and managed state with Redux</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
