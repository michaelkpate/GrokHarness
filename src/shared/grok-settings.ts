export type PermissionMode = "ask" | "auto" | "always-approve";

export type GrokSettings = {
  autoUpdate: boolean;
  cliChannel: string;
  showTips: boolean;
  defaultModel: string;
  defaultEffort: string;
  webSearchModel: string;
  sessionSummaryModel: string;
  imageDescriptionModel: string;
  permissionMode: PermissionMode;
  rememberToolApprovals: boolean;
  defaultSelectedPermission: string;
  showThinkingBlocks: boolean;
  groupToolVerbs: boolean;
  collapsedEditBlocks: boolean;
  pageFlipOnSend: boolean;
  followUpBehavior: "queue" | "steer";
  compactMode: boolean;
  showTimestamps: boolean;
  showTimeline: boolean;
  combineQueuedPrompts: boolean;
  forkSecondaryModel: string;
  maxThoughtsWidth: number;
  promptSuggestions: boolean;
  theme: string;
  autoDarkTheme: string;
  autoLightTheme: string;
  simpleMode: boolean;
  vimMode: boolean;
  screenMode: string;
  renderMermaid: string;
  scrollSpeed: number;
  scrollMode: string;
  scrollLines: number | null;
  invertScroll: boolean;
  cancelSubagentsOnTurnCancel: string;
  hunkTrackerMode: string;
  voiceKeybindEnabled: boolean;
  voiceCaptureMode: string;
  voiceSttLanguage: string;
  imageGen: boolean;
  videoGen: boolean;
  voiceMode: boolean;
  telemetry: boolean;
  feedback: boolean;
  lspTools: boolean;
  codebaseIndexing: boolean;
  twoPassCompaction: boolean;
  remoteFetch: boolean;
  webFetch: boolean;
  writeFile: boolean;
  toolSearch: boolean;
  memoryEnabled: boolean;
  subagentsEnabled: boolean;
  workflowsEnabled: boolean;
  traceUpload: boolean;
  disableCodebaseUpload: boolean;
  autoCompactPercent: number;
  loadEnvrc: boolean;
  respectGitignore: boolean;
  bashTimeoutSecs: number;
  bashOutputByteLimit: number;
  bashMaxTimeoutSecs: number;
  bashAutoBackgroundOnTimeout: boolean;
  askQuestionTimeoutEnabled: boolean;
  askQuestionTimeoutSecs: number;
  webFetchAllowLocal: boolean;
  webFetchAllowedDomains: string;
  webSearchAllowedDomains: string;
  webSearchExcludedDomains: string;
  sandboxProfile: string;
  sandboxAutoAllowBash: boolean;
  newSessionWorktreeMode: string;
  forkWorktreeMode: string;
  notifyMethod: string;
  notifyCondition: string;
  notifyIdleSecs: number;
  notifyTurnComplete: boolean;
  notifyApproval: boolean;
  notifySleepPrevention: boolean;
  notifyProgressBar: boolean;
  notifyTitleEnabled: boolean;
  cursorSkills: boolean;
  cursorRules: boolean;
  cursorAgents: boolean;
  cursorMcps: boolean;
  cursorHooks: boolean;
  claudeSkills: boolean;
  claudeRules: boolean;
  claudeAgents: boolean;
  claudeMcps: boolean;
  claudeHooks: boolean;
};

