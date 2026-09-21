/**
 * Collapsible JSON tree for response bodies (TASK-023). Built on native
 * `<details>` elements so collapse/expand is keyboard-accessible for free
 * and requires no per-node React state.
 *
 * Depth is capped so pathologically deep responses (e.g. an echoed custom
 * body from the HTTP mock endpoints) render a truncation marker instead of
 * overflowing the call stack.
 */
import { ChevronRight } from "lucide-react";

/** Maximum nesting depth rendered before eliding deeper values. */
export const MAX_TREE_DEPTH = 32;

export function JsonTree({ data }: { data: unknown }) {
  // Native <details>/<summary> provides disclosure semantics and keyboard
  // support; no ARIA tree roles (which would require full treeitem keyboard
  // navigation to be truthful).
  return (
    <div className="space-y-0.5 font-mono text-xs leading-relaxed">
      <JsonNode data={data} depth={0} />
    </div>
  );
}

function JsonNode({ data, depth }: { data: unknown; depth: number }) {
  if (depth > MAX_TREE_DEPTH) {
    return <span className="text-zinc-400">…</span>;
  }
  if (data === null) {
    return <span className="text-zinc-400">null</span>;
  }
  if (typeof data === "number" || typeof data === "boolean") {
    return <span className="text-amber-600 dark:text-amber-400">{String(data)}</span>;
  }
  if (typeof data === "string") {
    return (
      <span className="text-emerald-700 dark:text-emerald-400">
        {`"${data.replace(/"/g, '\\"')}"`}
      </span>
    );
  }
  if (typeof data === "bigint") {
    return <span className="text-amber-600 dark:text-amber-400">{String(data)}</span>;
  }
  return <Container data={data} depth={depth} />;
}

function Container({ data, depth }: { data: unknown; depth: number }) {
  const nextDepth = depth + 1;
  if (Array.isArray(data)) {
    return (
      <details open className="group">
        <summary className="flex cursor-pointer list-none items-center gap-1 rounded hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-zinc-800/60">
          <ChevronRight aria-hidden="true" className="h-3 w-3 text-zinc-500 transition-transform group-open:rotate-90 dark:text-zinc-400" />
          <span className="text-zinc-500 dark:text-zinc-400">Array</span>
          <span className="text-zinc-500">[{data.length}]</span>
        </summary>
        <div className="ml-3 space-y-0.5 border-l border-zinc-200 pl-3 dark:border-zinc-800">
          {data.map((item, index) => (
            <div key={index}>
              <span className="mr-1 text-zinc-400">{index}:</span>
              <JsonNode data={item} depth={nextDepth} />
            </div>
          ))}
        </div>
      </details>
    );
  }

  const entries = Object.entries(data as Record<string, unknown>);
  return (
    <details open className="group">
<summary className="flex cursor-pointer list-none items-center gap-1 rounded hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-zinc-800/60">
          <ChevronRight aria-hidden="true" className="h-3 w-3 text-zinc-500 transition-transform group-open:rotate-90 dark:text-zinc-400" />
          <span className="text-zinc-500 dark:text-zinc-400">Object</span>
        <span className="text-zinc-500">{"{"}{entries.length}{"}"}</span>
      </summary>
      <div className="ml-3 space-y-0.5 border-l border-zinc-200 pl-3 dark:border-zinc-800">
        {entries.map(([key, value]) => (
          <div key={key}>
            <span className="mr-1 text-zinc-500">{key}:</span>
            <JsonNode data={value} depth={nextDepth} />
          </div>
        ))}
      </div>
    </details>
  );
}