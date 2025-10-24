/**
 * Init command - Scaffold a new plugin
 */

import * as fs from "fs";
import * as path from "path";
import inquirer from "inquirer";
import { Logger } from "@complexity/cli-logger";

const logger = new Logger({
  name: "plugin-init",
  printPrefix: false,
});

interface InitOptions {
  directory: string;
  category: string;
}

function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

function toPascalCase(str: string): string {
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

function toPluginId(name: string, category: string): string {
  const camelName = toCamelCase(name);
  
  if (category && category !== "general") {
    return `${category}:${camelName}`;
  }
  
  return camelName;
}

export async function initCommand(
  pluginName: string,
  options: InitOptions
): Promise<void> {
  try {
    logger.info(`Scaffolding new plugin: ${pluginName}`);

    // Validate plugin name
    if (!/^[a-z][a-z0-9-]*$/.test(pluginName)) {
      logger.error(
        "Plugin name must be in kebab-case (lowercase letters, numbers, and hyphens)"
      );
      process.exit(1);
    }

    // Prompt for additional information
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "title",
        message: "Plugin display name:",
        default: pluginName
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
      },
      {
        type: "input",
        name: "description",
        message: "Plugin description:",
        validate: (input: string) =>
          input.length > 0 || "Description is required",
      },
      {
        type: "list",
        name: "category",
        message: "Plugin category:",
        choices: [
          { name: "Thread", value: "thread" },
          { name: "UI", value: "ui" },
          { name: "General", value: "general" },
          { name: "Home", value: "home" },
          { name: "Comet", value: "comet" },
        ],
        default: options.category,
      },
      {
        type: "checkbox",
        name: "tags",
        message: "Plugin tags (select applicable):",
        choices: [
          { name: "UI Enhancement", value: "ui" },
          { name: "Productivity", value: "productivity" },
          { name: "Customization", value: "customization" },
          { name: "Accessibility", value: "a11y" },
          { name: "Experimental", value: "experimental" },
        ],
      },
      {
        type: "confirm",
        name: "createLoader",
        message: "Create loader file?",
        default: true,
      },
      {
        type: "confirm",
        name: "createSettingsUi",
        message: "Create settings UI?",
        default: true,
      },
    ]);

    const pluginId = toPluginId(pluginName, answers.category);
    const camelCaseName = toCamelCase(pluginName);
    const pascalCaseName = toPascalCase(pluginName);

    // Create plugin directory
    const pluginDir = path.join(process.cwd(), options.directory, pluginName);

    if (fs.existsSync(pluginDir)) {
      logger.error(`Plugin directory already exists: ${pluginDir}`);
      process.exit(1);
    }

    fs.mkdirSync(pluginDir, { recursive: true });

    // Create index.manifest.ts
    const manifestContent = generateManifest(
      pluginId,
      answers.title,
      answers.description,
      answers.category,
      answers.tags,
      pluginName,
      camelCaseName
    );
    fs.writeFileSync(
      path.join(pluginDir, "index.manifest.ts"),
      manifestContent
    );

    // Create loader.ts if requested
    if (answers.createLoader) {
      const loaderContent = generateLoader(camelCaseName);
      fs.writeFileSync(path.join(pluginDir, "loader.ts"), loaderContent);
    }

    // Create settings-ui.tsx if requested
    if (answers.createSettingsUi) {
      const settingsUiContent = generateSettingsUi(camelCaseName, pascalCaseName);
      fs.writeFileSync(
        path.join(pluginDir, "settings-ui.tsx"),
        settingsUiContent
      );
    }

    // Create README.md
    const readmeContent = generateReadme(
      pluginName,
      answers.title,
      answers.description
    );
    fs.writeFileSync(path.join(pluginDir, "README.md"), readmeContent);

    logger.success(`✓ Plugin scaffolded successfully at: ${pluginDir}`);
    logger.info("");
    logger.info("Next steps:");
    logger.info("1. Implement your plugin logic in the loader.ts file");
    if (answers.createSettingsUi) {
      logger.info("2. Customize the settings UI in settings-ui.tsx");
    }
    logger.info("3. Test your plugin: pnpm dev");
    logger.info("4. Validate your plugin: pnpm cplx-plugin validate");
    logger.info("5. Submit a PR when ready!");
  } catch (error) {
    logger.error("Failed to scaffold plugin:");
    console.error(error);
    process.exit(1);
  }
}

