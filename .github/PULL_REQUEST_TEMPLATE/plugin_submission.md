---
name: Plugin Submission
about: Submit a new plugin for inclusion in the Complexity extension
title: 'feat(plugin): Add [Plugin Name]'
labels: 'plugin, enhancement'
---

## Plugin Information

**Plugin Name**: <!-- e.g., My Awesome Plugin -->
**Plugin ID**: <!-- e.g., myAwesomePlugin or thread:myAwesomePlugin -->
**Category**: <!-- e.g., thread, ui, general, home, comet -->

## Description

<!-- Provide a clear and concise description of what your plugin does -->

## Features

<!-- List the key features of your plugin -->

- Feature 1
- Feature 2
- Feature 3

## Screenshots/Demo

<!-- Add screenshots or GIFs demonstrating your plugin in action -->

## Testing

**Manual Testing:**
- [ ] Tested with plugin enabled
- [ ] Tested with plugin disabled
- [ ] Tested side effects cleanup
- [ ] Tested settings UI (if applicable)

**Automated Testing:**
- [ ] All existing tests pass
- [ ] Added new tests (if applicable)

## Checklist

**Code Quality:**
- [ ] Plugin follows directory structure conventions
- [ ] Plugin manifest is properly configured
- [ ] Settings schema includes enabled boolean
- [ ] Plugin checks if enabled before executing
- [ ] All side effects cleaned up when disabled
- [ ] No ESLint errors (pnpm lint)
- [ ] No TypeScript errors (pnpm check-types)
- [ ] Build succeeds (pnpm build)

**Documentation:**
- [ ] README.md created
- [ ] Code is well-commented

**Security:**
- [ ] No security vulnerabilities
- [ ] No sensitive data exposed
- [ ] Proper input validation

## Contributor Agreement

By submitting this PR, I confirm that:
- [ ] I have read and agree to the project license
- [ ] My contribution is original work
- [ ] I am willing to make changes based on review feedback
