import { useState } from "react";
import { useParseTask } from "../hooks/useAI";
import type { ParsedTask } from "../hooks/useAI";

interface Props {
  onParsed: (task: ParsedTask) => void;
}

export default function AITaskInput({ onParsed }: Props) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const parseTask = useParseTask();

  async function handleParse() {
    if (!text.trim()) return;
    const result = await parseTask.mutateAsync(text.trim());
    onParsed(result);
    setText("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium mt-2"
      >
        <span>✨</span> Create task with AI
      </button>
    );
  }

  return (
    <div className="mt-3 p-4 bg-brand-50 border border-brand-200 rounded-lg">
      <p className="text-xs font-medium text-brand-700 mb-2">
        ✨ Describe your task in natural language
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleParse()}
          placeholder='e.g. "Fix the login bug by Friday, high priority"'
          className="flex-1 border border-brand-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          aria-label="AI task description"
          autoFocus
        />
        <button
          onClick={handleParse}
          disabled={parseTask.isPending || !text.trim()}
          className="bg-brand-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          {parseTask.isPending ? "..." : "Parse"}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="text-gray-400 hover:text-gray-600 px-2"
          aria-label="Close AI input"
        >
          ✕
        </button>
      </div>
      {parseTask.isError && (
        <p className="text-red-500 text-xs mt-2">
          AI service error — please fill in manually
        </p>
      )}
    </div>
  );
}
