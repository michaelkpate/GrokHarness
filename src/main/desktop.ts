import { spawn, type ChildProcess } from "node:child_process";
import { app, net } from "electron";
import { readPreferences, writePreferences } from "./preferences";
import updater from "electron-updater";
import { hasGrokCredentials } from "./account";
import { resolveGrokBinary } from "./resolve-binary";
import { hasWindowsUpdateAssets, isNewerVersion, type DesktopState } from "../shared/desktop";
import { t } from "../shared/i18n";

const { autoUpdater } = updater;

export class DesktopController {
  private state: DesktopState = {
    version: app.getVersion(),
    packaged: app.isPackaged,
    cli: { installed: false, authenticated: false, checking: true, loggingIn: false },
    update: { phase: "idle" },
  };
  private loginChild?: ChildProcess;
  private cliCheck?: Promise<DesktopState>;
  private updateCheck?: Promise<DesktopState>;
  private timer?: ReturnType<typeof setInterval>;
  private listeners = new Set<(state: DesktopState) => void>();

  constructor() {
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = false;
    autoUpdater.on("download-progress", ({ percent }) => {
      this.state.update = { ...this.state.update, phase: "downloading", percent };
      this.emit();
    });
    autoUpdater.on("update-downloaded", () => {
      this.state.update = { ...this.state.update, phase: "downloaded", percent: 100 };
      this.emit();
    });
    autoUpdater.on("error", () => this.updateError());
  }

  getState(): DesktopState {
    return structuredClone(this.state);
  }

