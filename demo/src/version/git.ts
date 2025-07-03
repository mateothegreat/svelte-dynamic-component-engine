import { run } from "./run";

export const git = {
  status: () => run("git status")?.output,
  tag: () => run("git describe --tags --abbrev=0")?.output,
  fetch: () => run("git fetch --all -v ")?.output,
  log: () => run("git log --graph -10 --branches --remotes --tags  --format=format:'%Cgreen%h %Creset• %s (%cN, %cr) %Cred%d' --date-order")?.output,
  date: () => run("git log -1 --format=%cd")?.output,
  commit: {
    long: () => run("git rev-parse HEAD")?.output,
    short: () => run("git rev-parse --short HEAD")?.output
  },
  branch: () => run("git rev-parse --abbrev-ref HEAD")?.output,
  dirty: () => run("git diff --quiet")?.status !== 0
};
