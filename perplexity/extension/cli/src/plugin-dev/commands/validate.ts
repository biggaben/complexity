/**
 * Validate command - Validate plugin structure and code
 */

import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";
import { Logger } from "@complexity/cli-logger";

const logger = new Logger({
  name: "plugin-validate",
  printPrefix: false,
});

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  pluginPath: string;
  pluginName: string;
}

interface ValidateOptions {
  all: boolean;
}

export async function validateCommand(
  pluginPath?: string,
  options?: ValidateOptions
): Promise<void> {
  try {
    const results: ValidationResult[] = [];

    if (options?.all) {
      // Validate all plugins
      logger.info("Validating all plugins...");
      const pluginDirs = await findAllPlugins();

      for (const dir of pluginDirs) {
        const result = await validatePlugin(dir);
        results.push(result);
      }
    } else if (pluginPath) {
      // Validate specific plugin
      const result = await validatePlugin(pluginPath);
      results.push(result);
    } else {
      logger.error("Please specify a plugin path or use --all flag");
      process.exit(1);
    }

    // Print results
    let hasErrors = false;
    for (const result of results) {
      logger.info("");
      logger.info(`Plugin: ${result.pluginName}`);
      logger.info(`Path: ${result.pluginPath}`);

      if (result.errors.length > 0) {
        hasErrors = true;
        logger.error("Errors:");
        result.errors.forEach((error) => logger.error(`  - ${error}`));
      }

      if (result.warnings.length > 0) {
        logger.warn("Warnings:");
        result.warnings.forEach((warning) => logger.warn(`  - ${warning}`));
      }

      if (result.valid && result.errors.length === 0) {
        logger.success("✓ Plugin is valid");
      }
    }

    // Summary
    logger.info("");
    logger.info("=".repeat(50));
    logger.info(`Total plugins validated: ${results.length}`);
    logger.info(`Valid: ${results.filter((r) => r.valid).length}`);
    logger.info(`With errors: ${results.filter((r) => r.errors.length > 0).length}`);
    logger.info(`With warnings: ${results.filter((r) => r.warnings.length > 0).length}`);

    if (hasErrors) {
      process.exit(1);
    }
  } catch (error) {
    logger.error("Validation failed:");
    console.error(error);
    process.exit(1);
  }
}

async function findAllPlugins(): Promise<string[]> {
  const pluginsDir = path.join(process.cwd(), "src", "plugins");
  
  if (!fs.existsSync(pluginsDir)) {
    logger.error(`Plugins directory not found: ${pluginsDir}`);
    process.exit(1);
  }

  const entries = fs.readdirSync(pluginsDir, { withFileTypes: true });
  const pluginDirs: string[] = [];

  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.startsWith("__")) {
      const pluginPath = path.join(pluginsDir, entry.name);
      const manifestPath = path.join(pluginPath, "index.manifest.ts");
      
      if (fs.existsSync(manifestPath)) {
        pluginDirs.push(pluginPath);
      }
    }
  }

  return pluginDirs;
}

async function validatePlugin(pluginPath: string): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const pluginName = path.basename(pluginPath);

  // Check if directory exists
  if (!fs.existsSync(pluginPath)) {
    errors.push("Plugin directory does not exist");
    return { valid: false, errors, warnings, pluginPath, pluginName };
  }

  // Check for required files
  const manifestPath = path.join(pluginPath, "index.manifest.ts");
  if (!fs.existsSync(manifestPath)) {
    errors.push("Missing required file: index.manifest.ts");
  } else {
    // Validate manifest structure
    const manifestContent = fs.readFileSync(manifestPath, "utf-8");
    validateManifestContent(manifestContent, errors, warnings);
  }

  // Check for optional but recommended files
  const loaderPath = path.join(pluginPath, "loader.ts");
  if (!fs.existsSync(loaderPath)) {
    warnings.push("No loader.ts file found. Plugin may not have any functionality.");
  }

  // Check for README
  const readmePath = path.join(pluginPath, "README.md");
  if (!fs.existsSync(readmePath)) {
    warnings.push("No README.md file found. Consider adding documentation.");
  }

  // Validate file naming conventions
  const files = fs.readdirSync(pluginPath, { withFileTypes: true });
  for (const file of files) {
    if (file.isFile()) {
      validateFileName(file.name, errors, warnings);
    }
  }

  // Check for TypeScript files
  const tsFiles = await glob(`${pluginPath}/**/*.{ts,tsx}`, {
    ignore: ["**/node_modules/**"],
  });

  if (tsFiles.length === 0) {
    warnings.push("No TypeScript files found");
  }

  const valid = errors.length === 0;
  return { valid, errors, warnings, pluginPath, pluginName };
}

function validateManifestContent(
  content: string,
  errors: string[],
  warnings: string[]
): void {
  // Check for required imports
  if (!content.includes('import { z } from "zod"')) {
    errors.push("Manifest must import zod");
  }

  if (!content.includes('import { definePlugin } from "@/__registries__/plugins/utils"')) {
    errors.push("Manifest must import definePlugin");
  }

  // Check for module augmentation
  if (!content.includes('declare module "@/__registries__/plugins/meta.types"')) {
    errors.push("Manifest must augment PluginsSettingsRegistry");
  }

  // Check for schema definition
  if (!content.includes("const schema = z.object")) {
    errors.push("Manifest must define a schema");
  }

  // Check for enabled field in schema
  if (!content.includes("enabled: z.boolean()")) {
    errors.push("Schema must include 'enabled: z.boolean()' field");
  }

  // Check for definePlugin call
  if (!content.includes("export default definePlugin(")) {
    errors.push("Manifest must export definePlugin call");
  }

  // Check for required metadata fields
  const requiredFields = ["id:", "title:", "description:", "dashboardMeta:"];
  for (const field of requiredFields) {
    if (!content.includes(field)) {
      errors.push(`Manifest missing required field: ${field.replace(":", "")}`);
    }
  }

  // Check for kebab-case in uiRouteSegment
  const routeMatch = content.match(/uiRouteSegment:\s*["']([^"']+)["']/);
  if (routeMatch) {
    const segment = routeMatch[1];
    if (!/^[a-z][a-z0-9-]*$/.test(segment)) {
      warnings.push("uiRouteSegment should be in kebab-case");
    }
  }

  // Check for fallback values
  if (!content.includes("fallback:")) {
    errors.push("Manifest must include fallback values for settings");
  }

  if (!content.includes("enabled: false") && !content.includes("enabled: true")) {
    errors.push("Fallback must include 'enabled' boolean");
  }
}

function validateFileName(
  fileName: string,
  errors: string[],
  warnings: string[]
): void {
  // Check for invalid characters
  if (/[A-Z]/.test(fileName) && !fileName.endsWith(".tsx")) {
    warnings.push(`File name contains uppercase letters: ${fileName}`);
  }

  // Check for spaces
  if (fileName.includes(" ")) {
    errors.push(`File name contains spaces: ${fileName}`);
  }

  // Validate special suffixes
  const specialSuffixes = [
    "manifest.ts",
    "loader.ts",
    "lib-loader.ts",
    "settings-ui.tsx",
    "public.ts",
    "cs-ui.tsx",
    "hash-router.tsx",
    "bg-worker.ts",
  ];

  for (const suffix of specialSuffixes) {
    if (fileName.endsWith(suffix) && !fileName.match(new RegExp(`[\\w-]+\\.${suffix}$`))) {
      warnings.push(`File with special suffix should follow naming convention: ${fileName}`);
    }
  }
}
