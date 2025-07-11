import type { VersionLocation } from "../../../src/vite-plugin-version";

export type Version = {
  location: VersionLocation;
  tag?: string;
  commit?: {
    long: string;
    short: string;
  };
  dirty?: boolean;
  branch?: string;
  date?: {
    actual: Date;
    human: string;
  };
};
