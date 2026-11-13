import { app } from "electron";
import { getLanguage, isLanguagePreference, resolveLanguage, setLanguage, t, type Language, type LanguagePreference } from "../shared/i18n";
import { readPreferences, writePreferences } from "./preferences";

let preference: LanguagePreference = "system";

/** Loads the saved language preference. Call after app "ready" (app.getLocale needs it). */
export function initLanguage(): void {
  const saved = readPreferences().language;
  preference = isLanguagePreference(saved) ? saved : "system";
  setLanguage(resolveLanguage(preference, app.getLocale()));
}

export function languageState(): { language: Language; preference: LanguagePreference } {
  return { language: getLanguage(), preference };
}

/** Saves a new preference and applies it to the main process. Returns the resolved state. */
export function setLanguagePreference(next: unknown): { language: Language; preference: LanguagePreference } {
  if (!isLanguagePreference(next)) throw new Error(t("Invalid language"));
  preference = next;
  setLanguage(resolveLanguage(preference, app.getLocale()));
  try {
    writePreferences({ language: preference });
  } catch {
    /* The choice still applies for this run if it cannot be saved. */
  }
  return languageState();
}
