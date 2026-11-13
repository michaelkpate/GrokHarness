import { t } from "./i18n";

export type SlashCommand = {
  name: string;
  description: string;
  hint?: string;
  source?: string;
};

// Descriptions and hints stay English here (this file also runs in the main process,
// before the language is known); slashCommandText() translates them for display.
const FALLBACK: SlashCommand[] = [
  { name: "compact", description: "Compact conversation history to save context", hint: "what to keep (optional)" },
  { name: "always-approve", description: "Toggle auto-approve for tools", hint: "on|off" },
  { name: "auto", description: "Toggle auto permission mode" },
  { name: "context", description: "Show context window usage" },
  { name: "session-info", description: "Show conversation details" },
  { name: "model", description: "Switch model", hint: "model name" },
  { name: "effort", description: "Set reasoning effort", hint: "low|medium|high|xhigh" },
  { name: "plan", description: "Enter plan mode", hint: "instructions (optional)" },
  { name: "view-plan", description: "View current plan" },
  { name: "fork", description: "Fork a new conversation from here" },
  { name: "rewind", description: "Rewind to an earlier turn" },
  { name: "rename", description: "Rename this conversation", hint: "title" },
  { name: "new", description: "Start a new conversation" },
  { name: "delete", description: "Delete this conversation" },
  { name: "export", description: "Export conversation" },
  { name: "copy", description: "Copy the latest reply", hint: "index or path" },
  { name: "usage", description: "Show quota and usage" },
  { name: "privacy", description: "Coding data and retention settings" },
  { name: "remember", description: "Save a memory now", hint: "text" },
  { name: "flush", description: "Summarize this conversation into memory" },
  { name: "dream", description: "Tidy and merge memories" },
  { name: "memory", description: "Browse or toggle memory", hint: "on|off" },
  { name: "goal", description: "Set or manage a goal", hint: "goal | status | pause" },
  { name: "deep-research", description: "Start deep research", hint: "question" },
  { name: "workflow", description: "Start or manage a workflow", hint: "name" },
  { name: "workflows", description: "Browse saved workflows" },
  { name: "loop", description: "Run on a repeating interval", hint: "30m task" },
  { name: "imagine", description: "Generate an image", hint: "description" },
  { name: "imagine-video", description: "Generate a video", hint: "description" },
  { name: "voice", description: "Voice transcription / dictation", hint: "start or stop" },
  { name: "btw", description: "Ask a side question without interrupting", hint: "question" },
  { name: "feedback", description: "Send feedback" },
  { name: "docs", description: "Open built-in docs", hint: "title" },
  { name: "login", description: "Sign in again" },
  { name: "logout", description: "Sign out" },
  { name: "settings", description: "Open settings" },
  { name: "hooks", description: "View hooks" },
  { name: "plugins", description: "View plugins" },
  { name: "personas", description: "Manage personas" },
  { name: "config-agents", description: "Manage agent definitions" },
  { name: "history", description: "Search input history" },
];

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function isSkillOrMcpCommand(command: SlashCommand): boolean {
  const name = command.name.toLowerCase();
  const source = (command.source ?? "").toLowerCase();
  if (name === "skill" || name === "skills" || name === "mcp" || name === "mcps") return true;
  if (name.includes("mcp") || name.startsWith("skill")) return true;
  if (name.includes(":")) return true;
  if (/(skill|mcp)/.test(source)) return true;
  return false;
}

export function parseSlashCommands(raw: unknown): SlashCommand[] {
  const rows = Array.isArray(raw)
    ? raw
    : Array.isArray(asRecord(raw)?.commands)
      ? (asRecord(raw)?.commands as unknown[])
      : Array.isArray(asRecord(raw)?.availableCommands)
        ? (asRecord(raw)?.availableCommands as unknown[])
        : [];
  const out: SlashCommand[] = [];
  for (const row of rows) {
    const rec = asRecord(row);
    const name = asString(rec?.name) ?? asString(rec?.command);
    if (!name) continue;
    const input = asRecord(rec?.input);
    const command: SlashCommand = {
      name: name.replace(/^\//, ""),
      description: asString(rec?.description) ?? "",
      hint: asString(rec?.hint) ?? asString(input?.hint),
      source: asString(rec?.source) ?? asString(rec?.kind) ?? asString(rec?.type),
    };
    if (isSkillOrMcpCommand(command)) continue;
    out.push(command);
  }
  return out;
}

/** Display text for a command: built-in English descriptions and hints are translated at call time. */
export function slashCommandText(command: SlashCommand): { description: string; hint?: string } {
  return { description: t(command.description), hint: command.hint ? t(command.hint) : command.hint };
}

export function mergeSlashCommands(...lists: SlashCommand[][]): SlashCommand[] {
  const map = new Map<string, SlashCommand>();
  for (const command of FALLBACK) map.set(command.name, command);
  for (const list of lists) {
    for (const command of list) {
      if (isSkillOrMcpCommand(command)) continue;
      const prev = map.get(command.name);
      map.set(command.name, {
        name: command.name,
        description: command.description || prev?.description || "",
        hint: command.hint ?? prev?.hint,
        source: command.source ?? prev?.source,
      });
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}
