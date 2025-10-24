# Plugin Development Guide

## Overview

This guide explains how to develop external plugins for the Complexity extension through the PR workflow. External plugins are community-contributed features that extend the extension's functionality while maintaining the same quality and security standards as built-in plugins.

## Prerequisites

- Node.js v22.12.0 or higher
- pnpm v10.17.1
- Git
- TypeScript knowledge
- React knowledge (for UI components)
- Understanding of browser extension APIs

## Getting Started

### 1. Fork and Clone the Repository

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/complexity.git
cd complexity

# Add upstream remote
git remote add upstream https://github.com/biggaben/complexity.git

# Install dependencies
pnpm install
```

### 2. Set Up Development Environment

```bash
# Create a development .env file
cd perplexity/extension
cp .env.example .env  # If .env.example exists

# Build packages
cd ../..
pnpm build

# Start development mode
cd perplexity/extension
pnpm dev
```

Load the extension in Chrome:
1. Navigate to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `perplexity/extension/dist/chrome` directory

## Creating a New Plugin

### Step 1: Create Plugin Directory

```bash
cd perplexity/extension/src/plugins
mkdir my-awesome-plugin
cd my-awesome-plugin
```

### Step 2: Create Plugin Manifest

Create `index.manifest.ts`:

```typescript
import { z } from "zod";
import { definePlugin } from "@/__registries__/plugins/utils";

// Augment the global plugin settings registry
declare module "@/__registries__/plugins/meta.types" {
  interface PluginsSettingsRegistry {
    "myAwesomePlugin": z.infer<typeof schema>;
  }
}

// Define your plugin's settings schema
const schema = z.object({
  enabled: z.boolean(),
  // Add more settings as needed
  customOption: z.string().optional(),
});

// Export plugin manifest
export default definePlugin({
  meta: {
    // Unique ID for your plugin (use descriptive naming)
    id: "myAwesomePlugin",
    
    // Display name shown in settings
    title: "My Awesome Plugin",
    
    // Brief description of what the plugin does
    description: "Does something awesome",
    
    // Dashboard metadata for categorization and routing
    dashboardMeta: {
      // Tags help users discover your plugin
      tags: ["ui", "productivity"],
      
      // Categories organize plugins in the dashboard
      categories: ["thread", "general"],
      
      // URL segment for plugin settings page
      uiRouteSegment: "my-awesome-plugin",
    },
    
    // Optional: Declare dependencies
    dependencies: {
      // Core plugins your plugin depends on
      corePlugins: ["spaRouter"],
      
      // Other plugins your plugin depends on
      // plugins: ["someOtherPlugin"],
    },
  },
  
  // Settings schema and default values
  settingsSchema: {
    schema,
    fallback: {
      enabled: false,
      customOption: "default value",
    },
  },
});
```

### Step 3: Create Plugin Loader

Create `loader.ts`:

```typescript
/**
 * Loader files are automatically executed when the content script runs.
 * This is the entry point for your plugin's functionality.
 */

import { useExtensionSettingsStore } from "@/plugins/__async-deps__/global-stores/extension-settings.store";

export default async function () {
  // Check if plugin is enabled
  const settings = useExtensionSettingsStore.getState().settings;
  if (!settings?.plugins.myAwesomePlugin?.enabled) {
    return;
  }

  // Initialize your plugin here
  console.log("My Awesome Plugin loaded!");
  
  // Example: Wait for DOM elements
  // Example: Add event listeners
  // Example: Inject UI components
}
```

### Step 4: Create Settings UI (Optional)

Create `settings-ui.tsx`:

```typescript
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useExtensionSettings from "@/services/infra/extension-api-wrappers/extension-settings/useExtensionSettings";

