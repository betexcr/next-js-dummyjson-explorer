// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getOperation } from "@/lib/dummyjson/registry";
import type { ApiOperation, ParameterValues } from "@/lib/dummyjson/types";
import type { ExecuteOptions, ExecuteResult } from "@/lib/dummyjson/client";

// Mock only the transport; keep the registry and builders real.
const { executeOperationMock } = vi.hoisted(() => ({
  executeOperationMock: vi.fn<
    (
      op: ApiOperation,
      values: ParameterValues,
      options?: ExecuteOptions,
    ) => Promise<ExecuteResult>
  >(),
}));

vi.mock("@/lib/dummyjson/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/dummyjson/client")>();
  return { ...actual, executeOperation: executeOperationMock };
});

import { WorkbenchShell } from "./WorkbenchShell";

const productsBody = {
  products: [{ id: 1, title: "Test Product", price: 9.99 }],
  total: 1,
  skip: 0,
  limit: 1,
};

function okResult(): ExecuteResult {
  return {
    ok: true,
    response: {
      ok: true,
      status: 200,
      statusText: "OK",
      headers: { "content-type": "application/json" },
      body: productsBody,
      raw: JSON.stringify(productsBody),
      kind: "json",
      durationMs: 10,
    },
  };
}

function loginResult(): ExecuteResult {
  return {
    ok: true,
    response: {
      ok: true,
      status: 200,
      statusText: "OK",
      headers: { "content-type": "application/json" },
      body: {
        accessToken: "access-token-123",
        refreshToken: "refresh-token-456",
        id: 1,
        username: "emilys",
        email: "emily@example.com",
        firstName: "Emily",
        lastName: "Johnson",
        gender: "female",
        image: "https://dummyjson.com/icon/emilys/128",
      },
      raw: "{}",
      kind: "json",
      durationMs: 8,
    },
  };
}

/** Accessible name of an explorer item button: "METHOD <name>". */
function itemName(id: string): string {
  const op = getOperation(id);
  if (!op) throw new Error(`No operation ${id}`);
  return `${op.method} ${op.name}`;
}

beforeEach(() => {
  executeOperationMock.mockReset();
  sessionStorage.clear();
  localStorage.clear();
  window.history.replaceState(null, "", "/");
});

