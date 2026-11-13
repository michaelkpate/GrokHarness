import { useMemo, useState } from "react";
import { Archive, MessageSquare, Search } from "lucide-react";
import type { SessionSummary } from "../../shared/types";
import { Dialog } from "./Dialog";
import { t } from "../../shared/i18n";

export function SearchDialog({ sessions, onOpen, onClose }: {
  sessions: SessionSummary[]; onOpen: (session: SessionSummary) => void; onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const results = useMemo(() => {
    const words = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    return sessions.filter((row) => (includeArchived || !row.archived) && words.every((word) => `${row.title || t("New chat")} ${row.cwd || ""}`.toLocaleLowerCase().includes(word)))
      .sort((a, b) => (b.updatedAtMs || Date.parse(b.updatedAt || "") || 0) - (a.updatedAtMs || Date.parse(a.updatedAt || "") || 0)).slice(0, 60);
  }, [sessions, query, includeArchived]);
  return <Dialog title={t("Search chats")} className="search-panel" onClose={onClose} initialFocusSelector="input">
    <div className="search-field"><Search size={18} /><input autoFocus aria-label={t("Search by title or project")} placeholder={t("Search titles or projects...")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.nativeEvent.isComposing && event.nativeEvent.keyCode !== 229 && results[0]) { event.preventDefault(); event.stopPropagation(); onClose(); onOpen(results[0]); } }} /></div>
    <label className="search-options"><input type="checkbox" checked={includeArchived} onChange={(event) => setIncludeArchived(event.target.checked)} />{t("Include archived")}<span>{t("{count} results", { count: results.length })}</span></label>
    <div className="search-results">{results.length ? results.map((row) => <button className="search-result" key={row.sessionId} onClick={() => { onClose(); onOpen(row); }}>
      {row.archived ? <Archive size={16} /> : <MessageSquare size={16} />}<span><strong>{row.title || t("New chat")}</strong><small>{row.cwd || t("No project")}</small></span>{row.running ? <i className="status-dot ready" title={t("Running")} /> : null}
    </button>) : <div className="panel-empty">{t("No matching conversations")}<span>{t("Try another title or project name.")}</span></div>}</div>
  </Dialog>;
}
