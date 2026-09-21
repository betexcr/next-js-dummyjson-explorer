"use client";

/**
 * localStorage-backed settings hook (TASK-041 follow-up).
 */
import { useCallback, useState } from "react";
import {
  loadSettings,
  normalizeSettings,
  saveSettings,
  SETTINGS_STORAGE_KEY,
  type AppSettings,
} from "./settings-store";

function readSettings(): AppSettings {
  if (typeof localStorage === "undefined") return normalizeSettings({});
  try {
    return loadSettings(localStorage.getItem(SETTINGS_STORAGE_KEY));
  } catch {
    return normalizeSettings({});
  }
}

function writeSettings(settings: AppSettings): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, saveSettings(settings));
  } catch {
    // Best-effort persistence.
  }
}

export interface UseSettingsResult {
  settings: AppSettings;
  update: (patch: Partial<AppSettings>) => void;
  reset: () => void;
}

export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<AppSettings>(readSettings);

  const update = useCallback((patch: Partial<AppSettings>) => {
    setSettings((previous) => {
      const next = normalizeSettings({ ...previous, ...patch });
      writeSettings(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    const next = normalizeSettings({});
    setSettings(next);
    writeSettings(next);
  }, []);

  return { settings, update, reset };
}
