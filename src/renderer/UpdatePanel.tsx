import { Dialog } from "./ui/Dialog";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { GrokUpdateInfo } from "../shared/types";
import { t } from "../shared/i18n";

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
    <Dialog title={t("Grok Build update")} className="changelog-panel" onClose={onClose}>
        <p className="settings-lead">
          {available
            ? `Grok Build ${update?.currentVersion} → ${update?.latestVersion}`
            : t("Current Grok Build {version}", { version: update?.currentVersion || "—" })}
          {update?.channel ? ` · ${update.channel}` : ""}
        </p>
        {update?.checking ? <p className="settings-lead">{t("Checking for updates...")}</p> : null}
        {update?.translating ? <p className="settings-lead">{t("Saving the release notes...")}</p> : null}
        {update?.error ? <div className="error-banner">{update.error}</div> : null}
        {available && atRisk.length > 0 ? (
          <section className="settings-section risk-box">
            <h3>{busyRisk ? t("A conversation is running. Updating will interrupt it now.") : t("Updating will interrupt these conversations")}</h3>
            <ul className="risk-list">
              {atRisk.map((row) => (
                <li key={row.sessionId}>
                  <strong>{row.title}</strong>
                  {row.busy ? <em>{t("Running")}</em> : null}
                  {row.cwd ? <span>{row.cwd}</span> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {update?.translatedLog ? (
          <section className="settings-section changelog-body">
            <h3>{t("Changelog")}</h3>
            <div className="md changelog-md">
              <Markdown remarkPlugins={[remarkGfm]}>{update.translatedLog}</Markdown>
            </div>
          </section>
        ) : null}
        <section className="settings-section changelog-body">
          <h3>{available ? `Grok Build ${update?.latestVersion}` : t("Installed version")}</h3>
          {available && update?.latestNotes ? (
            <div className="md changelog-md">
              <Markdown remarkPlugins={[remarkGfm]}>{update.latestNotes}</Markdown>
            </div>
          ) : available ? (
            <>
              <p className="settings-lead">{t("Notes for {latest} are not available yet. Showing the log for installed {current}.", { latest: update?.latestVersion ?? "", current: update?.currentVersion ?? "" })}</p>
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
            <p className="settings-lead">{t("No release notes found for this version.")}</p>
          )}
        </section>
        {available ? (
          <div className="changelog-actions">
            <button className="btn ghost" type="button" onClick={onClose} disabled={update?.applying}>
              {t("Later")}
            </button>
            <button className="btn danger" type="button" onClick={onApply} disabled={update?.applying}>
              {update?.translating
                ? t("Preparing...")
                : update?.applying
                  ? t("Updating...")
                  : busyRisk || atRisk.length
                    ? t("Interrupt and update")
                    : t("Update now")}
            </button>
          </div>
        ) : null}
    </Dialog>
  );
}
