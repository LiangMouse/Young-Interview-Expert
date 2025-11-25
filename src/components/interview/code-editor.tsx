"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const defaultCode = `function reverseList(head) {
  let prev = null;
  let current = head;
  
  while (current !== null) {
    let next = current.next;
    current.next = prev;
    prev = current;
    current = next;
  }
  
  return prev;
}

// Test case
const list = { val: 1, next: { val: 2, next: { val: 3, next: null } } };
console.log(reverseList(list));`;

const tabs = [
  { id: "solution", label: "solution.js" },
  { id: "test", label: "test.js" },
];

export function CodeEditor() {
  const [activeTab, setActiveTab] = useState("solution");
  const [code, setCode] = useState(defaultCode);

  return (
    <div className="flex h-full flex-col bg-[#1E1E20]">
      {/* Tab Bar */}
      <div className="flex border-b border-[#333333] bg-[#1E1E20]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2.5 text-xs font-medium transition-colors",
              activeTab === tab.id
                ? "bg-[#252527] text-[#E5E5E5]"
                : "text-[#888888] hover:text-[#E5E5E5]",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-auto p-4">
        <div className="font-mono text-sm">
          {code.split("\n").map((line, index) => (
            <div key={index} className="flex">
              <span className="mr-4 w-8 select-none text-right text-[#555555]">
                {index + 1}
              </span>
              <span className="flex-1 text-[#E5E5E5]">
                <code
                  dangerouslySetInnerHTML={{ __html: highlightSyntax(line) }}
                />
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function highlightSyntax(line: string): string {
  // Simple syntax highlighting
  return line
    .replace(
      /\b(function|const|let|var|return|if|else|while|for|null)\b/g,
      '<span style="color: #C586C0">$1</span>',
    )
    .replace(/\b(true|false)\b/g, '<span style="color: #4FC1FF">$1</span>')
    .replace(/"([^"]*)"/g, '<span style="color: #CE9178">"$1"</span>')
    .replace(/\/\/(.*)/g, '<span style="color: #6A9955">//$1</span>')
    .replace(/\b(\d+)\b/g, '<span style="color: #B5CEA8">$1</span>');
}
