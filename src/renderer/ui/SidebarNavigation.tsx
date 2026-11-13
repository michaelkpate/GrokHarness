import { FolderPlus, Image, ListChecks, MessageSquarePlus, Mic, Search, Video, type LucideIcon } from "lucide-react";
import type { StudioTab } from "../MediaStudio";

export function SidebarNavigation({ studioTab, onNew, onSearch, onWorkspace, onStudio, onManage }: {
  studioTab?: StudioTab; onNew: () => void; onSearch: () => void;
  onWorkspace: () => void; onStudio: (tab: StudioTab) => void;
  onManage?: () => void;
}) {
  const tools: { id: StudioTab; label: string; icon: LucideIcon }[] = [
    { id: "image", label: "Image generation", icon: Image }, { id: "video", label: "Video generation", icon: Video }, { id: "voice", label: "Transcription", icon: Mic },
  ];
  return <nav className="sidebar-navigation" aria-label="Main navigation">
    <button className="nav-row" onClick={onNew}><MessageSquarePlus size={16} /><span>New chat</span><kbd>Ctrl N</kbd></button>
    <button className="nav-row" onClick={onSearch}><Search size={16} /><span>Search chats</span><kbd>Ctrl K</kbd></button>
    {onManage && <button className="nav-row" onClick={onManage}><ListChecks size={16} /><span>Manage conversations</span></button>}
    <div className="nav-section-label">Tools</div>
    {tools.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-row ${studioTab === id ? "on" : ""}`} aria-current={studioTab === id ? "page" : undefined} onClick={() => onStudio(id)}><Icon size={16} /><span>{label}</span></button>)}
    <button className="nav-row add-project" onClick={onWorkspace}><FolderPlus size={16} /><span>Add project</span></button>
  </nav>;
}
