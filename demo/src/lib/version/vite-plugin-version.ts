import { setVersion } from "./version";

export type VersionLocation = "git-tag" | "git-commit" | "git-branch" | "git-dirty" | "git-date" | "package.json";

export interface VersionConfig {
  debug?: boolean;
  /**
   * The locations to check for version information.
   *
   * The order is important, the first location that is found will be used
   * otherwise the next (fallback) location will be used.
   *
   * @default ["git-tag", "package.json"]
   */
  locations?: VersionLocation[];
}

/**
 * This plugin is used to set the version of the application.
 *
 * @param {VersionConfig} pluginConfig The plugin configuration.
 *
 * @returns {any} The plugin option.
 *
 * @example
 * ```ts
 * import { versionPlugin } from "vite-plugin-version";
 *
 * export default defineConfig({
 *   plugins: [versionPlugin()]
 * });
 * ```
 */
export const versionPlugin = (pluginConfig?: VersionConfig): any => {
  const versionData = setVersion(pluginConfig);
  const versionString = JSON.stringify(versionData);

  return {
    name: "version-plugin",
    config(config: any) {
      if (pluginConfig?.debug) {
        console.log("versionPlugin.config() versionData:", versionData);
      }

      // Merge with existing define config:
      config.define = {
        ...config.define,
        // This will replace __VERSION__ in the code at build time:
        __VERSION__: versionString
      };

      // For import.meta.env.VITE_VERSION access:
      process.env.VITE_VERSION = versionString;

      if (pluginConfig?.debug) {
        console.log("versionPlugin.config() config.define:", config.define);
      }

      return config;
    }
  };
};