  onChange(listener: (state: DesktopState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    for (const listener of this.listeners) listener(this.getState());
  }

  async init(): Promise<void> {
    const preferences = readPreferences();
    if (!process.env.GROK_BINARY && typeof preferences.binary === "string") process.env.GROK_BINARY = preferences.binary;
    await this.checkCli();
    void this.checkUpdate();
    this.timer = setInterval(() => void this.checkUpdate(), 6 * 60 * 60_000);
    this.timer.unref();
  }

  checkCli(): Promise<DesktopState> {
    if (this.cliCheck) return this.cliCheck;
    this.cliCheck = this.inspectCli().finally(() => { this.cliCheck = undefined; });
    return this.cliCheck;
  }

  private async inspectCli(): Promise<DesktopState> {
    this.state.cli = { ...this.state.cli, checking: true, error: undefined };
    this.emit();
    try {
      const binary = resolveGrokBinary();
      if (process.platform === "win32" && !/\.exe$/i.test(binary)) {
        throw new Error(t("Select the official grok.exe executable."));
      }
      const version = await new Promise<string>((resolve, reject) => {
        const child = spawn(binary, ["--version"], {
          windowsHide: true,
          stdio: ["ignore", "pipe", "ignore"],
          env: { ...process.env, GROK_DISABLE_AUTOUPDATER: "1" },
        });
        let output = "";
        const timeout = setTimeout(() => { child.kill(); reject(new Error(t("Grok version check timed out."))); }, 8000);
        child.stdout?.on("data", (data: Buffer) => { output = (output + data.toString()).slice(-1024); });
        child.once("error", (error) => { clearTimeout(timeout); reject(error); });
        child.once("close", (code) => {
          clearTimeout(timeout);
          const match = /^grok\s+(\S+)/m.exec(output);
          if (code === 0 && match) resolve(match[1]);
          else reject(new Error(t("Could not run the selected Grok program.")));
        });
      });
      this.state.cli = { installed: true, authenticated: await hasGrokCredentials(), checking: false,
        loggingIn: Boolean(this.loginChild), binary, version };
    } catch {
      this.state.cli = { installed: false, authenticated: false, checking: false, loggingIn: false,
        error: t("No runnable official Grok CLI found.") };
    }
    this.emit();
    return this.getState();
  }

  async useBinary(binary: string): Promise<DesktopState> {
    if (this.cliCheck) await this.cliCheck;
    const previous = process.env.GROK_BINARY;
    const previousCli = { ...this.state.cli };
    process.env.GROK_BINARY = binary;
    await this.checkCli();
    if (this.state.cli.installed) {
      try {
        writePreferences({ binary });
        return this.getState();
      } catch { /* Preserve the working selection if preferences cannot be saved. */ }
    }
    if (previous) process.env.GROK_BINARY = previous;
    else delete process.env.GROK_BINARY;
    this.state.cli = { ...previousCli, error: t("Could not switch to the selected program; the previous configuration was kept.") };
    this.emit();
    return this.getState();
  }

  cancelLogin(): DesktopState {
    const child = this.loginChild;
    this.loginChild = undefined;
    child?.kill();
    this.state.cli.loggingIn = false;
    this.emit();
    return this.getState();
  }

  login(): DesktopState {
    if (this.loginChild) return this.getState();
    const binary = this.state.cli.binary;
    if (!binary || !this.state.cli.installed) return this.getState();
    const child = spawn(binary, ["login", "--oauth"], {
      windowsHide: true,
      stdio: "ignore",
      env: { ...process.env, GROK_DISABLE_AUTOUPDATER: "1" },
    });
    this.loginChild = child;
    this.state.cli = { ...this.state.cli, loggingIn: true, error: undefined };
    this.emit();
    const finish = async (failed: boolean) => {
      if (this.loginChild !== child) return;
      this.loginChild = undefined;
      await this.checkCli();
      if (failed && !this.state.cli.authenticated) this.state.cli.error = t("Sign-in did not complete. Please try again.");
      this.emit();
    };
    child.once("exit", (code) => void finish(code !== 0));
    child.once("error", () => void finish(true));
    return this.getState();
  }

  checkUpdate(): Promise<DesktopState> {
    if (this.updateCheck) return this.updateCheck;
    if (this.state.update.phase === "downloading" || this.state.update.phase === "downloaded") {
      return Promise.resolve(this.getState());
    }
    this.updateCheck = this.inspectUpdate().finally(() => { this.updateCheck = undefined; });
    return this.updateCheck;
  }

  private async inspectUpdate(): Promise<DesktopState> {
    this.state.update = { phase: "checking" };
    this.emit();
    try {
      const response = await net.fetch("https://api.github.com/repos/Ogurijay/GrokHarness/releases/latest", {
        headers: { Accept: "application/vnd.github+json", "User-Agent": "Grok-Harness" },
        signal: AbortSignal.timeout(15_000),
      });
      if (response.status === 404) {
        this.state.update = { phase: "idle", message: t("No official release yet.") };
      } else {
        if (!response.ok) throw new Error("Release request failed");
        const release = await response.json() as { tag_name?: unknown; assets?: unknown };
        const latestVersion = typeof release.tag_name === "string" ? release.tag_name.replace(/^v/, "") : undefined;
        if (!hasWindowsUpdateAssets(release.assets)) {
          this.state.update = { phase: "idle", latestVersion, message: t("GitHub does not offer a Windows update package yet.") };
        } else if (latestVersion && isNewerVersion(latestVersion, this.state.version)) {
          this.state.update = { phase: "available", latestVersion };
        } else {
          this.state.update = { phase: "idle", latestVersion, message: t("You are on the latest version.") };
        }
      }
    } catch {
      this.updateError();
    }
    this.emit();
    return this.getState();
  }

  private updateError(): void {
    this.state.update = { ...this.state.update, phase: "error", error: t("App update check or download failed. Please try again later.") };
    this.emit();
  }

  async downloadUpdate(): Promise<DesktopState> {
    if (!app.isPackaged || this.state.update.phase !== "available") return this.getState();
    this.state.update = { ...this.state.update, phase: "downloading", percent: 0 };
    this.emit();
    try {
      const result = await autoUpdater.checkForUpdates();
      if (!result?.isUpdateAvailable) {
        this.state.update = { phase: "idle", message: t("You are on the latest version.") };
      } else {
        await autoUpdater.downloadUpdate();
      }
    } catch {
      this.updateError();
    }
    this.emit();
    return this.getState();
  }

  installUpdate(): void {
    if (app.isPackaged && this.state.update.phase === "downloaded") autoUpdater.quitAndInstall(false, true);
  }

  dispose(): void {
    clearInterval(this.timer);
    this.loginChild?.kill();
    this.loginChild = undefined;
  }
}
