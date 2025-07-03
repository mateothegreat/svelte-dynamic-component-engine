import { exec } from "./exec";
import type { Version } from "./types";

export type GitLookup = "tag" | "commit" | "branch" | "dirty" | "date";

export const git = {
  status: () => exec("git status")?.output,
  tag: () => exec("git describe --tags --abbrev=0")?.output,
  fetch: () => exec("git fetch --all -v ")?.output,
  log: () => exec("git log --graph -10 --branches --remotes --tags  --format=format:'%Cgreen%h %Creset• %s (%cN, %cr) %Cred%d' --date-order")?.output,
  date: () => exec("git log -1 --format=%cd")?.output,
  commit: {
    long: () => exec("git rev-parse HEAD")?.output,
    short: () => exec("git rev-parse --short HEAD")?.output
  },
  branch: () => exec("git rev-parse --abbrev-ref HEAD")?.output,
  dirty: () => exec("git diff --quiet")?.status !== 0,
  lookup: (lookups: GitLookup[]): Version => {
    for (const lookup of lookups) {
      switch (lookup) {
        case "tag":
          return {
            location: "git-tag",
            tag: git.tag()
          };
        case "commit":
          return {
            location: "git-commit",
            commit: {
              long: git.commit.long() ?? "unknown",
              short: git.commit.short() ?? "unknown"
            }
          };
        case "branch":
          return {
            location: "git-branch",
            branch: git.branch() ?? "unknown"
          };
        case "dirty":
          return {
            location: "git-dirty",
            dirty: git.dirty()
          };
        case "date":
          return {
            location: "git-date",
            date: {
              actual: new Date(git.date() ?? "unknown"),
              human: git.date() ?? "unknown"
            }
          };

        default:
          throw new Error(`Unknown git lookup: ${lookup}`);
      }
    }
  }
};
