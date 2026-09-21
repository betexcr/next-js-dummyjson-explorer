import { WorkbenchShell } from "@/components/workbench/WorkbenchShell";

/**
 * Root page. The shell is a client component and hydrates the selected
 * operation from `?op=` in the browser, so this page stays prerender-safe.
 */
export default function HomePage() {
  return <WorkbenchShell />;
}