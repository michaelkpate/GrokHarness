import { FolderPlus, Image, ListChecks, MessageSquarePlus, Mic, Search, Video, type LucideIcon } from "lucide-react";
import type { StudioTab } from "../MediaStudio";
import { t } from "../../shared/i18n";

export function SidebarNavigation({ studioTab, onNew, onSearch, onWorkspace, onStudio, onManage }: {
  studioTab?: StudioTab; onNew: () => void; onSearch: () => void;
  onWorkspace: () => void; onStudio: (tab: StudioTab) => void;
  onManage?: () => void;
}) {
  const tools: { id: StudioTab; label: string; icon: LucideIcon }[] = [
    { id: "image", label: t("Image generation"), icon: Image }, { id: "video", label: t("Video generation"), icon: Video }, { id: "voice", label: t("Transcription"), icon: Mic },
  ];
  return <nav className="sidebar-navigation" aria-label={t("Main navigation")}>
    <button className="nav-row" onClick={onNew}><MessageSquarePlus size={16} /><span>{t("New chat")}</span><kbd>Ctrl N</kbd></button>
    <button className="nav-row" onClick={onSearch}><Search size={16} /><span>{t("Search chats")}</span><kbd>Ctrl K</kbd></button>
    {onManage && <button className="nav-row" onClick={onManage}><ListChecks size={16} /><span>{t("Manage conversations")}</span></button>}
    <div className="nav-section-label">{t("Tools")}</div>
    {tools.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-row ${studioTab === id ? "on" : ""}`} aria-current={studioTab === id ? "page" : undefined} onClick={() => onStudio(id)}><Icon size={16} /><span>{label}</span></button>)}
    <button className="nav-row add-project" onClick={onWorkspace}><FolderPlus size={16} /><span>{t("Add project")}</span></button>
  </nav>;
}