export default function MyAwesomePluginSettings() {
  const { settings, update } = useExtensionSettings();
  const pluginSettings = settings?.plugins.myAwesomePlugin;

  if (!pluginSettings) return null;

  return (
    <div className="x:space-y-4">
      <div className="x:space-y-2">
        <Label htmlFor="custom-option">Custom Option</Label>
        <Input
          id="custom-option"
          value={pluginSettings.customOption || ""}
          onChange={(e) =>
            update("plugins.myAwesomePlugin.customOption", e.target.value)
          }
        />
      </div>
      
      <div className="x:flex x:items-center x:space-x-2">
        <Checkbox
          id="some-feature"
          checked={pluginSettings.someFeature}
          onCheckedChange={(checked) =>
            update("plugins.myAwesomePlugin.someFeature", checked)
          }
        />
        <Label htmlFor="some-feature">Enable Some Feature</Label>
      </div>
    </div>
  );
}
```

## Plugin Structure Reference

```
src/plugins/my-awesome-plugin/
├── index.manifest.ts    # Required: Plugin registration and metadata
├── loader.ts            # Optional: Initialization code
├── settings-ui.tsx      # Optional: Settings UI component
├── components/          # Optional: UI components
│   └── MyComponent.tsx
├── hooks/              # Optional: React hooks
│   └── useMyHook.ts
├── utils.ts            # Optional: Utility functions
├── types.ts            # Optional: Type definitions
├── store.ts            # Optional: State management (Zustand)
└── index.public.ts     # Optional: Public API exports
```

## File Naming Conventions

The extension uses special file suffixes for automatic discovery:

- `*.manifest.ts` - Plugin manifest (required)
- `*.loader.ts` - Auto-executed loaders
- `*.lib-loader.ts` - Library loaders (run before regular loaders)
- `settings-ui.tsx` or `settings-ui/index.tsx` - Settings UI
- `*.public.ts` - Public API exports
- `*.cs-ui.tsx` - Content script UI components
- `*.hash-router.tsx` - Hash router components

## Best Practices

### 1. Plugin ID Naming

Use descriptive, namespaced IDs:
- ✅ `"thread:enhancedCopy"` - Good: Clear namespace and purpose
- ✅ `"ui:customTheme"` - Good: Indicates what it affects
- ❌ `"plugin1"` - Bad: Not descriptive
- ❌ `"myPlugin"` - Bad: Too generic

### 2. Settings Schema

Always include an `enabled` boolean:

```typescript
const schema = z.object({
  enabled: z.boolean(),
  // Other settings...
});
```

### 3. Check if Plugin is Enabled

Always check if the plugin is enabled before executing:

```typescript
export default async function () {
  const settings = useExtensionSettingsStore.getState().settings;
  if (!settings?.plugins.myAwesomePlugin?.enabled) {
    return;
  }
  
  // Plugin logic here
}
```

### 4. Clean Up Side Effects

If your plugin adds event listeners, DOM elements, or observers, clean them up when the plugin is disabled:

```typescript
let cleanup: (() => void) | null = null;

export default async function () {
  const settings = useExtensionSettingsStore.getState().settings;
  
  if (!settings?.plugins.myAwesomePlugin?.enabled) {
    cleanup?.();
    cleanup = null;
    return;
  }
  
  // Set up plugin
  const element = document.createElement('div');
  document.body.appendChild(element);
  
  cleanup = () => {
    element.remove();
  };
}
```

### 5. Use Existing Core Plugins

Leverage core plugins instead of reimplementing functionality:

```typescript
export default definePlugin({
  meta: {
    id: "myPlugin",
    // ... other fields
    dependencies: {
      corePlugins: [
        "spaRouter",              // For page navigation detection
        "domObservers:thread:*",  // For thread DOM observation
        "networkInterceptor",     // For network request interception
      ],
    },
  },
});
```

### 6. Follow Dependency Boundaries

Import rules are enforced by ESLint:
- Plugins can import from: `@/plugins/__core__`, `@/components`, `@/hooks`, `@/utils`, `@/services`, `@/types`
- Plugins cannot import from: Other plugins (except via `*.public.ts` exports), `@/entrypoints`

## Testing Your Plugin

### Development Testing

```bash
# Start development server with HMR
pnpm dev

