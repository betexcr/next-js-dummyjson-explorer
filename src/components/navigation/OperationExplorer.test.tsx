// @vitest-environment jsdom
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getOperation } from "@/lib/dummyjson/registry";
import { OperationExplorer } from "./OperationExplorer";

/** Accessible name of an operation item button: "METHOD <name>". */
function itemName(id: string): string {
  const op = getOperation(id);
  if (!op) throw new Error(`No operation ${id}`);
  return `${op.method} ${op.name}`;
}

function setup(overrides: Partial<Parameters<typeof OperationExplorer>[0]> = {}) {
  const onSelect = vi.fn();
  const onToggleFavorite = vi.fn();
  render(
    <OperationExplorer
      selectedId={null}
      onSelect={onSelect}
      favoriteIds={new Set()}
      onToggleFavorite={onToggleFavorite}
      {...overrides}
    />,
  );
  return { onSelect, onToggleFavorite };
}

describe("OperationExplorer", () => {
  it("renders registry groups and operations", () => {
    setup();
    // Group toggles expose "Name group, N operations" as their accessible name.
    expect(
      screen.getByRole("button", { name: /^Products group, \d+ operations$/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Auth group, \d+ operations$/ }),
    ).toBeInTheDocument();
    // A real operation from the registry.
    expect(screen.getByRole("button", { name: itemName("products-list") })).toBeInTheDocument();
  });

  it("selects an operation on click", async () => {
    const user = userEvent.setup();
    const { onSelect } = setup();
    await user.click(screen.getByRole("button", { name: itemName("products-list") }));
    expect(onSelect).toHaveBeenCalledWith("products-list");
  });

  it("toggles favorites via the star button", async () => {
    const user = userEvent.setup();
    const { onToggleFavorite } = setup();
    const name = getOperation("products-list")!.name;
    await user.click(screen.getByRole("button", { name: `Favorite ${name}` }));
    expect(onToggleFavorite).toHaveBeenCalledWith("products-list");
  });

  it("marks a selected operation in favorites and groups", () => {
    setup({
      selectedId: "products-list",
      favoriteIds: new Set(["products-list"]),
    });
    // One item in the Favorites section, one in the Products group.
    const items = screen.getAllByRole("button", { name: itemName("products-list") });
    expect(items).toHaveLength(2);
    for (const item of items) {
      expect(item).toHaveAttribute("aria-current", "true");
    }
  });

  it("shows a favorites section only while favorites exist", async () => {
    const user = userEvent.setup();
    function FavoritesHarness() {
      const [favoriteIds, setFavoriteIds] = useState<ReadonlySet<string>>(
        () => new Set(),
      );
      return (
        <OperationExplorer
          selectedId={null}
          onSelect={() => {}}
          favoriteIds={favoriteIds}
          onToggleFavorite={(id) =>
            setFavoriteIds((previous) => {
              const next = new Set(previous);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              return next;
            })
          }
        />
      );
    }
    render(<FavoritesHarness />);
    expect(
      screen.queryByRole("heading", { name: "Favorites" }),
    ).not.toBeInTheDocument();
    const name = getOperation("products-list")!.name;
    await user.click(screen.getByRole("button", { name: `Favorite ${name}` }));
    expect(screen.getByRole("heading", { name: "Favorites" })).toBeInTheDocument();
    // The item is duplicated (Favorites section + group), each with its own star.
    await user.click(
      screen.getAllByRole("button", { name: `Unfavorite ${name}` })[0],
    );
    expect(
      screen.queryByRole("heading", { name: "Favorites" }),
    ).not.toBeInTheDocument();
  });

  it("renders the favorites section when favoriteIds is non-empty", () => {
    setup({ favoriteIds: new Set(["products-list"]) });
    expect(screen.getByRole("heading", { name: "Favorites" })).toBeInTheDocument();
  });

  it("filters operations by search query", async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByRole("searchbox", { name: /search/i }), "products/search");
    expect(screen.getByRole("button", { name: itemName("products-search") })).toBeInTheDocument();
    expect(screen.getByText(/matching operation/)).toBeInTheDocument();
  });
});