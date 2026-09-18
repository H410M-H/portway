#!/usr/bin/env node

/**
 * Syncbay PaaS — CLI Executable Binary
 */

const path = require("path");
const { spawnSync } = require("child_process");

const cliPath = path.join(__dirname, "../src/cli/index.ts");
const tsxPath = path.join(__dirname, "../node_modules/tsx/dist/cli.mjs");

const res = spawnSync(process.execPath, [tsxPath, cliPath, ...process.argv.slice(2)], {
  stdio: "inherit",
});

process.exit(res.status ?? 0);
