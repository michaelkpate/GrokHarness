import { useEffect, useRef, useState } from "react";
import { Dialog } from "./ui/Dialog";
import { CheckCircle2, Download, ExternalLink, FolderOpen, LogIn, RefreshCw, RotateCw, X } from "lucide-react";
import type { DesktopState } from "../shared/desktop";
import "./desktop.css";

export function DesktopPanel({ open, onOpen, onClose }: { open: boolean; onOpen: () => void; onClose: () => void }) {
  const [state, setState] = useState<DesktopState>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const initial = useRef(true);
  const openCallback = useRef(onOpen);
  openCallback.current = onOpen;

  useEffect(() => {
    const receive = (next: DesktopState) => {
      setState(next);
      if (initial.current && !next.cli.checking) {
        initial.current = false;
        if (!next.cli.installed || !next.cli.authenticated) openCallback.current();
      }
    };
    const unsubscribe = window.grok.desktop.onState(receive);
    const unsubscribeOpen = window.grok.desktop.onOpen(() => openCallback.current());
    void window.grok.desktop.getState().then(receive).catch(() => setError("Could not read the desktop app state."));
    return () => { unsubscribe(); unsubscribeOpen(); };
  }, []);

  const run = async (action: () => Promise<DesktopState | void | boolean>) => {
    setPending(true); setError("");
    try {
      const next = await action();
      if (next && typeof next === "object") setState(next);
    } catch { setError("The action did not finish. Make sure the current conversation has ended, then try again."); }
    finally { setPending(false); }
  };
  if (!open) return null;
  const cli = state?.cli;
  const update = state?.update;
  const updating = update?.phase === "checking" || update?.phase === "downloading";
  return (
    <Dialog title="Grok-Harness" className="desktop-panel" closeLabel="Close desktop app panel" onClose={onClose}>
        <p className="settings-lead">Desktop app {state ? `v${state.version}` : ""}</p>
        <section className="desktop-section">
          <div className="desktop-row"><h3>Grok Build</h3><span className={`desktop-status ${cli?.installed ? "ready" : ""}`}>{cli?.checking ? "Checking" : cli?.installed ? `v${cli.version}` : "Not installed"}</span></div>
          {cli?.binary && <div className="desktop-path" title={cli.binary}>{cli.binary}</div>}
          <div className="desktop-row desktop-auth"><span>Account</span><span>{cli?.loggingIn ? "Waiting for browser sign-in" : cli?.authenticated ? <><CheckCircle2 size={15} /> Signed in, credentials saved</> : "Not signed in"}</span></div>
          {cli?.error && <p className="desktop-error" role="alert">{cli.error}</p>}
          <div className="desktop-actions">
            {!cli?.installed && <button onClick={() => void run(() => window.grok.desktop.openLink("install"))} disabled={pending}><ExternalLink size={16} />Install Grok CLI</button>}
            <button onClick={() => void run(window.grok.desktop.chooseBinary)} disabled={pending || cli?.loggingIn}><FolderOpen size={16} />Choose program</button>
            {cli?.installed && (cli.loggingIn ? <button onClick={() => void run(window.grok.desktop.cancelLogin)} disabled={pending}><X size={16} />Cancel sign-in</button> : <button className="primary" onClick={() => void run(window.grok.desktop.login)} disabled={pending}><LogIn size={16} />{cli.authenticated ? "Sign in again" : "Sign in with browser"}</button>)}
            <button className="desktop-icon" title="Recheck Grok and account" aria-label="Recheck Grok and account" onClick={() => void run(window.grok.desktop.refresh)} disabled={pending || cli?.checking}><RefreshCw size={16} /></button>
          </div>
        </section>
        <section className="desktop-section">
          <div className="desktop-row"><h3>App updates</h3><span className="desktop-status">{update?.latestVersion ? `Release v${update.latestVersion}` : "GitHub Releases"}</span></div>
          <p className="desktop-update" aria-live="polite">{update?.phase === "checking" ? "Checking for app updates" : update?.phase === "available" ? `v${update.latestVersion} available` : update?.phase === "downloading" ? `Downloading ${Math.round(update.percent || 0)}%` : update?.phase === "downloaded" ? "Update downloaded. Restart to install." : update?.error || update?.message || "Not checked yet"}</p>
          {update?.phase === "downloading" && <progress max={100} value={update.percent || 0} aria-label="App update download progress" />}
          <div className="desktop-actions">
            <button onClick={() => void run(window.grok.desktop.checkUpdate)} disabled={pending || updating || update?.phase === "downloaded"}><RefreshCw size={16} />Check for updates</button>
            {update?.phase === "available" && state?.packaged && <button className="primary" onClick={() => void run(window.grok.desktop.downloadUpdate)} disabled={pending}><Download size={16} />Download update</button>}
            {update?.phase === "downloaded" && <button className="primary" onClick={() => void run(window.grok.desktop.installUpdate)} disabled={pending}><RotateCw size={16} />Restart to install</button>}
            <button className="desktop-icon" title="Open GitHub releases page" aria-label="Open GitHub releases page" onClick={() => void run(() => window.grok.desktop.openLink("releases"))} disabled={pending}><ExternalLink size={16} /></button>
          </div>
        </section>
        {error && <p className="desktop-error" role="alert">{error}</p>}
    </Dialog>
  );
}
