// Entry point for `node --test src/tests`.
// Newer Node releases resolve a directory argument as a module path rather
// than scanning it for test files, so import the suites explicitly.
import "./health.test.js";
import "./auth.test.js";
