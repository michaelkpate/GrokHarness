import { useMemo, useRef, useState } from "react";
import type { GrokSettings, SettingsField } from "../shared/grok-settings";
import { SETTINGS_SECTIONS } from "../shared/grok-settings";
import type { ModelInfo } from "../shared/types";
import type { AccountInfo } from "../shared/types";
import { ArrowUpRight, ChevronRight, CircleUserRound, Monitor, Search, Settings2, ShieldCheck, BrainCircuit, Palette, ScrollText, Blocks, MessagesSquare, Wrench, Box, GitBranch, Bell, ScanLine, Terminal, type LucideIcon } from "lucide-react";
import { Dialog } from "./ui/Dialog";
import type { Appearance } from "./ui/appearance";
import { t, type LanguagePreference } from "../shared/i18n";

// Language names are shown in their own language so either reader can find theirs.
const LANGUAGE_OPTIONS: ReadonlyArray<readonly [LanguagePreference, string | null]> = [["system", null], ["zh", "中文"], ["en", "English"]]; // i18n-allow-cjk

async function changeLanguage(preference: LanguagePreference): Promise<void> {
  if (preference === window.grok.i18n.preference) return;
  await window.grok.i18n.setPreference(preference);
  window.location.reload();
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "Appearance": Monitor, "Account": CircleUserRound, "Permissions": ShieldCheck, "Models": BrainCircuit,
  "Display": Palette, "Scrolling": ScrollText, "Features": Blocks, "Conversation": MessagesSquare,
  "Tools": Wrench, "Sandbox": Box, "Worktree": GitBranch, "Notifications": Bell,
  "Compatibility": ScanLine, "CLI": Terminal,
};

const MODEL_KEYS = new Set<keyof GrokSettings>([
  "defaultModel",
  "webSearchModel",
  "sessionSummaryModel",
  "imageDescriptionModel",
  "forkSecondaryModel",
]);

