#!/usr/bin/env node

/**
 * Plugin Development CLI Tool
 * 
 * Provides commands for scaffolding, validating, and managing external plugins.
 */

import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { validateCommand } from "./commands/validate.js";
import { listCommand } from "./commands/list.js";

const program = new Command();

program
  .name("cplx-plugin")
  .description("CLI tool for Complexity plugin development")
  .version("1.0.0");

program
  .command("init")
  .description("Scaffold a new plugin")
  .argument("<plugin-name>", "Name of the plugin (kebab-case)")
  .option("-d, --directory <path>", "Target directory", "src/plugins")
  .option("-c, --category <category>", "Plugin category", "general")
  .action(initCommand);

program
  .command("validate")
  .description("Validate plugin structure and code")
  .argument("[plugin-path]", "Path to plugin directory")
  .option("-a, --all", "Validate all plugins")
  .action(validateCommand);

program
  .command("list")
  .description("List all plugins in the project")
  .option("-j, --json", "Output as JSON")
  .action(listCommand);

program.parse();
