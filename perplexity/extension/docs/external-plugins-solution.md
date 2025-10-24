# External Plugin System: Design Document

## Executive Summary

This document analyzes potential solutions for adding external plugin support to the Complexity extension, allowing users to import and use third-party plugins in addition to the built-in ones.

## Current Architecture Analysis

### Plugin Discovery & Registration
- **Auto-discovery**: Vite's `import.meta.glob` scans `src/plugins/**/index.manifest.ts` at build time
- **Static bundling**: All plugins are bundled into the extension at build time
- **Type safety**: TypeScript provides compile-time type checking through module augmentation
- **Dependencies**: Plugins can declare dependencies on other plugins and core features

### Key Components
1. **PluginManifestsRegistry** (`src/__registries__/plugins/index.ts`): Central registry that discovers and registers all plugins at module load time
2. **Plugin Manifest** (`index.manifest.ts`): Each plugin defines metadata, settings schema, dependencies, IndexedDB schema
3. **Loaders** (`*.loader.ts`): Auto-executed code when plugin is active
4. **Settings UI** (`settings-ui.tsx`): Optional UI for plugin configuration
5. **Public Exports** (`*.public.ts`): APIs exposed to other plugins

### Constraints & Requirements
- **Browser Extension Sandboxing**: Code cannot be dynamically executed from arbitrary sources due to CSP (Content Security Policy)
- **Type Safety**: TypeScript module augmentation provides type safety across plugins
- **Dependency Management**: Plugins can depend on other plugins and core features
- **Hot Module Replacement**: Development workflow relies on Vite's HMR
- **Extension Store Compliance**: Must comply with Chrome Web Store and Firefox Add-ons policies

---

## Solution 1: Build-Time External Plugin Bundler

### Overview
Create a CLI tool that allows developers to package their external plugins and users to install them into a custom plugins directory, which gets bundled at build time.

### Implementation Details

**Plugin Development Flow:**
1. Developer creates plugin following the standard structure
2. Developer uses CLI tool to package plugin as a npm package or zip file
3. Package includes manifest, source code, and dependencies

**User Installation Flow:**
1. User downloads external plugin package
2. User places package in `src/plugins-external/` directory
3. User runs custom build command that:
   - Validates external plugin structure
   - Checks dependencies compatibility
   - Bundles external plugins with built-in ones
   - Generates type definitions
4. User loads the custom-built extension into browser

**Technical Changes Required:**
```typescript
// Modified plugin discovery in src/__registries__/plugins/index.ts
const builtInPlugins = import.meta.glob("@/plugins/**/index.manifest.ts", {
  eager: true,
});

const externalPlugins = import.meta.glob("@/plugins-external/**/index.manifest.ts", {
  eager: true,
});

const allPlugins = { ...builtInPlugins, ...externalPlugins };
```

**CLI Tool Features:**
- `cplx-plugin init`: Scaffold new plugin
- `cplx-plugin validate`: Validate plugin structure
- `cplx-plugin package`: Package plugin for distribution
- `cplx-plugin install <package>`: Install external plugin
- `cplx-plugin build`: Build extension with external plugins

### Pros
✅ **Full feature parity**: External plugins have same capabilities as built-in plugins
✅ **Type safety preserved**: TypeScript checking works normally
✅ **No CSP issues**: All code is bundled at build time
✅ **Store compliance**: Meets extension store requirements as each build is a unique extension
✅ **Dependency resolution**: Full npm ecosystem available
✅ **Performance**: No runtime overhead
✅ **Security**: Code is vetted at build time

### Cons
❌ **Requires rebuild**: Users must rebuild extension after installing plugins
❌ **Complex installation**: Multi-step process not suitable for non-technical users
❌ **Update friction**: Each plugin update requires extension rebuild
❌ **Distribution**: Users would load unpacked extensions (Developer Mode required)
❌ **No dynamic updates**: Cannot add/remove plugins without rebuilding
❌ **Store distribution blocked**: Cannot distribute to Chrome/Firefox stores with this approach

---

## Solution 2: Dynamic Module Loading with Static Manifest

### Overview
Allow runtime loading of pre-approved external plugins through a plugin marketplace/registry, with static manifest validation.

### Implementation Details

**Architecture:**
1. Create a curated plugin registry (hosted service)
2. External plugins are reviewed, approved, and hosted on the registry
3. Users browse and install plugins from within the extension UI
4. Plugins are downloaded and stored in extension storage
5. Plugins are loaded at runtime using dynamic imports or eval (in isolated contexts)

