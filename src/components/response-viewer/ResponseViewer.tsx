"use client";

/**
 * Response viewer (TASK-023): status, timing, headers, JSON tree/raw body,
 * image preview for binary responses, copy/download, and normalized error
 * rendering. HTTP failures render their full normalized response so users
 * can inspect status, headers, and error bodies.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, Copy, Download } from "lucide-react";
import type { ExecuteResult } from "@/lib/dummyjson/client";
import type { ApiError } from "@/lib/request/response";
import type { ApiOperation } from "@/lib/dummyjson/types";
import { formatJson, LARGE_RESPONSE_THRESHOLD } from "./format-json";
import { JsonTree } from "./JsonTree";

export interface ResponseViewerProps {
  result: ExecuteResult | null;
  op: ApiOperation;
}

type HttpError = Extract<ApiError, { type: "http" }>;

function statusClass(status: number): string {
  if (status >= 200 && status < 300) {
    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
  }
  if (status >= 300 && status < 400) {
    return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
  }
  return "bg-rose-500/10 text-rose-700 dark:text-rose-400";
}

function tryObjectUrl(buffer: ArrayBuffer): string | null {
  try {
    return URL.createObjectURL(new Blob([buffer]));
  } catch {
    return null;
  }
}

/** Renders the underlying cause of a network failure for display. */
function formatErrorCause(cause: unknown): string {
  if (cause instanceof Error && cause.message) return cause.message;
  if (typeof cause === "string" && cause) return cause;
  try {
    return JSON.stringify(cause);
  } catch {
    return String(cause);
  }
}

