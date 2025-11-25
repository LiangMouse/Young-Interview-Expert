"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "./code-editor";

export function CodeWorkbench() {
  const [isQuestionExpanded, setIsQuestionExpanded] = useState(true);

  return (
    <div className="flex w-full flex-col overflow-hidden bg-[#FDFCF8] lg:w-[60%]">
      {/* Question Card */}
      <div className="border-b border-l border-[#E5E5E5] bg-white">
        <div
          className="flex cursor-pointer items-center justify-between p-4"
          onClick={() => setIsQuestionExpanded(!isQuestionExpanded)}
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-[#999999]">
              Problem 3
            </span>
            <h3 className="text-lg font-bold text-[#141414]">
              Reverse a Linked List
            </h3>
          </div>
          <Button variant="ghost" size="sm">
            {isQuestionExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {isQuestionExpanded && (
          <div className="border-t border-[#E5E5E5] p-4 space-y-3">
            <p className="text-sm leading-relaxed text-[#666666]">
              Given the head of a singly linked list, reverse the list, and
              return the reversed list.
            </p>
            <div className="space-y-2">
              <p className="text-xs font-medium text-[#141414]">Example:</p>
              <pre className="rounded bg-[#F5F5F5] p-3 text-xs text-[#666666]">
                Input: head = [1,2,3,4,5]{"\n"}
                Output: [5,4,3,2,1]
              </pre>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-[#666666] hover:text-[#141414]"
            >
              <Lightbulb className="mr-2 h-4 w-4" />
              Show Hint
            </Button>
          </div>
        )}
      </div>

      {/* Code Editor */}
      <div className="flex-1 overflow-hidden border-l border-[#E5E5E5]">
        <CodeEditor />
      </div>
    </div>
  );
}