function FieldControl({
  field,
  value,
  models,
  onChange,
}: {
  field: SettingsField;
  value: GrokSettings[keyof GrokSettings];
  models: ModelInfo[];
  onChange: (value: unknown) => void;
}) {
  if (MODEL_KEYS.has(field.key) && models.length > 0) {
    const current = String(value ?? "");
    const known = models.some((model) => model.modelId === current);
    const allowEmpty = field.key !== "defaultModel";
    return (
      <select className="chip settings-input" value={current} onChange={(event) => onChange(event.target.value)}>
        {allowEmpty ? <option value="">{t("Use default")}</option> : null}
        {!known && current ? <option value={current}>{current}</option> : null}
        {models.map((model) => (
          <option key={model.modelId} value={model.modelId}>
            {model.name}
          </option>
        ))}
      </select>
    );
  }
  if (field.kind === "toggle") {
    return (
      <input className="settings-switch" role="switch" type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />
    );
  }
  if (field.kind === "select") {
    return (
      <select className="chip settings-input" value={String(value ?? "")} onChange={(event) => onChange(event.target.value)}>
        {field.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label === option.value ? option.label : t(option.label)}
          </option>
        ))}
      </select>
    );
  }
  if (field.kind === "number") {
    const empty = value === null || value === undefined || Number.isNaN(Number(value));
    return (
      <input
        className="settings-input"
        type="number"
        min={field.min}
        max={field.max}
        placeholder={field.optional ? t("Default") : undefined}
        value={empty ? "" : Number(value)}
        onChange={(event) => {
          const text = event.target.value;
          if (text === "") onChange(field.optional ? null : field.min ?? 0);
          else onChange(Number(text));
        }}
      />
    );
  }
  return (
    <input
      className="settings-input"
      type="text"
      placeholder={field.kind === "list" ? t("Comma-separated") : undefined}
      value={String(value ?? "")}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export function SettingsPanel({
  settings,
  models,
  onClose,
  onChange,
  appearance,
  onAppearance,
  account,
  onDesktop,
  onUsage,
  onUpdate,
}: {
  settings: GrokSettings;
  models: ModelInfo[];
  onClose: () => void;
  onChange: (key: keyof GrokSettings, value: unknown) => void;
  appearance: Appearance;
  onAppearance: (value: Appearance) => void;
  account: AccountInfo;
  onDesktop: () => void;
  onUsage: () => void;
  onUpdate: () => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Appearance");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const content = useRef<HTMLDivElement>(null);
  const connectionLabel = account.connection === "ready" ? t("Connected") : account.connection === "starting" ? t("Connecting") : t("Not connected");
  const usedPercent = account.quota?.usedPercent;
  const usage = usedPercent != null && Number.isFinite(usedPercent) ? Math.min(100, Math.max(0, Math.round(usedPercent))) : undefined;
  const needle = query.trim().toLowerCase();
  const sections = useMemo(() => {
    return SETTINGS_SECTIONS.map((section) => ({
      ...section,
      fields: needle
        ? section.fields.filter((field) =>
            `${section.title} ${t(section.title)} ${field.label} ${t(field.label)} ${field.hint} ${t(field.hint)} ${field.key}`.toLowerCase().includes(needle),
          )
        : section.fields,
    })).filter((section) => section.fields.length > 0);
  }, [needle]);

  return (
    <Dialog title={t("Settings")} className="preferences-panel" onClose={onClose}>
      <div className="preferences-layout">
        <nav className="preferences-nav" aria-label={t("Settings categories")}>
          {["Appearance", "Account", ...SETTINGS_SECTIONS.map((section) => section.title)].map((title) => {
            const Icon = CATEGORY_ICONS[title] ?? Settings2;
            return <button type="button" key={title} className={`preferences-nav-row ${category === title && !needle ? "on" : ""}`} aria-current={category === title && !needle ? "page" : undefined} onClick={() => { setCategory(title); setQuery(""); if (content.current) content.current.scrollTop = 0; }}>
              <Icon size={16} /><span>{t(title)}</span>
            </button>
          })}
          <div className="preferences-nav-links">
            <button onClick={onDesktop}>{t("App and updates")}<ArrowUpRight size={14} /></button>
            <button onClick={onUsage}>{t("Usage")}<ArrowUpRight size={14} /></button>
            <button onClick={onUpdate}>{t("Grok Build updates")}<ArrowUpRight size={14} /></button>
          </div>
        </nav>
        <div className="preferences-content" ref={content}>
          <div className="preferences-search"><Search size={16} /><input type="search" value={query} placeholder={t("Search all settings")} aria-label={t("Search all settings")} onChange={(event) => setQuery(event.target.value)} /></div>
          {!needle && category === "Appearance" ? <>
            <h3 className="preferences-title">{t("Appearance")}</h3><p className="preferences-description">{t("Adjust how Grok Harness looks.")}</p>
            <section className="settings-section">
              <div className="settings-row"><span><strong>{t("Theme")}</strong><em>{t("Light, dark, or match the system.")}</em></span><div className="theme-options">{([['system', t("System")], ['light', t("Light")], ['dark', t("Dark")]] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={appearance.theme === value} className={appearance.theme === value ? "on" : ""} onClick={() => onAppearance({ ...appearance, theme: value })}>{label}</button>)}</div></div>
              <div className="settings-row"><span><strong>{t("Language")}</strong><em>{t("Interface language. Changing it reloads the window.")}</em></span><div className="theme-options">{LANGUAGE_OPTIONS.map(([value, label]) => <button key={value} type="button" aria-pressed={window.grok.i18n.preference === value} className={window.grok.i18n.preference === value ? "on" : ""} onClick={() => void changeLanguage(value)}>{label ?? t("System")}</button>)}</div></div>
              <label className="settings-row"><span><strong>{t("Text size")}</strong><em>{t("Used for message text and the input box.")}</em></span><select className="settings-input" value={appearance.textSize} onChange={(event) => onAppearance({ ...appearance, textSize: Number(event.target.value) })}>{[13, 14, 15, 16].map((size) => <option key={size} value={size}>{size} px</option>)}</select></label>
              <label className="settings-row"><span><strong>{t("Sidebar width")}</strong><em>{t("You can also drag the sidebar's right edge.")}</em></span><input className="settings-input" type="number" min={280} max={520} step={10} value={appearance.sidebarWidth} onChange={(event) => { const width = Number(event.target.value); if (width >= 280 && width <= 520) onAppearance({ ...appearance, sidebarWidth: width }); }} /></label>
              <label className="settings-row"><span><strong>{t("Compact mode")}</strong><em>{t("Tighter vertical spacing in conversations.")}</em></span><input role="switch" className="settings-switch" type="checkbox" checked={settings.compactMode} onChange={(event) => onChange("compactMode", event.target.checked)} /></label>
            </section>
            <div className="appearance-preview"><span className="preview-user">{t("Help me tidy up this project")}</span><p>{t("Sure. I'll start with the project structure and the current workspace.")}</p><div><span className="status-dot ready" />{t("Grok · Ready")}</div></div>
          </> : null}
          {!needle && category === "Account" ? <>
            <h3 className="preferences-title">{t("Account")}</h3><p className="preferences-description">{t("Local account status from Grok Build.")}</p>
            <section className="settings-section account-settings" aria-label={t("Account details")}>
              <div className="account-profile"><span className="avatar">{account.email?.[0]?.toUpperCase() || "G"}</span><span className="account-profile-copy"><strong>{account.email || t("Grok account")}</strong><small>{account.plan || account.quota?.plan || t("No plan info")}</small></span><span className={`account-connection ${account.connection}`}><i />{connectionLabel}</span></div>
              <div className="settings-row"><span><strong>{t("Current model")}</strong></span><span className="account-value">{account.modelName || "—"}</span></div>
              <div className="settings-row"><span><strong>{t("Grok Build version")}</strong></span><span className="account-value">{account.agentVersion || "—"}</span></div>
              <div className="settings-row"><span><strong>{t("Quota used")}</strong></span><span className="account-value account-usage">{usage == null ? t("No data") : <><span>{usage}%</span><span className="account-usage-track" role="progressbar" aria-label={t("Quota used")} aria-valuemin={0} aria-valuemax={100} aria-valuenow={usage}><i style={{ width: `${usage}%` }} /></span></>}</span></div>
              <button type="button" className="settings-action-row" onClick={onDesktop}><span>{t("Manage sign-in and app updates")}</span><ChevronRight size={16} /></button>
              <button type="button" className="settings-action-row" onClick={onUsage}><span>{t("View local usage")}</span><ChevronRight size={16} /></button>
            </section>
          </> : null}
          {(needle ? sections : sections.filter((section) => section.title === category)).map((section) => (
          <section className="preferences-group" key={section.title}>
            <h3>{t(section.title)}</h3>
            <div className="settings-section">
            {section.fields.map((field) => (
              <label className="settings-row" key={field.key}>
                <span>
                  <strong>{t(field.label)}</strong>
                  {showAdvanced ? <em>{t(field.hint)}</em> : null}
                </span>
                <FieldControl
                  field={field}
                  value={settings[field.key]}
                  models={models}
                  onChange={(value) => onChange(field.key, value)}
                />
              </label>
            ))}
            </div>
          </section>
        ))}
          {needle && !sections.length ? <div className="panel-empty">{t("No matching settings")}<span>{t("Try a feature or config key name.")}</span></div> : null}
          {(needle || (category !== "Appearance" && category !== "Account")) ? <label className="advanced-toggle"><input type="checkbox" checked={showAdvanced} onChange={(event) => setShowAdvanced(event.target.checked)} />{t("Show config keys")}</label> : null}
        </div>
      </div>
    </Dialog>
  );
}