export function ResponseViewer({ result, op }: ResponseViewerProps) {
  const [tab, setTab] = useState<"body" | "headers">("body");
  const [view, setView] = useState<"tree" | "raw">("tree");
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const httpError: HttpError | null =
    result && !result.ok && result.error.type === "http" ? result.error : null;

  const binaryData = result?.ok ? result.response.binaryData : undefined;

  const objectUrl = useMemo(
    () => (binaryData ? tryObjectUrl(binaryData) : null),
    [binaryData],
  );
  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  const response = result?.ok ? result.response : httpError;

  const rawText =
    response && response.kind !== "binary"
      ? response.kind === "json"
        ? formatJson(response.body)
        : response.raw
      : "";

  const bodyForRender =
    response && response.kind === "binary"
      ? { binary: true as const, url: objectUrl }
      : { binary: false as const, raw: rawText };

  const copy = async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (copiedTimer.current !== undefined) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 1200);
    } catch {
      // Clipboard unavailable (e.g. non-secure context); ignore quietly.
    }
  };

  const download = (text: string): void => {
    try {
      const blob = new Blob([text], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `dummyjson-${op.id}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      // Downloads unavailable in the current context; ignore.
    }
  };

  if (!result) {
    return (
      <section
        aria-label="Response"
        className="flex min-h-0 flex-col items-center justify-center gap-2 border-t border-zinc-200 text-sm text-zinc-500 lg:border-t-0 lg:border-l dark:border-zinc-800 dark:text-zinc-400"
      >
        <p>Send the request to inspect the response.</p>
      </section>
    );
  }

  if (!result.ok && result.error.type !== "http") {
    const { error } = result;
    const detail =
      error.type === "network" && error.cause != null
        ? formatErrorCause(error.cause)
        : error.type === "invalid-json" && error.raw.trim() !== ""
          ? error.raw.slice(0, 500)
          : null;
    const detailLabel =
      error.type === "invalid-json" ? "raw body (truncated)" : null;
    return (
      <section
        aria-label="Response"
        className="flex min-h-0 flex-col overflow-y-auto border-t border-zinc-200 lg:border-t-0 lg:border-l dark:border-zinc-800"
      >
        <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
          <span className="rounded bg-rose-500/10 px-2 py-1 font-mono text-xs font-semibold text-rose-700 dark:text-rose-400">
            {error.type}
          </span>
          <h2 className="mt-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            {error.message}
          </h2>
          {detail !== null && (
            <div className="mt-2">
              {detailLabel && (
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  {detailLabel}
                </p>
              )}
              <pre className="mt-1 max-h-40 overflow-auto break-all rounded-md border border-zinc-200 bg-zinc-50 p-2 font-mono text-[11px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                {detail}
              </pre>
            </div>
          )}
        </div>
      </section>
    );
  }

  if (!response) return null;

  const headerEntries = Object.entries(response.headers);
  const large = !bodyForRender.binary && rawText.length > LARGE_RESPONSE_THRESHOLD;
  const showJsonTree = response.kind === "json" && view === "tree" && !large;

  return (
    <section
      aria-label="Response"
      className="flex min-h-0 flex-col border-t border-zinc-200 lg:border-t-0 lg:border-l dark:border-zinc-800"
    >
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800">
        <span
          role="status"
          className={`rounded px-2 py-1 font-mono text-xs font-semibold ${statusClass(response.status)}`}
        >
          {response.status} {response.statusText}
        </span>
        <span className="font-mono text-xs text-zinc-500">
          {response.durationMs.toFixed(1)} ms
        </span>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => copy(JSON.stringify(response.headers, null, 2))}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {copied ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <Check aria-hidden="true" className="h-3 w-3" /> Copied
              </span>
            ) : (
              <>
                <Copy aria-hidden="true" className="h-3 w-3" /> Copy
              </>
            )}
            <span aria-live="polite" className="sr-only">
              {copied ? "Copied to clipboard" : ""}
            </span>
          </button>
          {!bodyForRender.binary && (
            <>
              <button
                type="button"
                onClick={() => copy(rawText)}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <Copy aria-hidden="true" className="h-3 w-3" /> Body
              </button>
              <button
                type="button"
                onClick={() => download(rawText)}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <Download aria-hidden="true" className="h-3 w-3" /> Save
              </button>
            </>
          )}
        </div>
      </header>

      {headerEntries.length > 0 && (
        <div
          role="tablist"
          aria-label="Response tabs"
          className="flex shrink-0 gap-1 border-b border-zinc-200 px-3 pt-2 dark:border-zinc-800"
        >
          <TabButton
            id="tab-body"
            controls="tab-body-panel"
            active={tab === "body"}
            onClick={() => setTab("body")}
          >
            Body
          </TabButton>
          <TabButton
            id="tab-headers"
            controls="tab-headers-panel"
            active={tab === "headers"}
            onClick={() => setTab("headers")}
          >
            Headers ({headerEntries.length})
          </TabButton>
        </div>
      )}

      {large && (
        <p className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-xs text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          Large response — only raw view is available.
        </p>
      )}

      {tab === "headers" ? (
        <div
          id="tab-headers-panel"
          role="tabpanel"
          aria-labelledby="tab-headers"
          className="min-h-0 flex-1 overflow-auto p-4"
        >
          <table className="w-full table-fixed border-collapse font-mono text-xs">
            <tbody>
              {headerEntries.map(([name, value]) => (
                <tr
                  key={name}
                  className="border-b border-zinc-100 align-top dark:border-zinc-800/60"
                >
                  <th
                    scope="row"
                    className="w-1/3 py-1.5 pr-3 text-left font-medium text-zinc-500 dark:text-zinc-400"
                  >
                    {name}
                  </th>
                  <td className="break-all py-1.5 text-zinc-700 dark:text-zinc-300">
                    {value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : bodyForRender.binary ? (
        <BinaryPreview url={bodyForRender.url} />
      ) : (
        <div
          id="tab-body-panel"
          role="tabpanel"
          aria-labelledby="tab-body"
          className="min-h-0 flex-1 space-y-3 overflow-auto p-4"
        >
          {response.kind === "json" && !large && (
            <div role="radiogroup" aria-label="JSON view" className="flex gap-1">
              <button
                type="button"
                role="radio"
                aria-checked={view === "tree"}
                onClick={() => setView("tree")}
                className="rounded-md px-2 py-0.5 text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                Tree
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={view === "raw"}
                onClick={() => setView("raw")}
                className="rounded-md px-2 py-0.5 text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                Raw
              </button>
            </div>
          )}
          {showJsonTree ? (
            <JsonTree data={response.body} />
          ) : (
            <pre className="whitespace-pre-wrap break-all font-mono text-xs leading-relaxed text-zinc-800 dark:text-zinc-100">
              {rawText}
            </pre>
          )}
        </div>
      )}
    </section>
  );
}

function TabButton(props: {
  id: string;
  controls: string;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      id={props.id}
      role="tab"
      aria-selected={props.active}
      aria-controls={props.controls}
      onClick={props.onClick}
      className={`rounded-t-md border-b-2 px-3 py-1.5 text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
        props.active
          ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
          : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
      }`}
    >
      {props.children}
    </button>
  );
}

function BinaryPreview({ url }: { url: string | null }) {
  if (!url) {
    return (
      <div className="min-h-0 flex-1 overflow-auto p-4">
        <p className="text-sm text-zinc-500">
          Binary response received but no preview is available in this context.
        </p>
      </div>
    );
  }
  return (
    <div className="min-h-0 flex-1 overflow-auto p-4">
      {/* Blob URLs are generated at runtime and cannot be optimized; next/image does not apply. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="Binary response preview"
        className="max-h-full rounded-md border border-zinc-200 dark:border-zinc-800"
      />
    </div>
  );
}