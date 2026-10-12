#!/usr/bin/env node
// CI smoke benchmark wrapper
process.env.CI_SMOKE_MODE = "true";
import("./run_benchmark.js");
