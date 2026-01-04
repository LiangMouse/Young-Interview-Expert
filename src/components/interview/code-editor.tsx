"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const defaultCode = ``;

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
  // Escape HTML characters first for safety
  const escaped = line
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Single regex to match strings, comments, keywords, booleans, and numbers
  // Order matters: Strings and comments effectively "consume" the text so keywords inside them aren't matched.
  const tokenRegex =
    /("[^"]*"|\/\/.*|\b(?:function|const|let|var|return|if|else|while|for|null)\b|\b(?:true|false)\b|\b\d+\b)/g;

  return escaped.replace(tokenRegex, (match) => {
    let color = "";
    if (match.startsWith('"')) {
      color = "#CE9178"; // Strings
    } else if (match.startsWith("//")) {
      color = "#6A9955"; // Comments
    } else if (/^\d+$/.test(match)) {
      color = "#B5CEA8"; // Numbers
    } else if (/^(true|false)$/.test(match)) {
      color = "#4FC1FF"; // Booleans
    } else {
      color = "#C586C0"; // Keywords
    }

    return `<span style="color: ${color}">${match}</span>`;
  });
}
