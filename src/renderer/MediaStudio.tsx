import { Dialog } from "./ui/Dialog";
import { Image as ImageIcon, Mic, Play, Video } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ComposerSubmitPayload, MediaAsset, PromptAttachment } from "../shared/types";
import { AttachIcon, ComposerSubmit } from "./composer-controls";
import { useImeEnterGuard } from "./ime";

export type StudioTab = "image" | "video" | "voice";

const ASPECTS = ["auto", "1:1", "16:9", "9:16", "4:3", "3:4"] as const;

const COPY: Record<StudioTab, { title: string; hint: string; empty: string; placeholder: string }> = {
  image: {
    title: "Image generation",
    hint: "Images are saved on this computer. Add a reference image to edit an existing one.",
    empty: "No images yet. Describe a scene below and results will appear here.",
    placeholder: "Describe the scene, e.g. a calm sea at golden sunset with silhouetted palms",
  },
  video: {
    title: "Video generation",
    hint: "Add a reference image as the opening frame, or just describe the shot.",
    empty: "No videos yet. Describe a shot below and results will appear here.",
    placeholder: "Describe the shot, e.g. a cat playing piano in a jazz bar, slow push-in",
  },
  voice: {
    title: "Transcription",
    hint: "Dictate, record or upload audio. Transcripts are saved to the local library.",
    empty: "No transcripts yet. Dictate, record or upload audio and they will appear here.",
    placeholder: "",
  },
};

type SpeechRec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