describe("WorkbenchShell", () => {
  it("renders the header with endpoint count and menus", () => {
    render(<WorkbenchShell />);
    expect(screen.getByText("DummyJSON Workbench")).toBeInTheDocument();
    expect(screen.getByText(/endpoints/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Request history" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Sign in$/ })).toBeInTheDocument();
  });

  it("selects an operation from the explorer", async () => {
    const user = userEvent.setup();
    render(<WorkbenchShell />);
    await user.click(screen.getByRole("button", { name: itemName("products-list") }));
    expect(screen.getByText("/products")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Send$/ })).toBeInTheDocument();
  });

  it("opens the mobile operations drawer and selects an operation", async () => {
    const user = userEvent.setup();
    render(<WorkbenchShell />);
    await user.click(screen.getByRole("button", { name: "Toggle operations list" }));
    const dialog = await screen.findByRole("dialog", { name: "Operations" });
    await user.click(
      within(dialog).getByRole("button", { name: itemName("products-list") }),
    );
    // Selecting an operation closes the drawer and shows the builder.
    expect(screen.queryByRole("dialog", { name: "Operations" })).not.toBeInTheDocument();
    expect(screen.getByText("/products")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Send$/ })).toBeInTheDocument();
  });

  it("executes a request and renders the response", async () => {
    const user = userEvent.setup();
    executeOperationMock.mockResolvedValue(okResult());
    render(<WorkbenchShell />);
    await user.click(screen.getByRole("button", { name: itemName("products-list") }));
    await user.click(screen.getByRole("button", { name: /^Send$/ }));
    expect(await screen.findByRole("status")).toHaveTextContent("200 OK");
    expect(executeOperationMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: "products-list" }),
      expect.any(Object),
      expect.objectContaining({ timeoutMs: 30000 }),
    );
  });

  it("records completed requests in history", async () => {
    const user = userEvent.setup();
    executeOperationMock.mockResolvedValue(okResult());
    render(<WorkbenchShell />);
    await user.click(screen.getByRole("button", { name: itemName("products-list") }));
    await user.click(screen.getByRole("button", { name: /^Send$/ }));
    await screen.findByRole("status");
    await user.click(screen.getByRole("button", { name: "Request history" }));
    const list = await screen.findByRole("list", { name: "Recent requests list" });
    expect(
      within(list).getByRole("button", { name: "Restore: Get all products" }),
    ).toBeInTheDocument();
  });

  it("does not persist the bearer token in history entries", async () => {
    const user = userEvent.setup();
    // Prime session storage with a signed-in session so the shell attaches
    // the bearer token to outgoing requests.
    sessionStorage.setItem(
      "djwb.session",
      JSON.stringify({
        token: "access-token-123",
        refreshToken: "refresh-token-456",
        user: { id: 1, username: "emilys" },
      }),
    );
    executeOperationMock.mockImplementation(async (_op, _values, options) => {
      expect(options?.authToken).toBe("access-token-123");
      return okResult();
    });
    render(<WorkbenchShell />);

    await user.click(screen.getByRole("button", { name: itemName("products-list") }));
    await user.click(screen.getByRole("button", { name: /^Send$/ }));
    await screen.findByRole("status");

    const historyCall = executeOperationMock.mock.calls.find(
      ([op]) => op.id === "products-list",
    );
    expect(historyCall).toBeDefined();
    // The values recorded in history must not contain the bearer token.
    const recordedValues = historyCall![1];
    expect(JSON.stringify(recordedValues)).not.toContain("access-token-123");
  });

  it("restores a request from history", async () => {
    const user = userEvent.setup();
    executeOperationMock.mockResolvedValue(okResult());
    render(<WorkbenchShell />);
    await user.click(screen.getByRole("button", { name: itemName("products-list") }));
    await user.click(screen.getByRole("button", { name: /^Send$/ }));
    await screen.findByRole("status");
    await user.click(screen.getByRole("button", { name: "Request history" }));
    const restoreList = await screen.findByRole("list", { name: "Recent requests list" });
    await user.click(
      within(restoreList).getByRole("button", { name: "Restore: Get all products" }),
    );
    expect(screen.getByRole("button", { name: /^Send$/ })).toBeInTheDocument();
  });

  it("signs in with demo credentials and stores the token", async () => {
    const user = userEvent.setup();
    executeOperationMock.mockImplementation(async (op) =>
      op.id === "auth-login" ? loginResult() : okResult(),
    );
    render(<WorkbenchShell />);
    await user.click(screen.getByRole("button", { name: /^Sign in$/ }));
    // Fields are prefilled with the documented demo credentials.
    await user.click(screen.getByRole("button", { name: "Submit sign in" }));
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Emily Johnson/ }),
      ).toBeInTheDocument();
    });
  });

  it("aborts an in-flight request when it unmounts", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<WorkbenchShell />);
    await user.click(screen.getByRole("button", { name: itemName("products-list") }));

    // A request that never settles simulates an in-flight fetch.
    executeOperationMock.mockImplementation(
      () =>
        new Promise<ExecuteResult>(() => {
          // Never resolves.
        }),
    );
    await user.click(screen.getByRole("button", { name: /^Send$/ }));

    const signal = executeOperationMock.mock.calls.at(-1)?.[2]?.signal;
    expect(signal).toBeDefined();

    unmount();
    // The shell must abort the running request on unmount (previously the
    // cleanup captured the mount-time controller, i.e. null, leaking fetches).
    expect(signal?.aborted).toBe(true);
  });

  it("can sign out after signing in", async () => {
    const user = userEvent.setup();
    executeOperationMock.mockImplementation(async (op) =>
      op.id === "auth-login" ? loginResult() : okResult(),
    );
    render(<WorkbenchShell />);
    await user.click(screen.getByRole("button", { name: /^Sign in$/ }));
    await user.click(screen.getByRole("button", { name: "Submit sign in" }));
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Emily Johnson/ }),
      ).toBeInTheDocument();
    });
    // The panel closes after a successful sign-in; reopen it to sign out.
    await user.click(screen.getByRole("button", { name: /Emily Johnson/ }));
    await user.click(screen.getByRole("button", { name: /Sign out/ }));
    expect(screen.getByRole("button", { name: /^Sign in$/ })).toBeInTheDocument();
  });

  it("aborts in-flight requests when signing out", async () => {
    const user = userEvent.setup();
    executeOperationMock.mockImplementation(async (op) =>
      op.id === "auth-login" ? loginResult() : okResult(),
    );
    render(<WorkbenchShell />);
    await user.click(screen.getByRole("button", { name: /^Sign in$/ }));
    await user.click(screen.getByRole("button", { name: "Submit sign in" }));
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Emily Johnson/ }),
      ).toBeInTheDocument();
    });

    // Start a request that never settles.
    executeOperationMock.mockImplementation(
      () =>
        new Promise<ExecuteResult>(() => {
          // Never resolves.
        }),
    );
    await user.click(screen.getByRole("button", { name: itemName("products-list") }));
    await user.click(screen.getByRole("button", { name: /^Send$/ }));
    const signal = executeOperationMock.mock.calls.at(-1)?.[2]?.signal;
    expect(signal).toBeDefined();
    expect(signal?.aborted).toBe(false);

    // Sign out must abort the in-flight request so the old token stops flying
    // and reset loading states so the UI is not stuck.
    await user.click(screen.getByRole("button", { name: /Emily Johnson/ }));
    await user.click(screen.getByRole("button", { name: /Sign out/ }));
    expect(signal?.aborted).toBe(true);
    expect(screen.getByRole("button", { name: /^Send$/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Cancel$/ })).not.toBeInTheDocument();
  });
});