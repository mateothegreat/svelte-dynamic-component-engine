import { execSync, spawnSync } from "child_process";
import type { Plugin } from "vite";

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

export default function versionPlugin(): Plugin {
  return {
    name: "version-plugin",
    applyToEnvironment(env) {
      env.config.env.VERSION = JSON.stringify({
        date: {
          actual: new Date(execSync("git log -1 --format=%cd").toString()),
          human: ago(new Date(execSync("git log -1 --format=%cd").toString()))
        },
        tag: execSync("git describe --tags --abbrev=0").toString().trim(),
        commit: {
          long: execSync("git rev-parse HEAD").toString().trim(),
          short: execSync("git rev-parse --short HEAD").toString().trim()
        },
        dirty: spawnSync("git diff --quiet").status !== 0,
        branch: execSync("git rev-parse --abbrev-ref HEAD").toString().trim()
      });
      return true;
    }
  };
}
