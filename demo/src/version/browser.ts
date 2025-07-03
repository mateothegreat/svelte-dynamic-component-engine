import type { VersionConfig } from "../../../src/vite-plugin-version";
import type { Version } from "./types";

// Declare the global constant that will be replaced at build time
declare const __VERSION__: Version | undefined;

export const getVersion = (config?: VersionConfig): Version => {
  if (config?.debug) {
    console.log("getVersion()", "checking available version sources");
  }

  // Try build-time constant first (production builds)
  if (typeof __VERSION__ !== "undefined") {
    if (config?.debug) {
      console.log("getVersion()", "Found __VERSION__ from build-time replacement:", __VERSION__);
    }
    return __VERSION__;
  }

  // Try import.meta.env (available in dev and production)
  if (import.meta.env.VITE_VERSION) {
    try {
      const parsed = JSON.parse(import.meta.env.VITE_VERSION as string);
      if (config?.debug) {
        console.log("getVersion()", "Found VITE_VERSION from import.meta.env:", parsed);
      }
      return parsed;
    } catch (e) {
      console.error("getVersion()", "Failed to parse VITE_VERSION:", e);
    }
  }

  // Fallback
  if (config?.debug) {
    console.error("getVersion()", "no version information available");
  }
  return {
    tag: "unknown",
    commit: {
      long: "unknown",
      short: "unknown"
    },
    dirty: true,
    branch: "unknown",
    date: {
      actual: new Date(1970, 1, 1),
      human: "unknown"
    }
  };
};
