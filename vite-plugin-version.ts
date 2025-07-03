import { spawnSync } from "child_process";
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

export const run = (
  command: string
): {
  output: string;
  status: number | null;
} => {
  const result = spawnSync(command, {
    cwd: process.cwd(),
    shell: true
  });
  if (result.status !== 0) {
    return {
      output: result.stderr.toString().trim(),
      status: result.status
    };
  }
  return {
    output: result.stdout.toString().trim(),
    status: result.status
  };
};

export const git = {
  status: () => run("git status").output,
  tag: () => run("git describe --tags --abbrev=0").output,
  fetch: () => run("git fetch --all -v ").output,
  log: () =>
    run(
      "git log --graph -10 --branches --remotes --tags  --format=format:'%Cgreen%h %Creset• %s (%cN, %cr) %Cred%d' --date-order"
    ),
  date: () => run("git log -1 --format=%cd").output,
  commit: {
    long: () => run("git rev-parse HEAD").output,
    short: () => run("git rev-parse --short HEAD").output
  },
  branch: () => run("git rev-parse --abbrev-ref HEAD").output,
  dirty: () => run("git diff --quiet").status !== 0
};

export default (): Plugin => {
  return {
    name: "version-plugin",
    applyToEnvironment(env) {
      env.config.env.VERSION = JSON.stringify({
        date: {
          actual: new Date(git.date()),
          human: ago(new Date(git.date()))
        },
        tag: git.tag(),
        commit: {
          long: git.commit.long(),
          short: git.commit.short()
        },
        dirty: git.dirty(),
        branch: git.branch()
      });
      return true;
    }
  };
};