function generateManifest(
  pluginId: string,
  title: string,
  description: string,
  category: string,
  tags: string[],
  pluginName: string,
  camelCaseName: string
): string {
  const tagsArray = tags.length > 0 ? tags.map((t) => `"${t}"`).join(", ") : '"ui"';
  const categoriesArray = category !== "general" ? `"${category}"` : '"general"';

  return `import { z } from "zod";

import { definePlugin } from "@/__registries__/plugins/utils";

declare module "@/__registries__/plugins/meta.types" {
  interface PluginsSettingsRegistry {
    "${camelCaseName}": z.infer<typeof schema>;
  }
}

const schema = z.object({
  enabled: z.boolean(),
  // Add your custom settings here
});

export default definePlugin({
  meta: {
    id: "${pluginId}",
    title: "${title}",
    description: "${description}",
    dashboardMeta: {
      tags: [${tagsArray}],
      categories: [${categoriesArray}],
      uiRouteSegment: "${pluginName}",
    },
    // Uncomment and add dependencies if needed
    // dependencies: {
    //   corePlugins: ["spaRouter"],
    //   plugins: [],
    // },
  },
  settingsSchema: {
    schema,
    fallback: {
      enabled: false,
    },
  },
});
`;
}

function generateLoader(camelCaseName: string): string {
  return `/**
 * Plugin loader - Automatically executed when content script runs
 */

import { useExtensionSettingsStore } from "@/plugins/__async-deps__/global-stores/extension-settings.store";

export default async function () {
  // Check if plugin is enabled
  const settings = useExtensionSettingsStore.getState().settings;
  if (!settings?.plugins.${camelCaseName}?.enabled) {
    return;
  }

  console.log("[${camelCaseName}] Plugin loaded");

  // TODO: Implement your plugin logic here
  // Examples:
  // - Observe DOM elements
  // - Add event listeners
  // - Inject UI components
  // - Modify page behavior
}
`;
}

function generateSettingsUi(camelCaseName: string, pascalCaseName: string): string {
  return `/**
 * Settings UI for the plugin
 */

import { Label } from "@/components/ui/label";
import useExtensionSettings from "@/services/infra/extension-api-wrappers/extension-settings/useExtensionSettings";

export default function ${pascalCaseName}Settings() {
  const { settings, update } = useExtensionSettings();
  const pluginSettings = settings?.plugins.${camelCaseName};

  if (!pluginSettings) return null;

  return (
    <div className="x:space-y-4">
      <div className="x:space-y-2">
        <Label>Plugin Settings</Label>
        <p className="x:text-sm x:text-muted-foreground">
          Configure your plugin settings here.
        </p>
      </div>

      {/* Add your custom settings UI here */}
      {/* Example:
      <div className="x:flex x:items-center x:space-x-2">
        <Checkbox
          id="some-option"
          checked={pluginSettings.someOption}
          onCheckedChange={(checked) =>
            update("plugins.${camelCaseName}.someOption", checked)
          }
        />
        <Label htmlFor="some-option">Enable Some Option</Label>
      </div>
      */}
    </div>
  );
}
`;
}

function generateReadme(
  pluginName: string,
  title: string,
  description: string
): string {
  return `# ${title}

${description}

## Features

- TODO: List your plugin features here

## Usage

1. Enable the plugin in the extension settings
2. TODO: Describe how to use your plugin

## Configuration

TODO: Document any configurable options

## Development

This plugin was scaffolded using the Complexity plugin CLI tool.

See [Plugin Development Guide](../../docs/plugin-development-guide.md) for more information.

## License

See [LICENSE](../../../../LICENSE)
`;
}