**Technical Approach:**
```typescript
// Plugin loader service
class ExternalPluginLoader {
  async loadPlugin(pluginId: string) {
    // Download plugin bundle from registry
    const pluginCode = await this.registry.download(pluginId);
    
    // Validate signature/hash
    if (!this.validatePlugin(pluginCode)) {
      throw new Error('Plugin validation failed');
    }
    
    // Load in isolated context
    const plugin = await this.executeInSandbox(pluginCode);
    
    // Register with plugin system
    PluginManifestsRegistry.registerExternal(plugin);
  }
}
```

**Registry Features:**
- Plugin submission and review process
- Version management
- Dependency resolution
- Security scanning
- Usage analytics

### Pros
✅ **User-friendly**: Install plugins without rebuilding
✅ **Dynamic updates**: Plugins can be updated independently
✅ **Marketplace potential**: Could monetize premium plugins
✅ **Centralized distribution**: Single source of truth for plugins
✅ **Quality control**: Review process ensures quality

### Cons
❌ **CSP violations**: Chrome/Firefox block dynamic code execution
❌ **Store policy violations**: Against Chrome Web Store and Firefox Add-ons policies
❌ **Security risks**: Running untrusted code in extension context is dangerous
❌ **Type safety lost**: No compile-time type checking for dynamic plugins
❌ **Complex sandboxing**: Difficult to properly isolate plugin code
❌ **Maintenance burden**: Requires maintaining plugin registry infrastructure
❌ **Limited API surface**: Would need to expose limited, safe API to external plugins

---

## Solution 3: Companion Native Application

### Overview
Use a companion native application to manage external plugins, which communicates with the browser extension via Native Messaging API.

### Implementation Details

**Architecture:**
1. User installs a companion native application (electron app or native binary)
2. Native app manages external plugins (installation, updates, validation)
3. Native app communicates with extension via Native Messaging
4. Extension receives plugin logic from native app as structured data/commands

**Communication Flow:**
```typescript
// Extension side
const port = chrome.runtime.connectNative('com.complexity.plugin_manager');

port.onMessage.addListener((msg) => {
  if (msg.type === 'PLUGIN_ACTION') {
    // Execute plugin logic based on structured commands
    this.executePluginAction(msg.payload);
  }
});

// Native app side
// Manages plugin installation, validation, code execution
// Sends structured commands to extension
```

### Pros
✅ **No CSP restrictions**: Native app can execute arbitrary code
✅ **Store compliant**: Extension doesn't execute dynamic code
✅ **Powerful**: Native app has full system access
✅ **Sandboxing**: Can run plugins in separate processes

### Cons
❌ **Complex setup**: Users must install separate application
❌ **Platform-specific**: Need separate builds for Windows/Mac/Linux
❌ **Maintenance burden**: Two applications to maintain
❌ **Limited API**: Communication overhead limits plugin capabilities
❌ **User friction**: Additional installation step reduces adoption
❌ **Performance**: IPC overhead for every plugin action
❌ **Security concerns**: Native app has system-level access

---

## Solution 4: Plugin Template Fork + Pull Request Workflow

### Overview
Provide a plugin template repository that developers fork, develop their plugin, and submit via pull request to be included in the main extension.

### Implementation Details

**Developer Flow:**
1. Developer forks plugin template repository
2. Developer creates plugin following guidelines
3. Developer submits PR to main repository
4. Maintainers review and merge
5. Plugin included in next extension release

**Automated Tools:**
```bash
# Plugin template repository structure
complexity-plugin-template/
├── src/
│   └── plugins/
│       └── my-plugin/
│           ├── index.manifest.ts
│           ├── loader.ts
│           └── settings-ui.tsx
├── tests/
├── package.json
└── README.md

# Automated checks in CI/CD
- Lint plugin code
- Run security scans
- Validate manifest structure
- Check for dependency conflicts
- Run integration tests
```

**Integration Helper:**
- CLI tool to validate plugin before PR
- Automated PR template with checklist
- Integration tests run on PR
- Documentation generator

### Pros
✅ **Fully integrated**: Plugins work exactly like built-in plugins
✅ **No CSP issues**: All code is part of the extension
✅ **Type safety**: Full TypeScript support
✅ **Store compliant**: Meets all extension store requirements
✅ **Quality control**: Review process ensures quality and security
✅ **Simple for users**: Just update extension normally
✅ **No infrastructure**: No need for plugin registry or native app
✅ **Community building**: Encourages open-source contributions

