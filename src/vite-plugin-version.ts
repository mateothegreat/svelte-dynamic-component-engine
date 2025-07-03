import type { PluginOption } from "vite";
import { setVersion } from "../demo/src/version/version";

export interface VersionConfig {
  debug?: boolean;
}

/**
 * This plugin is used to set the version of the application.
 *
 * @param {VersionConfig} pluginConfig The plugin configuration.
 *
 * @returns {PluginOption} The plugin option.
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
export const versionPlugin = (pluginConfig: VersionConfig): PluginOption => {
  const versionData = setVersion();
  const versionString = JSON.stringify(versionData);

  return {
    name: "version-plugin",
    config(config, env) {
      if (pluginConfig.debug) {
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

      if (pluginConfig.debug) {
        console.log("versionPlugin.config() config.define:", config.define);
      }

      return config;
    }
  };
};
