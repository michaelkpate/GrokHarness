// Imported first in main.tsx: sets the UI language before any other module runs,
// so module-level labels are created in the right language. A language change
// saves the preference and reloads the window.
import { setLanguage } from "../shared/i18n";

const language = window.grok?.i18n?.language === "zh" ? "zh" : "en";
setLanguage(language);
document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
