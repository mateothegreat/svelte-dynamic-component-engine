/// <reference types="svelte" />
/// <reference types="vite/client" />
interface ViteTypeOptions {
  // By adding this line, you can make the type of ImportMetaEnv strict
  // to disallow unknown keys.
  // strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
  readonly CURRENT_VERSION: Version;
}
declare module "virtual:version" {
  export interface Version {
    date: {
      actual: Date;
      human: string;
    };
    tag: string;
    commit: {
      long: string;
      short: string;
    };
    dirty: boolean;
    branch: string;
  }

  const version: Version;
  export default version;
  export const tag: string;
  export const commit: Version["commit"];
  export const dirty: boolean;
  export const branch: string;
  export const date: Version["date"];
}
