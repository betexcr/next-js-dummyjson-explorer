"use client";

/**
 * JSON request body editor (TASK-022). Bound to the `BODY_PARAM` sentinel
 * value; validates on blur and while editing after a first error so users
 * get feedback without fighting the keyboard.
 */
import { useState } from "react";
import { validateJsonBody } from "./request-form";

export interface BodyEditorProps {
  /** Raw body string under the `BODY_PARAM` sentinel. */
  value: string;
  onChange: (next: string) => void;
}

export function BodyEditor({ value, onChange }: BodyEditorProps) {
  const [error, setError] = useState<string | null>(null);

  const handleBlur = (): void => {
    setError(validateJsonBody(value));
  };

  const handleChange = (next: string): void => {
    onChange(next);
    // Re-validate live once an error has been shown so it clears as the user
    // fixes the JSON.
    if (error !== null) setError(validateJsonBody(next));
  };

  return (
    <div className="space-y-1">
      <div className="relative">
        <textarea
          aria-label="Request body (JSON)"
          aria-invalid={error !== null}
          aria-describedby={error !== null ? "body-error" : undefined}
          spellCheck={false}
          rows={9}
          value={value}
          onBlur={handleBlur}
          onChange={(event) => handleChange(event.target.value)}
          onKeyDown={(event) => {
            // Tab inserts two spaces instead of moving focus.
            if (event.key === "Tab") {
              event.preventDefault();
              const target = event.currentTarget;
              const { selectionStart, selectionEnd, value: text } = target;
              const next = `${text.slice(0, selectionStart)}  ${text.slice(selectionEnd)}`;
              onChange(next);
              requestAnimationFrame(() => {
                target.selectionStart = target.selectionEnd = selectionStart + 2;
              });
            }
          }}
          className="w-full resize-y rounded-md border border-zinc-200 bg-white p-2.5 font-mono text-xs leading-relaxed text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>
      {error !== null && (
        <p id="body-error" role="alert" className="text-[11px] text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}