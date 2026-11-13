// UI language support. English text is the lookup key; `t()` returns it as-is
// for English and looks it up in the Chinese dictionary for Chinese.
// The renderer sets the language once at startup (src/renderer/boot-language.ts)
// and reloads when it changes; the main process sets it from the saved preference.
import { zh } from "./locales/zh";

export type Language = "zh" | "en";
export type LanguagePreference = "system" | Language;

let current: Language = "en";

export function setLanguage(language: Language): void {
  current = language;
}

export function getLanguage(): Language {
  return current;
}

export function isLanguagePreference(value: unknown): value is LanguagePreference {
  return value === "system" || value === "zh" || value === "en";
}

/** Resolves "system" against an OS locale such as "zh-CN" or "en-US". */
export function resolveLanguage(preference: LanguagePreference, systemLocale: string): Language {
  if (preference === "zh" || preference === "en") return preference;
  return /^zh\b/i.test(systemLocale) ? "zh" : "en";
}

/** Translates an English UI string. `{name}` placeholders are filled from `params`. */
export function t(text: string, params?: Record<string, string | number>): string {
  const template = current === "zh" ? zh[text] ?? text : text;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in params ? String(params[key]) : match));
}

/** Locale tag for sorting with localeCompare. */
export function collationLocale(): string {
  return current === "zh" ? "zh-CN" : "en";
}

/** Locale tag for toLocaleDateString / toLocaleString. */
export function dateLocale(): string {
  return current === "zh" ? "zh-CN" : "en-US";
}
