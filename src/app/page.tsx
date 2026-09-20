import { GROUPS, OPERATIONS } from "@/lib/dummyjson/registry";

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16">
      <header>
        <p className="mb-2 font-mono text-sm text-zinc-500">
          dummyjson.com/docs
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">
          DummyJSON Workbench
        </h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          Explore, learn, and exercise the documented DummyJSON REST API from a
          typed capability registry.
        </p>
      </header>

      <section aria-label="Capability groups">
        <h2 className="mb-4 text-lg font-medium">
          {GROUPS.length} groups · {OPERATIONS.length} operations
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {GROUPS.map((group) => {
            const count = OPERATIONS.filter(
              (o) => o.group === group.id,
            ).length;
            return (
              <li
                key={group.id}
                className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-medium">{group.name}</h3>
                  <span className="font-mono text-xs text-zinc-500">
                    {count}
                  </span>
                </div>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {group.description}
                </p>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}