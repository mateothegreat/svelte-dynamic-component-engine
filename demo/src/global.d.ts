import type { Version } from "./lib/version/types";

declare global {
  const __VERSION__: Version | undefined;
}

export {};
