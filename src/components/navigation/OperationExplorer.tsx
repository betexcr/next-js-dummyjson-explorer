"use client";

/**
 * Operation explorer (TASK-021): searchable, grouped navigation rendered
 * entirely from the capability registry. Search reuses the registry's
 * `searchOperations` so UI and registry can never diverge.
 */
import { useMemo, useState } from "react";
import { ChevronRight, Search, Star } from "lucide-react";
import {
  GROUPS,
  OPERATIONS,
  searchOperations,
} from "@/lib/dummyjson/registry";
import type { ApiOperation, GroupId } from "@/lib/dummyjson/types";

const METHOD_BADGE: Record<string, string> = {
  GET: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  POST: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  PUT: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  PATCH: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  DELETE: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
};

export function methodBadgeClass(method: string): string {
  return METHOD_BADGE[method] ?? "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400";
}

export interface OperationExplorerProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
  favoriteIds: ReadonlySet<string>;
  onToggleFavorite: (id: string) => void;
}

export function OperationExplorer({
  selectedId,
  onSelect,
  favoriteIds,
  onToggleFavorite,
}: OperationExplorerProps) {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<ReadonlySet<GroupId>>(new Set());

  const visible = useMemo(
    () => (query.trim() ? searchOperations(query) : OPERATIONS),
    [query],
  );
  const byGroup = useMemo(() => {
    const map = new Map<GroupId, ApiOperation[]>();
    for (const operation of visible) {
      const list = map.get(operation.group) ?? [];
      list.push(operation);
      map.set(operation.group, list);
    }
    return map;
  }, [visible]);

  const favoriteOperations = useMemo(
    () => OPERATIONS.filter((operation) => favoriteIds.has(operation.id)),
    [favoriteIds],
  );

  const toggleGroup = (id: GroupId): void => {
    setCollapsed((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <nav
      aria-label="Operations"
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="border-b border-zinc-200 p-3 dark:border-zinc-800">
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="search"
            aria-label="Search operations"
            aria-controls="operation-explorer-list"
            placeholder="Search operations…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-md border border-zinc-200 bg-zinc-50 py-1.5 pl-8 pr-3 text-sm placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-800 dark:bg-zinc-900 dark:placeholder:text-zinc-400"
          />
        </div>
        {query.trim() !== "" && (
          <p
            id="search-status"
            aria-live="polite"
            className="mt-2 text-xs text-zinc-500"
          >
            {visible.length} matching operation{visible.length === 1 ? "" : "s"}
          </p>
        )}
      </div>

      <div
        id="operation-explorer-list"
        className="min-h-0 flex-1 overflow-y-auto p-2"
      >
        {!query.trim() && favoriteOperations.length > 0 && (
          <OperationGroupList
            label="Favorites"
            operations={favoriteOperations}
            selectedId={selectedId}
            onSelect={onSelect}
            onToggleFavorite={onToggleFavorite}
          />
        )}
        {GROUPS.map((group) => {
          const operations = byGroup.get(group.id);
          if (!operations || operations.length === 0) return null;
          const isCollapsed = collapsed.has(group.id);
          return (
            <section key={group.id} aria-label={group.name}>
              <button
                type="button"
                id={`group-toggle-${group.id}`}
                aria-expanded={!isCollapsed}
                aria-controls={`group-list-${group.id}`}
                aria-label={`${group.name} group, ${operations.length} operations`}
                onClick={() => toggleGroup(group.id)}
                className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-zinc-800/60 dark:text-zinc-400"
              >
                <ChevronRight
                  aria-hidden="true"
                  className={`h-3.5 w-3.5 transition-transform ${
                    isCollapsed ? "" : "rotate-90"
                  }`}
                />
                {group.name}
                <span className="ml-auto font-mono text-[10px] font-normal text-zinc-500 dark:text-zinc-400">
                  {operations.length}
                </span>
              </button>
              <ul
                id={`group-list-${group.id}`}
                aria-labelledby={`group-toggle-${group.id}`}
                hidden={isCollapsed}
                className="mb-2 ml-2 space-y-0.5 border-l border-zinc-200 pl-2 dark:border-zinc-800"
              >
                {operations.map((operation) => (
                  <OperationItem
                    key={operation.id}
                    operation={operation}
                    selected={operation.id === selectedId}
                    isFavorite={favoriteIds.has(operation.id)}
                    onSelect={onSelect}
                    onToggleFavorite={onToggleFavorite}
                  />
                ))}
              </ul>
            </section>
          );
        })}
        {visible.length === 0 && (
          <p className="px-2 py-6 text-center text-sm text-zinc-500">
            No operations match “{query}”.
          </p>
        )}
      </div>
    </nav>
  );
}

function OperationGroupList(props: {
  label: string;
  operations: ApiOperation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}) {
  const { label, operations, selectedId, onSelect, onToggleFavorite } = props;
  return (
    <section aria-label={label} className="mb-2">
      <h2 className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
        <Star aria-hidden="true" className="h-3 w-3 fill-current" />
        Favorites
      </h2>
      <ul className="mb-2 ml-2 space-y-0.5 border-l border-zinc-200 pl-2 dark:border-zinc-800">
        {operations.map((operation) => (
          <OperationItem
            key={operation.id}
            operation={operation}
            selected={operation.id === selectedId}
            isFavorite
            onSelect={onSelect}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </ul>
    </section>
  );
}

function OperationItem(props: {
  operation: ApiOperation;
  selected: boolean;
  isFavorite: boolean;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}) {
  const { operation, selected, isFavorite, onSelect, onToggleFavorite } = props;
  return (
    <li className="group relative flex items-center">
      <button
        type="button"
        aria-current={selected ? "true" : undefined}
        aria-label={`${operation.method} ${operation.name}`}
        title={operation.summary}
        onClick={() => onSelect(operation.id)}
        className={`flex w-full items-center gap-2 rounded-md py-1 pr-7 pl-1 text-left text-sm ${
          selected
            ? "bg-indigo-50 font-medium text-indigo-900 dark:bg-indigo-500/10 dark:text-indigo-200"
            : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
        }`}
      >
        <span
          className={`shrink-0 rounded px-1 py-0.5 font-mono text-[10px] font-semibold ${methodBadgeClass(
            operation.method,
          )}`}
        >
          {operation.method}
        </span>
        <span className="truncate">{operation.name}</span>
      </button>
      <button
        type="button"
        aria-pressed={isFavorite}
        aria-label={`${isFavorite ? "Unfavorite" : "Favorite"} ${operation.name}`}
        onClick={() => onToggleFavorite(operation.id)}
        className={`absolute right-1 rounded p-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
          isFavorite
            ? "text-amber-500"
            : "text-zinc-500 opacity-0 hover:text-amber-500 group-hover:opacity-100 dark:text-zinc-400"
        }`}
      >
        <Star aria-hidden="true" className={`h-3.5 w-3.5 ${isFavorite ? "fill-current" : ""}`} />
      </button>
    </li>
  );
}