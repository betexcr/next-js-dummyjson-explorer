/**
 * URL-backed selected operation id (TASK-021).
 *
 * Reads `?op=<id>` and writes it back with `history.replaceState` (no
 * navigation history spam). Implemented with `useSyncExternalStore` so the
 * URL is the single external source of truth: popstate (back/forward) and a
 * custom change event (after replaceState) both notify subscribers. The page
 * is prerender-safe because the server snapshot is always null.
 */
import { useCallback, useSyncExternalStore } from "react";

const PARAM = "op";
const OP_CHANGE_EVENT = "djwb:op-change";

function readOp(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(PARAM);
}

function writeOp(id: string | null): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (id) {
    url.searchParams.set(PARAM, id);
  } else {
    url.searchParams.delete(PARAM);
  }
  window.history.replaceState(null, "", url.toString());
}

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener("popstate", onStoreChange);
  window.addEventListener(OP_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("popstate", onStoreChange);
    window.removeEventListener(OP_CHANGE_EVENT, onStoreChange);
  };
}

function getSnapshot(): string | null {
  return readOp();
}

function getServerSnapshot(): string | null {
  return null;
}

export function useOperationParam(): [string | null, (id: string | null) => void] {
  const opId = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const select = useCallback((id: string | null) => {
    writeOp(id);
    window.dispatchEvent(new Event(OP_CHANGE_EVENT));
  }, []);

  return [opId, select];
}