export const GROK_SETTINGS_DEFAULTS: GrokSettings = {
  autoUpdate: true,
  cliChannel: "stable",
  showTips: true,
  defaultModel: "grok-4.6",
  defaultEffort: "high",
  webSearchModel: "",
  sessionSummaryModel: "",
  imageDescriptionModel: "",
  permissionMode: "ask",
  rememberToolApprovals: true,
  defaultSelectedPermission: "always_allow_all_sessions",
  showThinkingBlocks: true,
  groupToolVerbs: true,
  collapsedEditBlocks: false,
  pageFlipOnSend: true,
  followUpBehavior: "queue",
  compactMode: false,
  showTimestamps: true,
  showTimeline: false,
  combineQueuedPrompts: false,
  forkSecondaryModel: "",
  maxThoughtsWidth: 120,
  promptSuggestions: true,
  theme: "groknight",
  autoDarkTheme: "groknight",
  autoLightTheme: "grokday",
  simpleMode: true,
  vimMode: false,
  screenMode: "fullscreen",
  renderMermaid: "auto",
  scrollSpeed: 50,
  scrollMode: "auto",
  scrollLines: null,
  invertScroll: false,
  cancelSubagentsOnTurnCancel: "ask",
  hunkTrackerMode: "agent_only",
  voiceKeybindEnabled: true,
  voiceCaptureMode: "hold",
  voiceSttLanguage: "auto",
  imageGen: true,
  videoGen: true,
  voiceMode: true,
  telemetry: false,
  feedback: true,
  lspTools: false,
  codebaseIndexing: true,
  twoPassCompaction: false,
  remoteFetch: true,
  webFetch: false,
  writeFile: true,
  toolSearch: true,
  memoryEnabled: false,
  subagentsEnabled: true,
  workflowsEnabled: true,
  traceUpload: false,
  disableCodebaseUpload: false,
  autoCompactPercent: 85,
  loadEnvrc: true,
  respectGitignore: false,
  bashTimeoutSecs: 120,
  bashOutputByteLimit: 20000,
  bashMaxTimeoutSecs: 36000,
  bashAutoBackgroundOnTimeout: true,
  askQuestionTimeoutEnabled: true,
  askQuestionTimeoutSecs: 1800,
  webFetchAllowLocal: false,
  webFetchAllowedDomains: "",
  webSearchAllowedDomains: "",
  webSearchExcludedDomains: "",
  sandboxProfile: "off",
  sandboxAutoAllowBash: false,
  newSessionWorktreeMode: "never",
  forkWorktreeMode: "ask",
  notifyMethod: "auto",
  notifyCondition: "unfocused",
  notifyIdleSecs: 3,
  notifyTurnComplete: true,
  notifyApproval: true,
  notifySleepPrevention: true,
  notifyProgressBar: true,
  notifyTitleEnabled: true,
  cursorSkills: true,
  cursorRules: true,
  cursorAgents: true,
  cursorMcps: true,
  cursorHooks: true,
  claudeSkills: true,
  claudeRules: true,
  claudeAgents: true,
  claudeMcps: true,
  claudeHooks: true,
};

export function isGrokSettingKey(key: string): key is keyof GrokSettings {
  return Object.prototype.hasOwnProperty.call(GROK_SETTINGS_DEFAULTS, key);
}

export type SettingsField =
  | { key: keyof GrokSettings; kind: "toggle"; label: string; hint: string }
  | { key: keyof GrokSettings; kind: "select"; label: string; hint: string; options: { value: string; label: string }[] }
  | { key: keyof GrokSettings; kind: "text" | "list"; label: string; hint: string }
  | {
      key: keyof GrokSettings;
      kind: "number";
      label: string;
      hint: string;
      min?: number;
      max?: number;
      optional?: boolean;
    };

const THEME_OPTIONS = [
  { value: "auto", label: "auto · System" },
  { value: "groknight", label: "groknight" },
  { value: "grokday", label: "grokday" },
  { value: "tokyonight", label: "tokyonight" },
  { value: "rosepine", label: "rosepine" },
  { value: "oscura", label: "oscura" },
];

const WORKTREE_OPTIONS = [
  { value: "ask", label: "ask · Ask each time" },
  { value: "always", label: "always · Always create" },
  { value: "never", label: "never · Skip" },
];

