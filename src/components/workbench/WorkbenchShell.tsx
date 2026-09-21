"use client";

/**
 * Workbench shell (TASK-021/023/024/027/030): owns selection (URL-backed),
 * request execution + cancellation, auth session, favorites, and history;
 * composes the explorer, builder, viewer, and header menus.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Braces, ExternalLink, Menu, X } from "lucide-react";
import {
  executeOperation,
  type ExecuteResult,
} from "@/lib/dummyjson/client";
import { authTokenResponseSchema } from "@/lib/dummyjson/schemas";
import { getOperation, OPERATIONS } from "@/lib/dummyjson/registry";
import type { ApiOperation, ParameterValues } from "@/lib/dummyjson/types";
import { OperationExplorer } from "@/components/navigation/OperationExplorer";
import { RequestBuilder, type RunStatus } from "@/components/request-builder/RequestBuilder";
import { ResponseViewer } from "@/components/response-viewer/ResponseViewer";
import { AuthMenu } from "@/features/auth/AuthMenu";
import {
  type LoginCredentials,
  loginBody,
  loadAuth,
  type StoredAuth,
  saveAuth,
} from "@/features/auth/auth-store";
import { useFavorites } from "@/features/favorites/use-favorites";
import { HistoryMenu } from "@/features/history/HistoryMenu";
import {
  sanitizeValues,
  type HistoryEntry,
} from "@/features/history/history-store";
import { useHistory } from "@/features/history/use-history";
import { useOperationParam } from "./use-operation-param";

const REQUEST_TIMEOUT_MS = 30_000;

export function WorkbenchShell() {
  const [opId, selectOpId] = useOperationParam();
  const [values, setValues] = useState<ParameterValues>({});
  const [result, setResult] = useState<ExecuteResult | null>(null);
  const [busy, setBusy] = useState(false);

  const [auth, setAuth] = useState<StoredAuth | null>(loadAuth);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const history = useHistory();
  const { append: appendHistory } = history;
  const favorites = useFavorites();

  const abortRef = useRef<AbortController | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mobileNavRef = useRef<HTMLDivElement | null>(null);

  // Abort any in-flight request when the shell unmounts. The cleanup reads
  // `abortRef.current` lazily so it always aborts the request that is actually
  // running at unmount time (capturing it in the effect body would seal in the
  // mount-time value, i.e. null).
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  // Mobile navigation drawer: focus it on open, trap Tab, close on Escape,
  // and restore focus to the trigger on close (ARIA dialog pattern).
  useEffect(() => {
    if (!mobileNavOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    mobileNavRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setMobileNavOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = mobileNavRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [mobileNavOpen]);

  const operation = opId ? getOperation(opId) : null;

  // --- selection -----------------------------------------------------------

  const selectOperation = useCallback(
    (id: string) => {
      abortRef.current?.abort();
      setBusy(false);
      setResult(null);
      setValues({});
      selectOpId(id);
    },
    [selectOpId],
  );

  // --- execution -----------------------------------------------------------

  const execute = useCallback(
    async (op: ApiOperation, requestValues: ParameterValues) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setBusy(true);
      setResult(null);

      const outcome = await executeOperation(op, requestValues, {
        authToken: auth?.token ?? null,
        signal: controller.signal,
        timeoutMs: REQUEST_TIMEOUT_MS,
      });

      // Superseded by a newer request, cancel, or unmount.
      if (controller.signal.aborted) return;
      setResult(outcome);
      setBusy(false);

      appendHistory({
        operationId: op.id,
        values: sanitizeValues(requestValues),
        ok: outcome.ok,
        status: outcome.ok
          ? outcome.response.status
          : outcome.error.type === "http"
            ? outcome.error.status
            : null,
        durationMs: outcome.ok
          ? outcome.response.durationMs
          : outcome.error.type === "http"
            ? outcome.error.durationMs
            : 0,
      });
    },
    [auth?.token, appendHistory],
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
    setBusy(false);
    setResult(null);
  }, []);

  const reset = useCallback(() => {
    setValues({});
  }, []);

  // --- history restore -----------------------------------------------------

  const restore = useCallback(
    (entry: HistoryEntry) => {
      abortRef.current?.abort();
      setBusy(false);
      setResult(null);
      setValues(entry.values);
      selectOpId(entry.operationId);
    },
    [selectOpId],
  );

  // --- auth ----------------------------------------------------------------

  const login = useCallback(async (credentials: LoginCredentials) => {
    const op = getOperation("auth-login");
    if (!op) {
      setAuthError("The auth-login operation is unavailable.");
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setAuthBusy(true);
    setAuthError(null);

    const outcome = await executeOperation(op, loginBody(credentials), {
      signal: controller.signal,
      timeoutMs: REQUEST_TIMEOUT_MS,
    });
    if (controller.signal.aborted) return;
    setAuthBusy(false);

    if (!outcome.ok) {
      setAuthError(outcome.error.message);
      return;
    }
    if (outcome.response.kind !== "json") {
      setAuthError("Login returned an unexpected response format.");
      return;
    }
    const parsed = authTokenResponseSchema.safeParse(outcome.response.body);
    if (!parsed.success) {
      setAuthError("Login response did not match the documented shape.");
      return;
    }
    const data = parsed.data;
    const stored: StoredAuth = {
      token: data.accessToken,
      refreshToken: data.refreshToken,
      user: {
        id: data.id,
        username: data.username,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
      },
    };
    saveAuth(stored);
    setAuth(stored);
  }, []);

  const logout = useCallback(() => {
    // Cancel any in-flight request that may still carry the old token and
    // clear loading states so the UI never stays stuck after sign-out.
    abortRef.current?.abort();
    abortRef.current = null;
    setBusy(false);
    setAuthBusy(false);
    saveAuth(null);
    setAuth(null);
    setAuthError(null);
  }, []);

  const userLabel =
    auth?.user != null
      ? auth.user.firstName != null && auth.user.lastName != null
        ? `${auth.user.firstName} ${auth.user.lastName}`
        : auth.user.username
      : null;

  // --- derived view state --------------------------------------------------

  const status: RunStatus = busy
    ? "loading"
    : result === null
      ? "idle"
      : result.ok
        ? "done"
        : "error";

  const errorMessage =
    result && !result.ok && result.error.type !== "http"
      ? result.error.message
      : null;

  return (
    <div className="flex h-dvh flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-zinc-200 px-4 dark:border-zinc-800">
        <button
          type="button"
          aria-label="Toggle operations list"
          aria-expanded={mobileNavOpen}
          onClick={() => setMobileNavOpen((previous) => !previous)}
          className="inline-flex items-center rounded-md p-1.5 text-zinc-600 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 lg:hidden dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {mobileNavOpen ? (
            <X aria-hidden="true" className="h-4 w-4" />
          ) : (
            <Menu aria-hidden="true" className="h-4 w-4" />
          )}
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100"
        >
          <Braces aria-hidden="true" className="h-4 w-4 text-indigo-500" />
          DummyJSON Workbench
        </Link>
        <span className="hidden rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 md:inline dark:bg-zinc-800 dark:text-zinc-400">
          {OPERATIONS.length} endpoints
        </span>
        <div className="ml-auto flex items-center gap-2">
          <HistoryMenu
            entries={history.entries}
            onRestore={restore}
            onClear={history.clear}
          />
          <AuthMenu
            token={auth?.token ?? null}
            userLabel={userLabel}
            busy={authBusy}
            error={authError}
            onLogin={login}
            onLogout={logout}
          />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-72 shrink-0 border-r border-zinc-200 lg:block dark:border-zinc-800">
          <OperationExplorer
            selectedId={opId}
            onSelect={selectOperation}
            favoriteIds={favorites.favoriteIds}
            onToggleFavorite={favorites.toggleFavorite}
          />
        </aside>

        {/* Mobile overlay navigation (below lg the sidebar is hidden). */}
        {mobileNavOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Operations"
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileNavOpen(false)}
            />
            <div
              ref={mobileNavRef}
              tabIndex={-1}
              className="absolute top-0 left-0 flex h-full w-72 max-w-[85vw] flex-col border-r border-zinc-200 bg-zinc-50 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
            >
              <button
                type="button"
                aria-label="Close operations list"
                onClick={() => setMobileNavOpen(false)}
                className="flex items-center gap-1.5 border-b border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <X aria-hidden="true" className="h-3.5 w-3.5" />
                Close
              </button>
              <OperationExplorer
                selectedId={opId}
                onSelect={(id) => {
                  selectOperation(id);
                  setMobileNavOpen(false);
                }}
                favoriteIds={favorites.favoriteIds}
                onToggleFavorite={favorites.toggleFavorite}
              />
            </div>
          </div>
        )}

        <main id="main-content" className="flex min-w-0 flex-1 flex-col">
          {operation ? (
            <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
              <RequestBuilder
                op={operation}
                values={values}
                onChange={setValues}
                status={status}
                errorMessage={errorMessage}
                authenticated={auth?.token != null}
                onSend={(requestValues) => void execute(operation, requestValues)}
                onAbort={abort}
                onReset={reset}
              />
              <ResponseViewer result={result} op={operation} />
            </div>
          ) : (
            <EmptyState onBrowse={() => selectOperation(firstOperationId())} />
          )}
        </main>
      </div>
    </div>
  );
}

function firstOperationId(): string {
  return OPERATIONS[0]?.id ?? "products-list";
}

function EmptyState({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <Braces aria-hidden="true" className="h-10 w-10 text-zinc-300 dark:text-zinc-700" />
      <h1 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
        Pick an endpoint to start
      </h1>
      <p className="max-w-sm text-sm text-zinc-500">
        Browse the registry-driven operation explorer on the left, or jump
        straight to a documented route.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBrowse}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          Browse products
        </button>
        <a
          href="https://dummyjson.com/docs"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Official docs
          <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}