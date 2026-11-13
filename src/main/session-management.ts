import { mkdir, readFile, rename, writeFile, realpath } from "node:fs/promises";
import { homedir } from "node:os";
import { join, dirname, relative, isAbsolute } from "node:path";
import { randomUUID } from "node:crypto";
import type { SessionSummary } from "../shared/types";
import { resolveSessionDir } from "./session-store";

export async function activeLocalSessionIds(): Promise<Set<string>> {
  const home = process.env.GROK_HOME?.trim() || join(homedir(), ".grok");
  let active: unknown;
  try { active = JSON.parse(await readFile(join(home, "active_sessions.json"), "utf8")); }
  catch (err) { if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw new Error("Unable to verify running conversations"); }
  if (active !== undefined && !Array.isArray(active)) throw new Error("Invalid format in the running conversations record");
  return new Set(Array.isArray(active) ? active.map((row) => row?.session_id).filter((id): id is string => typeof id === "string") : []);
}

export function collectSessionTree(rows: SessionSummary[], ids: string[]): SessionSummary[] {
  const selected = new Set(ids);
  let added = true;
  while (added) {
    added = false;
    for (const row of rows) {
      if (row.parentSessionId && selected.has(row.parentSessionId) && !selected.has(row.sessionId)) {
        selected.add(row.sessionId); added = true;
      }
    }
  }
  return rows.filter((row) => selected.has(row.sessionId));
}

/** Local, reversible removal. No CLI or remote session deletion is involved. */
export async function retireLocalSessions(rows: SessionSummary[]): Promise<{ movedIds: string[]; errors: string[]; backupPath: string }> {
  const home = process.env.GROK_HOME?.trim() || join(homedir(), ".grok");
  const sourceRoot = await realpath(join(home, "sessions"));
  const active = await activeLocalSessionIds();
  if (rows.some((row) => active.has(row.sessionId))) throw new Error("A selected conversation or subagent is running; deselect it and try again");
  const backupPath = join(home, "session-cleanup-backups", `${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`);
  await mkdir(join(backupPath, "sessions"), { recursive: true });
  const movedIds: string[] = [];
  const errors: string[] = [];
  const manifest: { id: string; source: string; destination: string; title?: string; moved: boolean }[] = [];
  // Record recovery paths before the first move, including a partially completed batch.
  for (const row of rows) {
    const source = await resolveSessionDir(row.sessionId, row.cwd);
    if (!source) { errors.push(`${row.title || row.sessionId}: local folder not found`); continue; }
    const resolved = await realpath(source);
    const rel = relative(sourceRoot, resolved);
    if (!rel || rel.startsWith("..") || isAbsolute(rel) || dirname(resolved) === sourceRoot) throw new Error("Conversation folder is not inside a valid storage folder");
    manifest.push({ id: row.sessionId, source: resolved, destination: join(backupPath, "sessions", rel), title: row.title, moved: false });
  }
  const save = () => writeFile(join(backupPath, "manifest.json"), JSON.stringify({ createdAt: new Date().toISOString(), sourceRoot, sessions: manifest, errors }, null, 2) + "\n");
  await save();
  for (const entry of manifest) {
    try {
      // The official local active-session registry is re-read for each move.
      const activeNow = await activeLocalSessionIds();
      if (activeNow.has(entry.id)) throw new Error("Conversation is running, skipped");
      const resolved = await realpath(entry.source);
      if (resolved !== entry.source) throw new Error("Conversation storage location changed, skipped");
      await mkdir(dirname(entry.destination), { recursive: true });
      await rename(entry.source, entry.destination);
      entry.moved = true;
      movedIds.push(entry.id);
    } catch (err) { errors.push(`${entry.title || entry.id}: ${err instanceof Error ? err.message : String(err)}`); }
    await save();
  }
  return { movedIds, errors, backupPath };
}
