import { zhApp } from "./app";
import { zhCore } from "./core";
import { zhMain } from "./main";
import { zhPanels } from "./panels";
import { zhSettings } from "./settings";

export const zh: Record<string, string> = { ...zhCore, ...zhMain, ...zhSettings, ...zhPanels, ...zhApp };
