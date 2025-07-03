import type { Version } from "./version/types";

declare global {
  const __VERSION__: Version | undefined;
}

export {};
