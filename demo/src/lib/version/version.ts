import fs from "node:fs";
import { git } from "./git";
import type { Version } from "./types";
import type { VersionConfig } from "./vite-plugin-version";

export const ago = (date: Date, locale = "en"): string => {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  const now = new Date();
  const diff = (date.getTime() - now.getTime()) / 1000;

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", diff / (60 * 60 * 24 * 365)],
    ["month", diff / (60 * 60 * 24 * 30)],
    ["week", diff / (60 * 60 * 24 * 7)],
    ["day", diff / (60 * 60 * 24)],
    ["hour", diff / (60 * 60)],
    ["minute", diff / 60],
    ["second", diff]
  ];

  for (const [unit, value] of units) {
    const rounded = Math.round(value);
    if (Math.abs(rounded) >= 1) {
      return rtf.format(rounded, unit);
    }
  }

  return rtf.format(0, "second");
};

export const setVersion = (config?: VersionConfig): Version => {
  for (const location of config?.locations ?? ["git-tag", "package.json"]) {
    if (location === "git-tag") {
      return {
        location: "git-tag",
        tag: git.tag()
      };
    } else if (location === "package.json") {
      const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
      return {
        location: "package.json",
        tag: pkg.version
      };
    }
  }
};
