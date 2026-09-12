#!/usr/bin/env node
import { runBugScannerCli } from "./cli-runner.js";

runBugScannerCli(process.argv.slice(2)).catch((error) => {
  console.error(error.message);
  process.exit(1);
});
