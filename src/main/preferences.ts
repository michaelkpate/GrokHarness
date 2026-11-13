import { app } from "electron";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// desktop-preferences.json in the app's user-data folder. Writes merge into
// what is already saved so one preference never erases another.
export type DesktopPreferences = { binary?: string; language?: string };

function preferencesFile(): string {
  return join(app.getPath("userData"), "desktop-preferences.json");
}

export function readPreferences(): DesktopPreferences {
  try {
    const saved = JSON.parse(readFileSync(preferencesFile(), "utf8"));
    return saved && typeof saved === "object" ? saved : {};
  } catch {
    return {};
  }
}

export function writePreferences(patch: DesktopPreferences): void {
  writeFileSync(preferencesFile(), JSON.stringify({ ...readPreferences(), ...patch }), "utf8");
}
