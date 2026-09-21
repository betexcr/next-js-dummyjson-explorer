import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "DummyJSON Workbench",
  description:
    "A developer workbench for exploring, learning, testing, and exercising the DummyJSON REST API.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-dvh">
        {/* WCAG 2.4.1: first focusable element lets keyboard users skip the header. */}
        <a
          href="#main-content"
          className="sr-only z-50 focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-indigo-700 focus:shadow-lg dark:focus:bg-zinc-900 dark:focus:text-indigo-300"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}