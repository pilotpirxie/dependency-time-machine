#!/usr/bin/env node
import { program } from "commander";
import { run } from "./run";

program
  .name("dependency-time-machine")
  .description(
    "Tool to automatically update dependencies one-by-one in the time order",
  )
  .option(
    "-p, --packageFile <file>",
    "Path to package.json file",
    "package.json",
  )
  .option("-u, --update", "Update package.json file with new versions")
  .option(
    "-is, --install-script <command>",
    "Install with script",
    "npm install",
  )
  .option("-ts, --test-script <command>", "Test command", "npm test")
  .option("-i, --install", "Install with script")
  .option("-t, --timeline", "Print timeline")
  .option("-a, --auto", "Run in auto mode")
  .option("-c, --cache", "Cache resolved dependencies")
  .option("-ans, --allow-non-semver", "Allow non-semver versions")
  .option(
    "-cf, --cache-file <file>",
    "Cache file",
    "./.dependency-time-machine-cache.json",
  )
  .option(
    "-e, --exclude <dependency>",
    "Exclude dependency from update, separated by comma",
  )
  .option(
    "-r, --registry-url <url>",
    "Registry url",
    "https://registry.npmjs.org",
  )
  .option(
    "-x, --exclude-file <file>",
    "Exclude dependencies from file, one per line",
    "",
  )
  .option("-shmn, --stop-if-higher-major-number", "Stop if higher major number")
  .option(
    "-shmnv, --stop-if-higher-minor-number",
    "Stop if higher minor number",
  )
  .option("-pi, --print-info", "Print info about the packages")
  .action(run)
  .parse();
