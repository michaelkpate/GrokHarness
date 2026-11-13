import { Dialog } from "./ui/Dialog";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { GrokUpdateInfo } from "../shared/types";

export function UpdatePanel({
  update,
  onClose,
  onApply,
}: {
  update?: GrokUpdateInfo;
  onClose: () => void;
  onApply: () => void;
}) {
  const available = Boolean(update?.updateAvailable);
  const notes = available ? update?.latestNotes || update?.currentNotes : update?.currentNotes;
  const atRisk = update?.atRisk ?? [];
  const busyRisk = atRisk.some((row) => row.busy);
  return (
    <Dialog title="Grok Build update" className="changelog-panel" onClose={onClose}>
        <p className="settings-lead">
          {available
            ? `Grok Build ${update?.currentVersion} → ${update?.latestVersion}`
            : `Current Grok Build ${update?.currentVersion || "—"}`}
          {update?.channel ? ` · ${update.channel}` : ""}
        </p>
        {update?.checking ? <p className="settings-lead">Checking for updates...</p> : null}
        {update?.translating ? <p className="settings-lead">Saving the release notes...</p> : null}
        {update?.error ? <div className="error-banner">{update.error}</div> : null}
        {available && atRisk.length > 0 ? (
          <section className="settings-section risk-box">
            <h3>{busyRisk ? "A conversation is running. Updating will interrupt it now." : "Updating will interrupt these conversations"}</h3>
            <ul className="risk-list">
              {atRisk.map((row) => (
                <li key={row.sessionId}>
                  <strong>{row.title}</strong>
                  {row.busy ? <em>Running</em> : null}
                  {row.cwd ? <span>{row.cwd}</span> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {update?.translatedLog ? (
          <section className="settings-section changelog-body">
            <h3>Changelog</h3>
            <div className="md changelog-md">
              <Markdown remarkPlugins={[remarkGfm]}>{update.translatedLog}</Markdown>
            </div>
          </section>
        ) : null}
        <section className="settings-section changelog-body">
          <h3>{available ? `Grok Build ${update?.latestVersion}` : "Installed version"}</h3>
          {available && update?.latestNotes ? (
            <div className="md changelog-md">
              <Markdown remarkPlugins={[remarkGfm]}>{update.latestNotes}</Markdown>
            </div>
          ) : available ? (
            <>
              <p className="settings-lead">Notes for {update?.latestVersion} are not available yet. Showing the log for installed {update?.currentVersion}.</p>
              {update?.currentNotes ? (
                <div className="md changelog-md">
                  <Markdown remarkPlugins={[remarkGfm]}>{update.currentNotes}</Markdown>
                </div>
              ) : null}
            </>
          ) : notes ? (
            <div className="md changelog-md">
              <Markdown remarkPlugins={[remarkGfm]}>{notes}</Markdown>
            </div>
          ) : (
            <p className="settings-lead">No release notes found for this version.</p>
          )}
        </section>
        {available ? (
          <div className="changelog-actions">
            <button className="btn ghost" type="button" onClick={onClose} disabled={update?.applying}>
              Later
            </button>
            <button className="btn danger" type="button" onClick={onApply} disabled={update?.applying}>
              {update?.translating
                ? "Preparing..."
                : update?.applying
                  ? "Updating..."
                  : busyRisk || atRisk.length
                    ? "Interrupt and update"
                    : "Update now"}
            </button>
          </div>
        ) : null}
    </Dialog>
  );
}