### Cons
❌ **Slow distribution**: Plugin needs to wait for extension release
❌ **Centralized control**: All plugins must be approved by maintainers
❌ **Review bottleneck**: Maintainers must review all plugins
❌ **Limited customization**: Users can't create private plugins easily
❌ **Versioning complexity**: Plugin updates tied to extension releases

---

## Solution 5: Hybrid Approach - Plugin SDK + Extension Variants

### Overview
Create a Plugin SDK that allows developers to build extensions that extend Complexity, with pre-built variants available for download.

### Implementation Details

**Architecture:**
1. Complexity core is published as an npm package/library
2. External plugins are separate browser extensions
3. Extensions communicate via browser APIs (chrome.runtime.sendMessage to specific extension ID)
4. Official "Complexity + Plugin X" variants are pre-built and distributed

**Plugin Development:**
```typescript
// External plugin extension
import { ComplexitySDK } from '@complexity/plugin-sdk';

const plugin = ComplexitySDK.createPlugin({
  name: 'My Plugin',
  version: '1.0.0',
  
  onComplexityReady(api) {
    // Use exposed APIs
    api.observeThread((thread) => {
      // Enhance thread UI
    });
  }
});
```

**Communication:**
```typescript
// Core extension exposes API via message passing
chrome.runtime.onMessageExternal.addListener((msg, sender, sendResponse) => {
  if (sender.id === TRUSTED_PLUGIN_IDS.includes(sender.id)) {
    // Handle plugin request
    handlePluginMessage(msg, sendResponse);
  }
});
```

### Pros
✅ **Independent updates**: Plugins update separately from main extension
✅ **User choice**: Users can install only plugins they want
✅ **Store compliant**: Each extension is reviewed separately
✅ **Sandbox isolation**: Plugins run in separate extension contexts
✅ **No rebuild needed**: Users install pre-built extensions

### Cons
❌ **Multiple extensions**: Users must install multiple extensions
❌ **Communication overhead**: Limited by message passing APIs
❌ **Limited API surface**: Can only expose safe, public APIs
❌ **Coordination complexity**: Version compatibility between extensions
❌ **Discovery friction**: Users must find and install each plugin separately
❌ **Permission management**: Each plugin requests separate permissions

---

## Recommendation

### Best Solution: **Solution 4 - Plugin Template Fork + Pull Request Workflow**

After careful analysis, Solution 4 is the **optimal approach** for this project because:

1. **Maintains Current Quality Bar**: The extension already has high quality standards. A review process ensures external plugins meet the same bar.

2. **Zero Security Risk**: All code is reviewed before inclusion, eliminating security concerns from untrusted code.

3. **Store Compliance**: Fully compliant with Chrome Web Store and Firefox Add-ons policies.

4. **Best User Experience**: Users simply update their extension like normal - no complex installation procedures.

5. **Sustainable Maintenance**: Review burden is manageable and encourages community engagement.

6. **Aligns with Project Values**: The project emphasizes quality and polish over rapid feature addition.

### Implementation Roadmap

**Phase 1: Infrastructure (Week 1-2)**
- Create plugin template repository
- Document plugin development guidelines
- Set up automated validation tools
- Create PR template with checklist

**Phase 2: Developer Tools (Week 3-4)**
- CLI tool for plugin scaffolding (`cplx-plugin init`)
- CLI tool for validation (`cplx-plugin validate`)
- Integration test framework
- Documentation generator

**Phase 3: Community (Week 5-6)**
- Create plugin showcase page
- Contributor guidelines
- Code of conduct for plugin submissions
- Example plugins demonstrating common patterns

**Phase 4: Automation (Week 7-8)**
- Automated CI/CD checks for plugin PRs
- Automated security scanning
- Automated documentation generation
- Release process for plugin inclusion

### Alternative Recommendation for Power Users

For users who want to develop private plugins not intended for public distribution, **Solution 1 (Build-Time External Plugin Bundler)** can be offered as a "developer mode" option with clear warnings about:
- Not being eligible for store distribution
- Requiring Developer Mode in browser
- Being unsupported by maintainers
- Security implications of loading external code

This provides flexibility for advanced users while keeping the main distribution path clean and secure.

---

## Conclusion

The plugin template + PR workflow approach provides the best balance of:
- **Security**: All code is reviewed
- **Quality**: Maintained standards across all plugins  
- **User Experience**: Simple installation and updates
- **Compliance**: Meets all browser extension store requirements
- **Sustainability**: Manageable maintenance burden
- **Community**: Encourages open-source contributions

The implementation should focus on making the PR process as smooth as possible with excellent documentation, automated tooling, and clear guidelines.