// Titles, labels, hints and option labels stay English: this file is also loaded by the
// main process before the language is known. SettingsPanel translates them with t().
export const SETTINGS_SECTIONS: { title: string; fields: SettingsField[] }[] = [
  {
    title: "Permissions",
    fields: [
      {
        key: "permissionMode",
        kind: "select",
        label: "Permission mode",
        hint: "Ask confirms sensitive actions first; Auto allows safe actions; Always approve never asks.",
        options: [
          { value: "ask", label: "Ask" },
          { value: "auto", label: "Auto" },
          { value: "always-approve", label: "Always approve" },
        ],
      },
      {
        key: "rememberToolApprovals",
        kind: "toggle",
        label: "Remember approvals",
        hint: "Remember tool approvals so similar actions are not asked again.",
      },
      {
        key: "defaultSelectedPermission",
        kind: "select",
        label: "Default approval choice",
        hint: "The option preselected when an approval prompt appears, such as Always allow.",
        options: [
          { value: "always_allow_all_sessions", label: "Always allow" },
          { value: "allow_command_always", label: "Allow this command" },
          { value: "allow_once", label: "Allow once" },
          { value: "reject", label: "Reject" },
        ],
      },
      {
        key: "askQuestionTimeoutEnabled",
        kind: "toggle",
        label: "Ask-question timeout",
        hint: "[toolset.ask_user_question] timeout_enabled",
      },
      {
        key: "askQuestionTimeoutSecs",
        kind: "number",
        label: "Ask-question timeout (s)",
        hint: "[toolset.ask_user_question] timeout_secs",
        min: 1,
        max: 86400,
      },
      {
        key: "cancelSubagentsOnTurnCancel",
        kind: "select",
        label: "Subagents on turn cancel",
        hint: "[ui] cancel_subagents_on_turn_cancel",
        options: [
          { value: "ask", label: "ask" },
          { value: "always_stop", label: "always_stop" },
          { value: "always_continue", label: "always_continue" },
        ],
      },
    ],
  },
  {
    title: "Models",
    fields: [
      { key: "defaultModel", kind: "text", label: "Default model", hint: "[models] default" },
      {
        key: "defaultEffort",
        kind: "select",
        label: "Default effort",
        hint: "[models] default_reasoning_effort",
        options: [
          { value: "minimal", label: "minimal" },
          { value: "low", label: "low" },
          { value: "medium", label: "medium" },
          { value: "high", label: "high" },
          { value: "xhigh", label: "xhigh" },
        ],
      },
      { key: "webSearchModel", kind: "text", label: "web_search model", hint: "[models] web_search. Leave empty to use the default model." },
      { key: "sessionSummaryModel", kind: "text", label: "Conversation summary model", hint: "[models] session_summary. Leave empty to use the default." },
      { key: "imageDescriptionModel", kind: "text", label: "Image description model", hint: "[models] image_description. Leave empty to use the default." },
      { key: "forkSecondaryModel", kind: "text", label: "Fork secondary model", hint: "[ui] fork_secondary_model. Leave empty to use the default." },
    ],
  },
  {
    title: "Display",
    fields: [
      { key: "showThinkingBlocks", kind: "toggle", label: "Show thinking", hint: "[ui] show_thinking_blocks" },
      { key: "groupToolVerbs", kind: "toggle", label: "Group tool calls", hint: "[ui] group_tool_verbs" },
      { key: "collapsedEditBlocks", kind: "toggle", label: "Collapse edit diffs", hint: "[ui] collapsed_edit_blocks" },
      { key: "pageFlipOnSend", kind: "toggle", label: "Scroll to latest on send", hint: "[ui] page_flip_on_send" },
      { key: "compactMode", kind: "toggle", label: "Compact mode", hint: "[ui] compact_mode" },
      { key: "showTimestamps", kind: "toggle", label: "Show timestamps", hint: "[ui] show_timestamps" },
      { key: "showTimeline", kind: "toggle", label: "Timeline ticks", hint: "[ui] show_timeline. Mainly for the grok TUI." },
      { key: "promptSuggestions", kind: "toggle", label: "Prompt suggestions", hint: "[ui] prompt_suggestions" },
      {
        key: "followUpBehavior",
        kind: "select",
        label: "Follow-up behavior",
        hint: "[ui] follow_up_behavior",
        options: [
          { value: "queue", label: "Queue (send after this turn)" },
          { value: "steer", label: "Steer (insert at next gap)" },
        ],
      },
      { key: "combineQueuedPrompts", kind: "toggle", label: "Combine queued follow-ups", hint: "[ui] combine_queued_prompts" },
      {
        key: "theme",
        kind: "select",
        label: "TUI theme",
        hint: "[ui] theme. Written to config; used by the grok TUI.",
        options: THEME_OPTIONS,
      },
      {
        key: "autoDarkTheme",
        kind: "select",
        label: "Auto dark theme",
        hint: "[ui] auto_dark_theme",
        options: THEME_OPTIONS.filter((row) => row.value !== "auto"),
      },
      {
        key: "autoLightTheme",
        kind: "select",
        label: "Auto light theme",
        hint: "[ui] auto_light_theme",
        options: THEME_OPTIONS.filter((row) => row.value !== "auto"),
      },
      {
        key: "screenMode",
        kind: "select",
        label: "TUI screen mode",
        hint: "[ui] screen_mode. fullscreen / minimal.",
        options: [
          { value: "fullscreen", label: "fullscreen" },
          { value: "minimal", label: "minimal" },
        ],
      },
      { key: "simpleMode", kind: "toggle", label: "Readline input (off = vim input)", hint: "[ui] simple_mode" },
      { key: "vimMode", kind: "toggle", label: "Vim scrollback navigation", hint: "[ui] vim_mode" },
      {
        key: "renderMermaid",
        kind: "select",
        label: "Mermaid diagrams",
        hint: "[ui] render_mermaid",
        options: [
          { value: "auto", label: "auto" },
          { value: "on", label: "on" },
          { value: "off", label: "off" },
        ],
      },
      {
        key: "maxThoughtsWidth",
        kind: "number",
        label: "Max thinking width",
        hint: "[ui] max_thoughts_width",
        min: 40,
        max: 500,
      },
      { key: "voiceKeybindEnabled", kind: "toggle", label: "Voice shortcut", hint: "[ui] voice_keybind_enabled" },
      {
        key: "voiceCaptureMode",
        kind: "select",
        label: "Voice capture",
        hint: "[ui] voice_capture_mode",
        options: [
          { value: "hold", label: "Hold to talk" },
          { value: "toggle", label: "Tap to toggle" },
        ],
      },
      {
        key: "voiceSttLanguage",
        kind: "select",
        label: "Transcription language",
        hint: "[ui] voice_stt_language",
        options: [
          { value: "auto", label: "Auto" },
          { value: "zh", label: "Chinese" },
          { value: "en", label: "English" },
        ],
      },
      {
        key: "hunkTrackerMode",
        kind: "select",
        label: "File change tracking",
        hint: "[ui] hunk_tracker_mode",
        options: [
          { value: "agent_only", label: "agent_only" },
          { value: "all_dirty", label: "all_dirty" },
          { value: "off", label: "off" },
        ],
      },
    ],
  },
  {
    title: "Scrolling",
    fields: [
      {
        key: "scrollSpeed",
        kind: "number",
        label: "Scroll speed",
        hint: "[ui] scroll_speed, 1-100, 50 = 1.0x",
        min: 1,
        max: 100,
      },
      {
        key: "scrollMode",
        kind: "select",
        label: "Scroll input",
        hint: "[ui] scroll_mode",
        options: [
          { value: "auto", label: "auto" },
          { value: "wheel", label: "wheel" },
          { value: "trackpad", label: "trackpad" },
        ],
      },
      {
        key: "scrollLines",
        kind: "number",
        label: "Lines per notch",
        hint: "[ui] scroll_lines. Leave empty to follow the terminal.",
        min: 1,
        max: 10,
        optional: true,
      },
      { key: "invertScroll", kind: "toggle", label: "Invert scrolling", hint: "[ui] invert_scroll" },
    ],
  },
  {
    title: "Features",
    fields: [
      { key: "telemetry", kind: "toggle", label: "Anonymous telemetry", hint: "[features] telemetry" },
      { key: "traceUpload", kind: "toggle", label: "Upload conversation traces", hint: "[telemetry] trace_upload" },
      { key: "feedback", kind: "toggle", label: "Feedback", hint: "[features] feedback" },
      { key: "disableCodebaseUpload", kind: "toggle", label: "Block codebase upload", hint: "[harness] disable_codebase_upload" },
      { key: "lspTools", kind: "toggle", label: "LSP tools", hint: "[features] lsp_tools" },
      { key: "codebaseIndexing", kind: "toggle", label: "Codebase indexing", hint: "[features] codebase_indexing" },
      { key: "twoPassCompaction", kind: "toggle", label: "Two-pass compaction", hint: "[features] two_pass_compaction" },
      { key: "remoteFetch", kind: "toggle", label: "Online model catalog", hint: "[features] remote_fetch" },
      { key: "imageGen", kind: "toggle", label: "Image generation /imagine", hint: "[features] image_gen" },
      { key: "videoGen", kind: "toggle", label: "Video generation /imagine-video", hint: "[features] video_gen" },
      { key: "voiceMode", kind: "toggle", label: "Voice transcription", hint: "[features] voice_mode" },
      { key: "webFetch", kind: "toggle", label: "web_fetch tool", hint: "[features] web_fetch" },
      { key: "writeFile", kind: "toggle", label: "write tool", hint: "[features] write_file" },
      { key: "toolSearch", kind: "toggle", label: "MCP tool discovery", hint: "[features] tool_search" },
      { key: "memoryEnabled", kind: "toggle", label: "Cross-conversation memory", hint: "[memory] enabled" },
      { key: "subagentsEnabled", kind: "toggle", label: "Subagents", hint: "[subagents] enabled" },
      { key: "workflowsEnabled", kind: "toggle", label: "Background workflows", hint: "[workflows] enabled" },
    ],
  },
  {
    title: "Conversation",
    fields: [
      {
        key: "autoCompactPercent",
        kind: "number",
        label: "Auto-compact threshold %",
        hint: "[session] auto_compact_threshold_percent",
        min: 50,
        max: 99,
      },
      { key: "loadEnvrc", kind: "toggle", label: "Load .envrc", hint: "[session] load_envrc" },
    ],
  },
  {
    title: "Tools",
    fields: [
      { key: "respectGitignore", kind: "toggle", label: "Respect gitignore", hint: "[tools] respect_gitignore" },
      {
        key: "bashTimeoutSecs",
        kind: "number",
        label: "bash timeout (s)",
        hint: "[toolset.bash] timeout_secs",
        min: 1,
        max: 3600,
      },
      {
        key: "bashOutputByteLimit",
        kind: "number",
        label: "bash output limit (bytes)",
        hint: "[toolset.bash] output_byte_limit",
        min: 1000,
        max: 2_000_000,
      },
      {
        key: "bashMaxTimeoutSecs",
        kind: "number",
        label: "bash max timeout (s)",
        hint: "[toolset.bash] max_timeout_secs",
        min: 1,
        max: 86400,
      },
      {
        key: "bashAutoBackgroundOnTimeout",
        kind: "toggle",
        label: "Background on timeout",
        hint: "[toolset.bash] auto_background_on_timeout",
      },
      { key: "webFetchAllowLocal", kind: "toggle", label: "web_fetch allows localhost", hint: "[toolset.web_fetch] allow_local" },
      {
        key: "webFetchAllowedDomains",
        kind: "list",
        label: "web_fetch allowed domains",
        hint: "[toolset.web_fetch] allowed_domains. Comma-separated; empty = no limit.",
      },
      {
        key: "webSearchAllowedDomains",
        kind: "list",
        label: "web_search allowed domains",
        hint: "[toolset.web_search] allowed_domains. Exclusive with the blocklist; the allowlist wins.",
      },
      {
        key: "webSearchExcludedDomains",
        kind: "list",
        label: "web_search blocked domains",
        hint: "[toolset.web_search] excluded_domains",
      },
    ],
  },
  {
    title: "Sandbox",
    fields: [
      {
        key: "sandboxProfile",
        kind: "select",
        label: "Sandbox profile",
        hint: "[sandbox] profile",
        options: [
          { value: "off", label: "off" },
          { value: "workspace", label: "workspace" },
          { value: "devbox", label: "devbox" },
          { value: "read-only", label: "read-only" },
          { value: "strict", label: "strict" },
        ],
      },
      { key: "sandboxAutoAllowBash", kind: "toggle", label: "Auto-allow bash in sandbox", hint: "[sandbox] auto_allow_bash" },
    ],
  },
  {
    title: "Worktree",
    fields: [
      {
        key: "newSessionWorktreeMode",
        kind: "select",
        label: "Worktree on /new",
        hint: "[hints] new_session_worktree_mode",
        options: WORKTREE_OPTIONS,
      },
      {
        key: "forkWorktreeMode",
        kind: "select",
        label: "Worktree on /fork",
        hint: "[hints] fork_worktree_mode",
        options: WORKTREE_OPTIONS,
      },
    ],
  },
  {
    title: "Notifications",
    fields: [
      {
        key: "notifyMethod",
        kind: "select",
        label: "Notification method",
        hint: "[ui.notifications] method. This app uses system notifications unless set to none.",
        options: [
          { value: "auto", label: "auto" },
          { value: "osc9", label: "osc9" },
          { value: "osc99", label: "osc99" },
          { value: "osc777", label: "osc777" },
          { value: "bel", label: "bel" },
          { value: "none", label: "none" },
        ],
      },
      {
        key: "notifyCondition",
        kind: "select",
        label: "When to notify",
        hint: "[ui.notifications] condition",
        options: [
          { value: "unfocused", label: "unfocused · When unfocused" },
          { value: "always", label: "always" },
          { value: "never", label: "never" },
        ],
      },
      {
        key: "notifyIdleSecs",
        kind: "number",
        label: "Notify after unfocused (s)",
        hint: "[ui.notifications] idle_threshold_secs",
        min: 0,
        max: 120,
      },
      { key: "notifyTurnComplete", kind: "toggle", label: "Notify on turn complete", hint: "events includes turn_complete" },
      { key: "notifyApproval", kind: "toggle", label: "Notify when approval needed", hint: "events includes approval_required" },
      { key: "notifySleepPrevention", kind: "toggle", label: "Prevent sleep during turns", hint: "[ui.notifications] sleep_prevention" },
      { key: "notifyProgressBar", kind: "toggle", label: "Tab progress bar", hint: "[ui.notifications] progress_bar" },
      { key: "notifyTitleEnabled", kind: "toggle", label: "Status in terminal title", hint: "[ui.notifications.title] enabled" },
    ],
  },
  {
    title: "Compatibility",
    fields: [
      { key: "cursorSkills", kind: "toggle", label: "Scan Cursor skills", hint: "[compat.cursor] skills" },
      { key: "cursorRules", kind: "toggle", label: "Scan Cursor rules", hint: "[compat.cursor] rules" },
      { key: "cursorAgents", kind: "toggle", label: "Scan Cursor agents", hint: "[compat.cursor] agents" },
      { key: "cursorMcps", kind: "toggle", label: "Scan Cursor MCP", hint: "[compat.cursor] mcps" },
      { key: "cursorHooks", kind: "toggle", label: "Scan Cursor hooks", hint: "[compat.cursor] hooks" },
      { key: "claudeSkills", kind: "toggle", label: "Scan Claude skills", hint: "[compat.claude] skills" },
      { key: "claudeRules", kind: "toggle", label: "Scan Claude rules", hint: "[compat.claude] rules" },
      { key: "claudeAgents", kind: "toggle", label: "Scan Claude agents", hint: "[compat.claude] agents" },
      { key: "claudeMcps", kind: "toggle", label: "Scan Claude MCP", hint: "[compat.claude] mcps" },
      { key: "claudeHooks", kind: "toggle", label: "Scan Claude hooks", hint: "[compat.claude] hooks" },
    ],
  },
  {
    title: "CLI",
    fields: [
      { key: "autoUpdate", kind: "toggle", label: "Auto-update grok", hint: "[cli] auto_update" },
      {
        key: "cliChannel",
        kind: "select",
        label: "Update channel",
        hint: "[cli] channel",
        options: [
          { value: "stable", label: "stable" },
          { value: "alpha", label: "alpha" },
        ],
      },
      { key: "showTips", kind: "toggle", label: "Startup tips", hint: "[cli] show_tips" },
    ],
  },
];
