"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function QuickStartCard() {
  const [position, setPosition] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("");

  return (
    <div className="rounded-lg border border-[#E5E5E5] bg-white p-10 shadow-sm lg:p-12">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-light text-[#141414] lg:text-3xl">
            Start Interview Simulation
          </h2>
          <p className="text-[#666666]">Configure your settings to begin</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-[#666666]">
              Topic
            </label>
            <Select value={position} onValueChange={setPosition}>
              <SelectTrigger className="border-[#E5E5E5] bg-white text-[#141414] h-12">
                <SelectValue placeholder="Select topic" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="frontend">Frontend Developer</SelectItem>
                <SelectItem value="backend">Backend Developer</SelectItem>
                <SelectItem value="fullstack">Full Stack Developer</SelectItem>
                <SelectItem value="mobile">Mobile Developer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-[#666666]">
              Difficulty
            </label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="border-[#E5E5E5] bg-white text-[#141414] h-12">
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          size="lg"
          className="w-full bg-[#0F3E2E] text-base font-normal text-white hover:bg-[#0F3E2E]/90 h-12"
        >
          Start Simulation
        </Button>
      </div>
    </div>
  );
}
