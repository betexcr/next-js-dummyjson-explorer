"use client";

/**
 * Request builder panel (TASK-022): renders registry-declared path, query,
 * header, auth, and body controls for the selected operation and exposes
 * Send / Cancel / Reset plus copyable cURL and fetch snippets (TASK-025).
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, Copy, ExternalLink, RotateCcw, Send, X } from "lucide-react";
import type { ApiOperation, ParameterValues } from "@/lib/dummyjson/types";
import { BODY_PARAM, buildRequest } from "@/lib/request/request-builder";
import { DEFAULT_BASE_URL } from "@/lib/dummyjson/client";
import { methodBadgeClass } from "@/components/navigation/OperationExplorer";
import { BodyEditor } from "./BodyEditor";
import { ParamField } from "./ParamField";
import { generateCurl, generateFetch } from "./generate-code";
import { defaultParameterValues, groupParameters, type GroupedParameters } from "./request-form";

export type RunStatus = "idle" | "loading" | "done" | "error";

export interface RequestBuilderProps {
  op: ApiOperation;
  values: ParameterValues;
  onChange: (values: ParameterValues) => void;
  status: RunStatus;
  errorMessage: string | null;
  authenticated: boolean;
  onSend: (values: ParameterValues) => void;
  onAbort: () => void;
  onReset: () => void;
}

function CodeBlock({ label, code }: { label: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (copiedTimer.current !== undefined) clearTimeout(copiedTimer.current);
    };
  }, []);

  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      if (copiedTimer.current !== undefined) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 1200);
    } catch {
      // Clipboard unavailable (e.g. non-secure context); ignore quietly.
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          {label}
        </p>
        <button
          type="button"
          aria-label={`Copy ${label}`}
          onClick={() => void copy()}
          className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-[10px] font-medium text-zinc-500 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-zinc-800 dark:text-zinc-400"
        >
          {copied ? (
            <>
              <Check aria-hidden="true" className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              Copied
            </>
          ) : (
            <>
              <Copy aria-hidden="true" className="h-3 w-3" />
              Copy
            </>
          )}
          <span aria-live="polite" className="sr-only">
            {copied ? "Copied to clipboard" : ""}
          </span>
        </button>
      </div>
      <pre className="overflow-x-auto rounded-md border border-zinc-200 bg-zinc-50 p-2.5 font-mono text-[11px] leading-relaxed text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
        {code}
      </pre>
    </div>
  );
}

export function RequestBuilder(props: RequestBuilderProps) {
  const { op, values, onChange, status, errorMessage, authenticated, onSend, onAbort, onReset } = props;
  const { path, query, header } = groupParameters(op);
  const grouped: GroupedParameters = { path, query, header };
  const loading = status === "loading";

  const setValue = (name: string, next: ParameterValues[string]): void => {
    onChange({ ...values, [name]: next });
  };

  const bodyValue = (values[BODY_PARAM] as string | undefined) ?? "";
  const setBody = (next: string): void => setValue(BODY_PARAM, next);

  // Building requests and serializing snippets is pure, so memoize per
  // operation + values instead of recomputing on every render. buildRequest
  // throws RequestBuildError for invalid values (e.g. missing required path
  // parameters, empty body): prefer current values, then the documented
  // defaults, and finally a placeholder so the panel never crashes while
  // rendering code snippets.
  const { curl, fetch: fetchSnippet } = useMemo(() => {
    try {
      const built = buildRequest({
        op,
        values,
        basePath: DEFAULT_BASE_URL,
      });
      return { curl: generateCurl(built), fetch: generateFetch(built) };
    } catch {
      try {
        const built = buildRequest({
          op,
          values: defaultParameterValues(op),
          basePath: DEFAULT_BASE_URL,
        });
        return { curl: generateCurl(built), fetch: generateFetch(built) };
      } catch {
        // Even the defaults cannot satisfy the operation's required
        // parameters (e.g. a path parameter with no default value). Show
        // pure comments instead of a half-formed command so copied text is
        // never mistaken for a runnable snippet.
        return {
          curl: `# Fill in the required parameters for ${op.id} first.\n# A ready-to-run cURL command will appear here.`,
          fetch: `// Fill in the required parameters for ${op.id} first.\n// A ready-to-run fetch call will appear here.`,
        };
      }
    }
  }, [op, values]);

  return (
    <section
      aria-label={`Request builder: ${op.id}`}
      className="flex min-h-0 flex-col overflow-y-auto"
    >
      <h1 className="sr-only">{op.name}</h1>
      <header className="shrink-0 space-y-1 border-b border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold ${methodBadgeClass(op.method)}`}
          >
            {op.method}
          </span>
          <code className="break-all font-mono text-sm text-zinc-800 dark:text-zinc-100">
            {op.path}
          </code>
          <a
            href={op.docsUrl}
            target="_blank"
            rel="noreferrer"
            className="ml-auto inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Docs
            <ExternalLink aria-hidden="true" className="h-3 w-3" />
          </a>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{op.summary}</p>
      </header>

      {errorMessage !== null && (
        // The ARIA `alert` role derives its accessible name from the author
        // (aria-label), not the text content, so the label is required for
        // screen readers and getByRole("alert", { name }) to identify it.
        <div
          role="alert"
          aria-label={errorMessage}
          className="mx-4 mt-3 shrink-0 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
        >
          {errorMessage}
        </div>
      )}

      {op.auth !== "none" && (
        <p className="mx-4 mt-3 shrink-0 rounded-md border border-zinc-200 px-3 py-2 text-xs text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
          {authenticated
            ? "Authenticated — Authorization: Bearer token will be attached."
            : "This operation requires authentication. Sign in from the header first."}
        </p>
      )}

      <div className="min-h-0 flex-1 space-y-5 p-4">
        {(grouped.path.length > 0 || grouped.query.length > 0) && (
          <FieldGroup
            title="Params"
            fields={
              <>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Path
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {grouped.path.map((definition) => (
                    <ParamField
                      key={definition.name}
                      definition={definition}
                      value={values[definition.name]}
                      onChange={(next) => setValue(definition.name, next)}
                    />
                  ))}
                </div>
                {grouped.query.length > 0 && (
                  <>
                    <p className="pt-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                      Query
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {grouped.query.map((definition) => (
                        <ParamField
                          key={definition.name}
                          definition={definition}
                          value={values[definition.name]}
                          onChange={(next) => setValue(definition.name, next)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            }
          />
        )}

        {grouped.header.length > 0 && (
          <FieldGroup
            title="Headers"
            fields={
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {grouped.header.map((definition) => (
                  <ParamField
                    key={definition.name}
                    definition={definition}
                    value={values[definition.name]}
                    onChange={(next) => setValue(definition.name, next)}
                  />
                ))}
              </div>
            }
          />
        )}

        {op.requestBody !== undefined && (
          <FieldGroup
            title="Body"
            fields={
              <div className="space-y-2">
                <BodyEditor value={bodyValue} onChange={setBody} />
                <div>
                  <button
                    type="button"
                    onClick={() => setBody(JSON.stringify(op.requestBody!.example, null, 2))}
                    className="rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Load documented example
                  </button>
                </div>
              </div>
            }
          />
        )}

        {grouped.path.length === 0 &&
          grouped.query.length === 0 &&
          grouped.header.length === 0 &&
          op.requestBody === undefined && (
            <p className="text-sm text-zinc-500">
              This operation takes no parameters — just send it.
            </p>
          )}

        <div className="flex flex-wrap items-center gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <span aria-live="polite" className="sr-only">
            {loading ? "Request sent, waiting for the response." : ""}
          </span>
          {loading ? (
            <button
              type="button"
              onClick={onAbort}
              className="inline-flex items-center gap-1.5 rounded-md bg-zinc-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              <X aria-hidden="true" className="h-4 w-4" />
              Cancel
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onSend(values)}
              className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <Send aria-hidden="true" className="h-4 w-4" />
              Send
            </button>
          )}
          <button
            type="button"
            onClick={onReset}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
            Reset
          </button>
        </div>

        <CodeBlock label="cURL" code={curl} />
        <CodeBlock label="fetch" code={fetchSnippet} />
      </div>
    </section>
  );
}

function FieldGroup(props: { title: string; fields: ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
        {props.title}
      </h3>
      {props.fields}
    </div>
  );
}