# The extension will automatically reload in the browser when you save changes
```

### Unit Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:ui
```

### E2E Testing

```bash
# Run E2E tests
pnpm e2e

# Run E2E tests with UI
pnpm e2e:ui
```

## Submitting Your Plugin

### Pre-Submission Checklist

Before submitting a PR, ensure:

- [ ] Plugin follows directory structure conventions
- [ ] Plugin manifest is properly configured
- [ ] Settings schema includes `enabled` boolean
- [ ] Plugin checks if it's enabled before executing
- [ ] All side effects are cleaned up when disabled
- [ ] No ESLint errors or warnings
- [ ] No TypeScript errors
- [ ] Plugin has been tested manually
- [ ] Code follows project's formatting standards
- [ ] Documentation is updated (if adding new concepts)

### Validation

Run these commands before submitting:

```bash
# Type checking
pnpm check-types

# Linting
pnpm lint

# Formatting
pnpm fmt

# Build
pnpm build

# Tests
pnpm test
```

### Creating a Pull Request

1. Create a feature branch:
```bash
git checkout -b plugin/my-awesome-plugin
```

2. Commit your changes:
```bash
git add .
git commit -m "feat: add My Awesome Plugin"
```

3. Push to your fork:
```bash
git push origin plugin/my-awesome-plugin
```

4. Open a PR on GitHub with:
   - Clear description of what the plugin does
   - Screenshots/GIFs demonstrating functionality
   - Any breaking changes or dependencies
   - Testing instructions

### PR Review Process

1. **Automated Checks**: CI/CD will run linting, type checking, tests
2. **Code Review**: Maintainers will review code quality, security, performance
3. **Testing**: Maintainers will test functionality manually
4. **Approval**: Once approved, PR will be merged
5. **Release**: Plugin will be included in next extension release

## Common Patterns

### Observing DOM Changes

```typescript
import { whenElementAvailable } from "@/utils/dom/when-element-available";

export default async function () {
  await whenElementAvailable(".some-selector", (element) => {
    // Element is now available
    console.log("Found element:", element);
  });
}
```

### Adding UI Components

```typescript
import { createRoot } from "react-dom/client";
import MyComponent from "./components/MyComponent";

export default async function () {
  const container = document.createElement("div");
  container.id = "my-plugin-container";
  document.body.appendChild(container);
  
  const root = createRoot(container);
  root.render(<MyComponent />);
}
```

### Using Extension Storage

```typescript
import useExtensionSettings from "@/services/infra/extension-api-wrappers/extension-settings/useExtensionSettings";

// In a React component
function MyComponent() {
  const { settings, update } = useExtensionSettings();
  
  return (
    <button onClick={() => update("plugins.myPlugin.enabled", !settings.plugins.myPlugin.enabled)}>
      Toggle Plugin
    </button>
  );
}
```

### Using IndexedDB

```typescript
// In your manifest
export default definePlugin({
  // ... other fields
  indexedDb: {
    versions: [
      {
        version: 8,  // Use next available version
        tableName: "myPlugin:data",
        schema: "&id, timestamp",
      },
    ],
    schema: z.object({
      id: z.string(),
      timestamp: z.number(),
      data: z.any(),
    }),
  },
});

// Usage in your code
import { db } from "@/services/infra/indexed-db";

async function saveData(data: any) {
  await db["myPlugin:data"].add({
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    data,
  });
}
```

## Getting Help

- **Documentation**: Read existing plugin code for examples
- **Discord**: Join the [Complexity Discord](https://discord.cplx.app) for help
- **GitHub Issues**: Open an issue for bugs or feature requests
- **PR Comments**: Ask questions in your PR if stuck

## Resources

- [Architecture Documentation](./architecture.md)
- [Build Your Own Plugin](./build-your-own-plugin.md)
- [Tech Stack](./tech-stack.md)
- [DX Guide](./dx.md)
- [Example Plugins](../src/plugins/)

## License

All contributed plugins must be compatible with the project's license. See [LICENSE](../../LICENSE) for details.
