import { useState } from "react";
import { useSuggestTasks } from "../hooks/useAI";
import type { SuggestedTask } from "../hooks/useAI";

const PRIORITY_COLORS = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-red-100 text-red-700",
};

interface Props {
  projectName: string;
  projectDescription: string | null;
  onAddTask: (title: string, priority: "low" | "medium" | "high") => void;
}

export default function AISuggestTasks({
  projectName,
  projectDescription,
  onAddTask,
}: Props) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedTask[]>([]);
  const suggestTasks = useSuggestTasks();

  async function handleSuggest() {
    const result = await suggestTasks.mutateAsync({
      project_name: projectName,
      description: projectDescription,
    });
    setSuggestions(result);
    setOpen(true);
  }

  function handleAdd(task: SuggestedTask) {
    onAddTask(task.title, task.priority);
    setSuggestions((prev) => prev.filter((t) => t.title !== task.title));
  }

  return (
    <div className="mt-4">
      {!open && (
        <button
          onClick={handleSuggest}
          disabled={suggestTasks.isPending}
          className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          <span>🤖</span>
          {suggestTasks.isPending ? "Generating suggestions..." : "Suggest tasks with AI"}
        </button>
      )}

      {open && suggestions.length > 0 && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-purple-700">
              🤖 AI Suggestions — click to add
            </p>
            <button
              onClick={() => { setOpen(false); setSuggestions([]); }}
              className="text-gray-400 hover:text-gray-600 text-sm"
              aria-label="Close suggestions"
            >
              ✕
            </button>
          </div>
          <div className="space-y-2">
            {suggestions.map((task, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-purple-100"
              >
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority]}`}>
                    {task.priority}
                  </span>
                  <span className="text-sm text-gray-800">{task.title}</span>
                </div>
                <button
                  onClick={() => handleAdd(task)}
                  className="text-xs bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  + Add
                </button>
              </div>
            ))}
          </div>
          {suggestions.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-2">All suggestions have been added!</p>
          )}
        </div>
      )}

      {suggestTasks.isError && (
        <p className="text-red-500 text-xs mt-1">AI service error — please try again later</p>
      )}
    </div>
  );
}
