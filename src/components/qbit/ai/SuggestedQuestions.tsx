"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import type { SuggestedQuestionEntry } from "@/lib/ai/types";

/**
 * SuggestedQuestions — clickable question chips shown above the chat input.
 */
export function SuggestedQuestions({
  questions,
  onSelect,
  className,
}: {
  questions: SuggestedQuestionEntry[];
  onSelect?: (question: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {questions.map((q) => (
        <button
          key={q.id}
          onClick={() => onSelect?.(q.question)}
          className="inline-flex items-center gap-1.5 rounded-full border border-qbit-primary bg-qbit-surface-container-lowest px-3 py-1.5 text-xs font-medium text-qbit-primary transition-all hover:bg-qbit-primary hover:text-qbit-on-primary active:scale-95"
        >
          {q.icon && <Icon name={q.icon} className="text-[14px]" />}
          {q.question}
        </button>
      ))}
    </div>
  );
}
