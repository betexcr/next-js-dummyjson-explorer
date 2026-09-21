"use client";

/**
 * Type-aware parameter field (TASK-022). Renders the correct control from a
 * registry `ParameterDefinition`: number input, enum select, checkbox,
 * JSON textarea, or plain text. Registry `select` parameters accept free-form
 * comma-separated values (e.g. DummyJSON's `select` field list), so they are
 * rendered as text inputs, not fixed-choice dropdowns. The value travels as a
 * string (matching the request builder's serialization semantics).
 */
import type { ParameterDefinition, ParameterValues } from "@/lib/dummyjson/types";

export interface ParamFieldProps {
  definition: ParameterDefinition;
  value: ParameterValues[string];
  onChange: (next: ParameterValues[string]) => void;
}

const inputClass =
  "w-full rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 font-mono text-xs text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

export function ParamField({ definition, value, onChange }: ParamFieldProps) {
  const id = `param-${definition.name}`;
  const current = String(value ?? "");

  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="flex items-baseline justify-between gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300"
      >
        <span className="font-mono">
          {definition.name}
          {definition.required && (
            <span aria-hidden="true" className="ml-0.5 text-rose-500">
              *
            </span>
          )}
        </span>
        <span className="text-[10px] font-normal normal-case tracking-normal text-zinc-400">
          {definition.in}
        </span>
      </label>

      {definition.type === "boolean" ? (
        <input
          id={id}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
          className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
        />
      ) : definition.type === "enum" ? (
        <select
          id={id}
          value={current}
          onChange={(event) => onChange(event.target.value)}
          className={inputClass}
        >
          <option value="">— (unset) —</option>
          {(definition.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : definition.type === "number" ? (
        <input
          id={id}
          type="number"
          value={current}
          placeholder={definition.placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={inputClass}
        />
      ) : definition.type === "json" ? (
        <textarea
          id={id}
          rows={3}
          value={current}
          placeholder={definition.placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={inputClass}
        />
      ) : (
        <input
          id={id}
          type="text"
          value={current}
          placeholder={definition.placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={inputClass}
        />
      )}

      {definition.description !== undefined && (
        <p className="text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
          {definition.description}
        </p>
      )}
    </div>
  );
}