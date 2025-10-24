/**
 * List command - List all plugins in the project
 */

import * as fs from "fs";
import * as path from "path";
import { Logger } from "@complexity/cli-logger";

const logger = new Logger({
  name: "plugin-list",
  printPrefix: false,
});

interface PluginInfo {
  name: string;
  path: string;
  hasManifest: boolean;
  hasLoader: boolean;
  hasSettingsUi: boolean;
  hasReadme: boolean;
  files: string[];
}

interface ListOptions {
  json: boolean;
}

export async function listCommand(options: ListOptions): Promise<void> {
  try {
    const plugins = await discoverPlugins();

    if (options.json) {
      console.log(JSON.stringify(plugins, null, 2));
      return;
    }

    // Print in table format
    logger.info("");
    logger.info("Plugins in the project:");
    logger.info("=".repeat(80));

    if (plugins.length === 0) {
      logger.warn("No plugins found");
      return;
    }

    for (const plugin of plugins) {
      logger.info("");
      logger.info(`📦 ${plugin.name}`);
      logger.info(`   Path: ${plugin.path}`);
      logger.info(`   Files: ${plugin.files.length}`);
      logger.info(`   Manifest: ${plugin.hasManifest ? "✓" : "✗"}`);
      logger.info(`   Loader: ${plugin.hasLoader ? "✓" : "✗"}`);
      logger.info(`   Settings UI: ${plugin.hasSettingsUi ? "✓" : "✗"}`);
      logger.info(`   README: ${plugin.hasReadme ? "✓" : "✗"}`);
    }

    logger.info("");
    logger.info("=".repeat(80));
    logger.info(`Total plugins: ${plugins.length}`);

    // Statistics
    const stats = {
      withManifest: plugins.filter((p) => p.hasManifest).length,
      withLoader: plugins.filter((p) => p.hasLoader).length,
      withSettingsUi: plugins.filter((p) => p.hasSettingsUi).length,
      withReadme: plugins.filter((p) => p.hasReadme).length,
    };

    logger.info(`With manifest: ${stats.withManifest}`);
    logger.info(`With loader: ${stats.withLoader}`);
    logger.info(`With settings UI: ${stats.withSettingsUi}`);
    logger.info(`With README: ${stats.withReadme}`);
  } catch (error) {
    logger.error("Failed to list plugins:");
    console.error(error);
    process.exit(1);
  }
}

async function discoverPlugins(): Promise<PluginInfo[]> {
  const pluginsDir = path.join(process.cwd(), "src", "plugins");

  if (!fs.existsSync(pluginsDir)) {
    logger.error(`Plugins directory not found: ${pluginsDir}`);
    return [];
  }

  const entries = fs.readdirSync(pluginsDir, { withFileTypes: true });
  const plugins: PluginInfo[] = [];

  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.startsWith("__")) {
      const pluginPath = path.join(pluginsDir, entry.name);
      const pluginInfo = analyzePlugin(pluginPath, entry.name);
      
      if (pluginInfo.hasManifest) {
        plugins.push(pluginInfo);
      }
    }
  }

  // Sort by name
  plugins.sort((a, b) => a.name.localeCompare(b.name));

  return plugins;
}

function analyzePlugin(pluginPath: string, name: string): PluginInfo {
  const files = listFilesRecursively(pluginPath);

  return {
    name,
    path: pluginPath,
    hasManifest: files.some((f) => f.endsWith("index.manifest.ts")),
    hasLoader: files.some(
      (f) => f.endsWith("loader.ts") || f.endsWith("loader.tsx")
    ),
    hasSettingsUi: files.some(
      (f) => f.endsWith("settings-ui.tsx") || f.includes("settings-ui/index.tsx")
    ),
    hasReadme: files.some((f) => f.toLowerCase().endsWith("readme.md")),
    files,
  };
}

function listFilesRecursively(dir: string, baseDir: string = dir): string[] {
  const files: string[] = [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules and hidden directories
      if (entry.name === "node_modules" || entry.name.startsWith(".")) {
        continue;
      }
      files.push(...listFilesRecursively(fullPath, baseDir));
    } else {
      // Store relative path from plugin directory
      const relativePath = path.relative(baseDir, fullPath);
      files.push(relativePath);
    }
  }

  return files;
}
