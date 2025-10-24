# Contributing to Complexity

Thank you for your interest in contributing to the Complexity extension! This guide will help you get started with contributing plugins and other improvements.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Contributing Plugins](#contributing-plugins)
  - [Bug Reports](#bug-reports)
  - [Feature Requests](#feature-requests)
  - [Code Contributions](#code-contributions)
- [Development Setup](#development-setup)
- [Plugin Development](#plugin-development)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)

## Code of Conduct

This project adheres to a code of conduct that all contributors are expected to follow:

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Respect differing viewpoints and experiences
- Accept constructive criticism gracefully

## How Can I Contribute?

### Contributing Plugins

**We welcome community-contributed plugins!** Plugins are the best way to extend the extension's functionality while maintaining quality and security standards.

#### Before You Start

1. **Check existing plugins**: Review [existing plugins](./src/plugins/) to see if similar functionality exists
2. **Open an issue**: Discuss your plugin idea in a GitHub issue first to get feedback
3. **Read the documentation**: Familiarize yourself with the [Plugin Development Guide](./docs/plugin-development-guide.md)

#### Plugin Development Workflow

1. **Fork the repository**
2. **Set up your development environment** (see [Development Setup](#development-setup))
3. **Create your plugin**:
   ```bash
   cd perplexity/extension
   pnpm plugin:init my-awesome-plugin
   ```
4. **Develop and test** your plugin thoroughly
5. **Validate** your plugin:
   ```bash
   pnpm plugin:validate src/plugins/my-awesome-plugin
   ```
6. **Submit a Pull Request** using the [plugin submission template](.github/PULL_REQUEST_TEMPLATE/plugin_submission.md)

#### Plugin Guidelines

- **Single Responsibility**: Each plugin should do one thing well
- **User Control**: Always respect the `enabled` setting
- **Clean Up**: Remove all side effects when disabled
- **Performance**: Minimize performance impact
- **Accessibility**: Follow accessibility best practices
- **Documentation**: Include clear documentation and examples

### Bug Reports

Found a bug? Help us fix it by providing detailed information:

1. **Search existing issues** to avoid duplicates
2. **Create a new issue** with:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected vs. actual behavior
   - Screenshots/GIFs if applicable
   - Browser and extension version
   - Console errors (if any)

### Feature Requests

Have an idea for a new feature or plugin?

1. **Check existing issues** for similar requests
2. **Open a new issue** describing:
   - The problem you're trying to solve
   - Your proposed solution
   - Alternative solutions you've considered
   - Why this would be useful to others

### Code Contributions

Contributing to the core extension code (non-plugin):

1. **Discuss first**: Open an issue to discuss significant changes
2. **Follow the architecture**: Respect existing boundaries and patterns
3. **Test thoroughly**: Ensure all tests pass and add new tests
4. **Document changes**: Update relevant documentation

## Development Setup

### Prerequisites

- **Node.js**: v22.12.0 or higher
- **pnpm**: v10.17.1
- **Git**: Latest version
- **Chrome or Edge**: For testing (Firefox development has limitations)

### Setup Steps

1. **Fork and clone the repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/complexity.git
   cd complexity
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Build packages**:
   ```bash
   pnpm build
   ```

4. **Start development server**:
   ```bash
   cd perplexity/extension
   pnpm dev
   ```

5. **Load extension in Chrome**:
   - Navigate to `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `perplexity/extension/dist/chrome`

### Development Commands

```bash
# Start dev server with HMR
pnpm dev

# Run linter
pnpm lint

# Fix linting issues
pnpm lintf

# Run type checking
pnpm check-types

# Format code
pnpm fmt

# Run tests
pnpm test

# Build for production
pnpm build

# Plugin commands
pnpm plugin:init <name>      # Scaffold new plugin
pnpm plugin:validate [path]  # Validate plugin
pnpm plugin:list             # List all plugins
```

## Plugin Development

### Quick Start

```bash
# Scaffold a new plugin
pnpm plugin:init my-plugin

# Answer the prompts:
# - Plugin display name
# - Description
# - Category (thread, ui, general, etc.)
# - Tags
# - Create loader? (yes)
# - Create settings UI? (yes)

# Your plugin is now in src/plugins/my-plugin/
```

### Plugin Structure

```
src/plugins/my-plugin/
├── index.manifest.ts    # Required: Plugin metadata
├── loader.ts            # Optional: Initialization code
├── settings-ui.tsx      # Optional: Settings interface
├── components/          # Optional: UI components
├── hooks/              # Optional: React hooks
├── utils.ts            # Optional: Helper functions
├── types.ts            # Optional: Type definitions
├── store.ts            # Optional: State management
└── README.md           # Optional: Plugin documentation
```

### Essential Plugin Features

Every plugin must:

1. **Check if enabled** before executing:
   ```typescript
   export default async function () {
     const settings = useExtensionSettingsStore.getState().settings;
     if (!settings?.plugins.myPlugin?.enabled) {
       return;
     }
     // Plugin logic here
   }
   ```

2. **Include `enabled` in settings schema**:
   ```typescript
   const schema = z.object({
     enabled: z.boolean(),
     // Other settings...
   });
   ```

3. **Clean up side effects** when disabled

4. **Follow naming conventions** (kebab-case for files, camelCase for IDs)

### Testing Your Plugin

1. **Manual Testing**:
   - Enable plugin in extension settings
   - Test core functionality
   - Test with plugin disabled
   - Test side effect cleanup
   - Check for console errors

2. **Validation**:
   ```bash
   pnpm plugin:validate src/plugins/my-plugin
   ```

3. **Build Test**:
   ```bash
   pnpm build
   ```

## Pull Request Process

### Before Submitting

- [ ] Code follows the project's style guidelines
- [ ] All tests pass (`pnpm test`)
- [ ] No linting errors (`pnpm lint`)
- [ ] No TypeScript errors (`pnpm check-types`)
- [ ] Code is formatted (`pnpm fmt`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Documentation is updated (if applicable)
- [ ] Plugin validated (`pnpm plugin:validate`)

### Submitting Your PR

1. **Create a feature branch**:
   ```bash
   git checkout -b plugin/my-awesome-plugin
   ```

2. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat(plugin): add My Awesome Plugin"
   ```

   Use conventional commit format:
   - `feat(plugin):` for new plugins
   - `fix(plugin):` for plugin bug fixes
   - `docs:` for documentation changes
   - `refactor:` for code refactoring
   - `test:` for test changes

3. **Push to your fork**:
   ```bash
   git push origin plugin/my-awesome-plugin
   ```

4. **Open a Pull Request**:
   - Use the plugin submission template
   - Provide clear description
   - Include screenshots/GIFs
   - List testing performed
   - Complete all checklist items

### PR Review Process

1. **Automated Checks**: CI/CD runs linting, type checking, and tests
2. **Code Review**: Maintainers review for quality, security, and performance
3. **Testing**: Maintainers test functionality manually
4. **Feedback**: Address any requested changes
5. **Approval**: Once approved, PR will be merged
6. **Release**: Plugin included in next extension release

### After Merge

- Your plugin will be included in the next release
- You'll be credited as a contributor
- Consider maintaining your plugin for bug fixes and improvements

## Style Guidelines

### Code Style

- **TypeScript**: Use TypeScript for all new code
- **Formatting**: Prettier handles formatting (run `pnpm fmt`)
- **Linting**: Follow ESLint rules (run `pnpm lint`)
- **Naming**: 
  - Files: `kebab-case.ts`
  - Variables/Functions: `camelCase`
  - Components: `PascalCase`
  - Constants: `UPPER_SNAKE_CASE`

### Component Style

- Use functional components with hooks
- Use existing UI components from `@/components/ui`
- Follow Tailwind CSS conventions with `x:` prefix
- Keep components focused and reusable

### Documentation Style

- Write clear, concise documentation
- Include code examples where helpful
- Use proper Markdown formatting
- Keep README files up to date

### Commit Message Style

Follow conventional commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**: feat, fix, docs, style, refactor, test, chore

**Example**:
```
feat(plugin): add custom theme plugin

Adds a new plugin that allows users to customize
the color scheme of the Perplexity interface.

Closes #123
```

## Getting Help

- **Documentation**: Check the [docs](./docs/) directory
- **Discord**: Join the [Complexity Discord](https://discord.cplx.app)
- **GitHub Issues**: Search existing issues or open a new one
- **Plugin Examples**: Study existing plugins in `src/plugins/`

## License

By contributing to Complexity, you agree that your contributions will be licensed under the same license as the project. See [LICENSE](../../LICENSE) for details.

---

Thank you for contributing to Complexity! Your efforts help make the extension better for everyone. 🚀