function speechCtor(): (new () => SpeechRec) | undefined {
  const w = window as Window & { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
  return w.SpeechRecognition || w.webkitSpeechRecognition;
}

function sttLang(code: string): string | undefined {
  if (!code || code === "auto") return undefined;
  if (code === "zh" || code.startsWith("zh")) return "zh-CN";
  if (code === "en" || code.startsWith("en")) return "en-US";
  return code;
}

async function pickImage(): Promise<PromptAttachment | undefined> {
  const rows = await window.grok.pickFiles();
  return rows.find((row) => row.kind === "image");
}

function dayKey(ms: number): string {
  const date = new Date(ms);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function dayLabel(key: string): string {
  const now = new Date();
  const today = dayKey(now.getTime());
  const yest = dayKey(now.getTime() - 86400000);
  if (key === today) return "Today";
  if (key === yest) return "Yesterday";
  return key;
}

function formatWhen(ms: number): string {
  if (!ms) return "";
  return new Date(ms).toLocaleString();
}

function caption(asset: MediaAsset): string {
  const prompt = asset.prompt?.trim();
  if (prompt) return prompt;
  const text = asset.text?.trim();
  if (text) return text;
  const name = asset.name || "";
  if (/^(image|video)-[0-9a-f-]{8,}/i.test(name) || /^\d+\.(jpg|jpeg|png|webp|gif|mp4|webm|mov)$/i.test(name)) return "";
  return name;
}

function groupAssets(rows: MediaAsset[]): { key: string; label: string; items: MediaAsset[] }[] {
  const map = new Map<string, MediaAsset[]>();
  for (const row of rows) {
    const key = dayKey(row.createdAt || Date.now());
    const list = map.get(key) ?? [];
    list.push(row);
    map.set(key, list);
  }
  return [...map.entries()].map(([key, items]) => ({ key, label: dayLabel(key), items }));
}

export function MediaStudio({
  tab,
  busy,
  sessionId,
  voiceCaptureMode,
  voiceLanguage,
  onGenerate,
  onStop,
  onInsertText,
  onOpenSession,
}: {
  tab: StudioTab;
  busy: boolean;
  sessionId?: string;
  voiceCaptureMode: string;
  voiceLanguage: string;
  onGenerate: (payload: ComposerSubmitPayload) => Promise<void>;
  onStop: () => Promise<void>;
  onInsertText: (text: string) => void;
  onOpenSession: (sessionId: string, cwd?: string) => void;
}) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [query, setQuery] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [aspect, setAspect] = useState<(typeof ASPECTS)[number]>("auto");
  const [imageRef, setImageRef] = useState<PromptAttachment | undefined>();
  const [videoPrompt, setVideoPrompt] = useState("");
  const [duration, setDuration] = useState<6 | 10>(6);
  const [videoRef, setVideoRef] = useState<PromptAttachment | undefined>();
  const [sending, setSending] = useState(false);
  const [pending, setPending] = useState(0);
  const [error, setError] = useState<string | undefined>();
  const [viewer, setViewer] = useState<MediaAsset | undefined>();
  const [recording, setRecording] = useState(false);
  const [liveText, setLiveText] = useState("");
  const [finalText, setFinalText] = useState("");
  const recRef = useRef<SpeechRec | undefined>(undefined);
  const mediaRef = useRef<MediaRecorder | undefined>(undefined);
  const chunksRef = useRef<Blob[]>([]);
  const { shouldHoldEnter, onCompositionEnd } = useImeEnterGuard();
  const hold = voiceCaptureMode !== "toggle";
  const copy = COPY[tab];

  async function load() {
    try {
      const rows = await window.grok.listMedia(tab);
      setAssets(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  useEffect(() => {
    setViewer(undefined);
    setQuery("");
    setError(undefined);
    void load();
  }, [tab]);

  useEffect(() => {
    if (!busy && !sending) {
      setPending(0);
      void load();
    }
  }, [busy, sending, tab]);

  useEffect(() => {
    if (!(busy || sending)) return;
    const id = window.setInterval(() => void load(), 2500);
    return () => window.clearInterval(id);
  }, [busy, sending, tab]);

  useEffect(() => () => {
    recRef.current?.stop();
    mediaRef.current?.state === "recording" && mediaRef.current.stop();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return assets;
    return assets.filter((row) =>
      [row.prompt, row.name, row.text, row.sessionId].some((value) => value?.toLowerCase().includes(q)),
    );
  }, [assets, query]);
  const groups = useMemo(() => groupAssets(filtered), [filtered]);

  useEffect(() => {
    if (!viewer) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setViewer(undefined);
        return;
      }
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      const index = filtered.findIndex((row) => row.id === viewer.id);
      if (index < 0) return;
      const next = event.key === "ArrowRight" ? filtered[index + 1] : filtered[index - 1];
      if (next) setViewer(next);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, filtered]);

  async function run(payload: ComposerSubmitPayload, kind: StudioTab, prompt: string) {
    setError(undefined);
    setSending(true);
    setPending((count) => count + 1);
    try {
      await window.grok.recordMediaPrompt(kind, prompt, sessionId);
      await onGenerate(payload);
      void load();
    } catch (err) {
      setPending((count) => Math.max(0, count - 1));
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSending(false);
    }
  }

  async function submitImage() {
    const prompt = imagePrompt.trim();
    if (!prompt) return;
    if (imageRef) {
      await run(
        {
          text: `Use the attached image with image_edit and modify it as described below. Do not create an unrelated new image.\n${prompt}${aspect !== "auto" ? `\naspect_ratio: ${aspect}` : ""}`,
          attachments: [imageRef],
          sessionRefs: [],
        },
        "image",
        prompt,
      );
      return;
    }
    await run(
      {
        text: `/imagine ${prompt}${aspect !== "auto" ? `\nUse aspect_ratio ${aspect}.` : ""}`,
        attachments: [],
        sessionRefs: [],
      },
      "image",
      prompt,
    );
  }

  async function submitVideo() {
    const prompt = videoPrompt.trim();
    if (!prompt) return;
    const extra = videoRef
      ? `Use the attached image as the first frame and call image_to_video. Duration: ${duration} seconds.`
      : `Duration: ${duration} seconds.`;
    await run(
      {
        text: `/imagine-video ${prompt}\n${extra}`,
        attachments: videoRef ? [videoRef] : [],
        sessionRefs: [],
      },
      "video",
      prompt,
    );
  }

  function startSpeech() {
    const Ctor = speechCtor();
    setError(undefined);
    if (!Ctor) {
      setError("Speech recognition is not available here. Record audio for Grok to transcribe, or install a system speech pack.");
      return;
    }
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    const lang = sttLang(voiceLanguage);
    if (lang) rec.lang = lang;
    rec.onresult = (event) => {
      let interim = "";
      let done = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const row = event.results[i];
        if (row.isFinal) done += row[0].transcript;
        else interim += row[0].transcript;
      }
      if (done) setFinalText((prev) => `${prev}${done}`);
      setLiveText(interim);
    };
    rec.onerror = (event) => {
      if (event.error && event.error !== "no-speech" && event.error !== "aborted") {
        setError(event.error);
      }
      setRecording(false);
    };
    rec.onend = () => setRecording(false);
    recRef.current = rec;
    rec.start();
    setRecording(true);
  }

  function stopSpeech() {
    recRef.current?.stop();
    recRef.current = undefined;
    setRecording(false);
  }

  async function startTape() {
    setError(undefined);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
      };
      mediaRef.current = rec;
      rec.start();
      setRecording(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open the microphone");
    }
  }

  async function stopTapeAndSend() {
    const rec = mediaRef.current;
    if (!rec) {
      setRecording(false);
      return;
    }
    const blob = await new Promise<Blob>((resolve) => {
      rec.onstop = () => {
        rec.stream.getTracks().forEach((track) => track.stop());
        resolve(new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" }));
      };
      rec.stop();
    });
    mediaRef.current = undefined;
    setRecording(false);
    if (blob.size < 64) {
      setError("No usable audio was recorded");
      return;
    }
    const buf = await blob.arrayBuffer();
    const ext = blob.type.includes("ogg") ? "ogg" : blob.type.includes("mp4") ? "m4a" : "webm";
    const file = await window.grok.saveAudio(buf, blob.type || "audio/webm", ext);
    if (!file) {
      setError("Could not save the recording");
      return;
    }
    await run(
      {
        text: "Transcribe the attached audio into text. Output only the transcript, with no explanation.",
        attachments: [file],
        sessionRefs: [],
      },
      "voice",
      "Recording",
    );
  }

  async function pickAudioFile() {
    const rows = await window.grok.pickFiles();
    const file = rows.find((row) => row.mimeType.startsWith("audio/") || /\.(wav|mp3|m4a|aac|ogg|webm|flac)$/i.test(row.name));
    if (!file) {
      setError("Choose an audio file");
      return;
    }
    await run(
      {
        text: "Transcribe the attached audio into text. Output only the transcript, with no explanation.",
        attachments: [file],
        sessionRefs: [],
      },
      "voice",
      file.name,
    );
  }

  async function persistTranscript() {
    const text = `${finalText}${liveText}`.trim();
    if (!text) return;
    try {
      await window.grok.saveTranscript(text, "Dictation");
      setFinalText("");
      setLiveText("");
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function useAsRef(asset: MediaAsset) {
    const [row] = await window.grok.inspectPaths([asset.path]);
    if (!row) return;
    if (tab === "video") setVideoRef(row);
    else setImageRef(row);
    setViewer(undefined);
  }

  async function reusePrompt(asset: MediaAsset) {
    const text = asset.prompt || asset.text || "";
    if (tab === "image") setImagePrompt(text);
    else if (tab === "video") setVideoPrompt(text);
    else setFinalText(text);
    setViewer(undefined);
  }

  const transcript = `${finalText}${liveText}`.trim();
  const blocked = busy || sending;
  const skeletons = Math.max(pending, blocked && tab !== "voice" ? 1 : 0);

  return (
    <div className="studio-page">
      <div className="studio-toolbar">
        <span className="studio-count">
          {filtered.length} items{query ? " · filtered" : ""}
        </span>
        <input
          className="studio-search"
          value={query}
          aria-label="Search media"
          placeholder="Search prompts or file names"
          onChange={(event) => setQuery(event.target.value)}
        />
        <p className="studio-lead">{copy.hint}</p>
      </div>

      <div className="studio-scroll">
        {filtered.length === 0 && !skeletons ? (
          <div className="studio-empty">
            <span className="studio-empty-icon">{tab === "image" ? <ImageIcon size={28} /> : tab === "video" ? <Video size={28} /> : <Mic size={28} />}</span>
            <strong>{copy.title}</strong>
            <p>{copy.empty}</p>
          </div>
        ) : tab === "voice" ? (
          <div className="studio-voice-list">
            {skeletons
              ? Array.from({ length: skeletons }, (_, index) => <div className="studio-voice-card pending" key={`p-${index}`} />)
              : null}
            {groups.map((group) => (
              <section key={group.key}>
                <h3 className="studio-day">{group.label}</h3>
                {group.items.map((asset) => (
                  <button className="studio-voice-card" type="button" key={asset.id} onClick={() => setViewer(asset)}>
                    <em>{formatWhen(asset.createdAt)}</em>
                    <p>{caption(asset) || asset.name}</p>
                  </button>
                ))}
              </section>
            ))}
          </div>
        ) : (
          <>
            {filtered.length === 0 && skeletons ? (
              <div className="studio-masonry">
                {Array.from({ length: skeletons }, (_, index) => (
                  <div className="studio-tile pending" key={`p-${index}`} />
                ))}
              </div>
            ) : null}
            {groups.map((group) => (
              <section key={group.key}>
                <h3 className="studio-day">{group.label}</h3>
                <div className="studio-masonry">
                  {group.key === groups[0]?.key && skeletons
                    ? Array.from({ length: skeletons }, (_, index) => <div className="studio-tile pending" key={`s-${index}`} />)
                    : null}
                  {group.items.map((asset) => (
                    <button className="studio-tile" type="button" key={asset.id} onClick={() => setViewer(asset)}>
                      {asset.kind === "video" ? (
                        <video src={asset.src} muted playsInline preload="metadata" />
                      ) : (
                        <img src={asset.src} alt={caption(asset) || asset.name} />
                      )}
                      <span className="studio-tile-mask">
                        <em>{caption(asset) || formatWhen(asset.createdAt)}</em>
                      </span>
                      {asset.kind === "video" ? <i className="studio-play"><Play size={16} fill="currentColor" /></i> : null}
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </>
        )}
      </div>

      <div className="studio-dock">
        {tab === "image" ? (
          <>
            <textarea
              aria-label={`${copy.title} prompt`}
              className="studio-prompt"
              rows={2}
              value={imagePrompt}
              placeholder={copy.placeholder}
              onChange={(event) => setImagePrompt(event.target.value)}
              onCompositionEnd={onCompositionEnd}
              onKeyDown={(event) => {
                if (shouldHoldEnter(event)) return;
                if (event.key === "Enter" && !event.ctrlKey && !event.shiftKey) {
                  event.preventDefault();
                  void submitImage();
                }
              }}
            />
            <div className="studio-dock-row">
              <div className="studio-chips">
                {ASPECTS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`chip-btn ${aspect === item ? "on" : ""}`}
                    onClick={() => setAspect(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <button
                className="icon-btn attach-btn"
                type="button"
                title="Reference image"
                onClick={() => void pickImage().then((row) => row && setImageRef(row))}
              >
                <AttachIcon />
              </button>
              {imageRef ? (
                <button className="studio-ref-thumb" type="button" title="Remove reference" onClick={() => setImageRef(undefined)}>
                  <img src={imageRef.preview || imageRef.path} alt="" />
                </button>
              ) : null}
              <ComposerSubmit
                busy={blocked}
                disabled={!imagePrompt.trim() && !blocked}
                onClick={() => void (blocked ? onStop() : submitImage())}
              />
            </div>
          </>
        ) : null}

        {tab === "video" ? (
          <>
            <textarea
              aria-label={`${copy.title} prompt`}
              className="studio-prompt"
              rows={2}
              value={videoPrompt}
              placeholder={copy.placeholder}
              onChange={(event) => setVideoPrompt(event.target.value)}
              onCompositionEnd={onCompositionEnd}
              onKeyDown={(event) => {
                if (shouldHoldEnter(event)) return;
                if (event.key === "Enter" && !event.ctrlKey && !event.shiftKey) {
                  event.preventDefault();
                  void submitVideo();
                }
              }}
            />
            <div className="studio-dock-row">
              <div className="studio-chips">
                {([6, 10] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`chip-btn ${duration === item ? "on" : ""}`}
                    onClick={() => setDuration(item)}
                  >
                    {item}s
                  </button>
                ))}
              </div>
              <button
                className="icon-btn attach-btn"
                type="button"
                title="First frame"
                onClick={() => void pickImage().then((row) => row && setVideoRef(row))}
              >
                <AttachIcon />
              </button>
              {videoRef ? (
                <button className="studio-ref-thumb" type="button" title="Remove first frame" onClick={() => setVideoRef(undefined)}>
                  <img src={videoRef.preview || videoRef.path} alt="" />
                </button>
              ) : null}
              <ComposerSubmit
                busy={blocked}
                disabled={!videoPrompt.trim() && !blocked}
                onClick={() => void (blocked ? onStop() : submitVideo())}
              />
            </div>
          </>
        ) : null}

        {tab === "voice" ? (
          <>
            <div className="studio-transcript">{transcript || "The transcript will appear here."}</div>
            <div className="studio-dock-row">
              <button
                className={`studio-mic ${recording ? "on" : ""}`}
                type="button"
                disabled={blocked}
                onMouseDown={() => {
                  if (hold) startSpeech();
                }}
                onMouseUp={() => {
                  if (hold) stopSpeech();
                }}
                onMouseLeave={() => {
                  if (hold && recording) stopSpeech();
                }}
                onClick={() => {
                  if (hold) return;
                  recording ? stopSpeech() : startSpeech();
                }}
              >
                {recording ? "Listening..." : hold ? "Hold to talk" : "Start dictation"}
              </button>
              <button
                className="btn ghost"
                type="button"
                disabled={blocked}
                onClick={() => void (recording && mediaRef.current ? stopTapeAndSend() : startTape())}
              >
                {recording && mediaRef.current ? "Stop & transcribe" : "Record & transcribe"}
              </button>
              <button className="btn ghost" type="button" disabled={blocked} onClick={() => void pickAudioFile()}>
                Upload audio
              </button>
              <button className="btn ghost" type="button" disabled={!transcript} onClick={() => void persistTranscript()}>
                Save to library
              </button>
              <button
                className="btn primary"
                type="button"
                disabled={!transcript}
                onClick={() => {
                  onInsertText(transcript);
                }}
              >
                Insert into chat
              </button>
            </div>
          </>
        ) : null}

        {error ? <div className="error-banner">{error}</div> : null}
        {blocked && !error ? <p className="studio-hint">Generating. Results appear in the library when done; the conversation continues in the background.</p> : null}
      </div>

      {viewer ? (
        <Dialog title="Preview" className="media-preview-panel" onClose={() => setViewer(undefined)}>
          <div className="studio-lightbox-body" onClick={(event) => event.stopPropagation()}>
            <div className="studio-lightbox-stage">
              {viewer.kind === "video" ? (
                <video src={viewer.src} controls autoPlay />
              ) : viewer.kind === "voice" ? (
                <pre>{viewer.text || viewer.prompt || viewer.name}</pre>
              ) : (
                <img src={viewer.src} alt={viewer.prompt || viewer.name} />
              )}
            </div>
            <aside className="studio-lightbox-meta">
              <strong>{viewer.kind === "voice" ? "Transcript" : "Prompt"}</strong>
              <p>{caption(viewer) || "No prompt recorded"}</p>
              <em>{formatWhen(viewer.createdAt)}</em>
              <div className="studio-lightbox-actions">
                <button className="btn ghost" type="button" onClick={() => void reusePrompt(viewer)}>
                  Reuse prompt
                </button>
                {viewer.kind !== "voice" ? (
                  <button className="btn ghost" type="button" onClick={() => void useAsRef(viewer)}>
                    Use as reference
                  </button>
                ) : (
                  <button
                    className="btn ghost"
                    type="button"
                    onClick={() => {
                      if (viewer.text) onInsertText(viewer.text);
                    }}
                  >
                    Insert into input
                  </button>
                )}
                {viewer.path ? (
                  <button className="btn ghost" type="button" onClick={() => void window.grok.exportMedia(viewer.path, viewer.name)}>
                    Download
                  </button>
                ) : null}
                {viewer.path ? (
                  <button className="btn ghost" type="button" onClick={() => void window.grok.copyMedia(viewer.path)}>
                    Copy
                  </button>
                ) : null}
                {viewer.path ? (
                  <button className="btn ghost" type="button" onClick={() => void window.grok.revealMedia(viewer.path)}>
                    Show in folder
                  </button>
                ) : null}
                {viewer.sessionId ? (
                  <button className="btn ghost" type="button" onClick={() => onOpenSession(viewer.sessionId!, viewer.cwd)}>
                    View conversation
                  </button>
                ) : null}
                <button
                  className="btn ghost danger"
                  type="button"
                  onClick={() => {
                    void window.grok.deleteMedia(viewer.id).then((result) => {
                      if (!result.ok) {
                        if (result.error) setError(result.error);
                        return;
                      }
                      setViewer(undefined);
                      void load();
                    });
                  }}
                >
                  Delete
                </button>
              </div>
            </aside>
          </div>
        </Dialog>
      ) : null}
    </div>
  );
}
