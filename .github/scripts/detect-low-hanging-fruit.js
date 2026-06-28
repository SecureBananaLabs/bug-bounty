#!/usr/bin/env node
/**
 * Low Hanging Fruit Detection Script
 * 
 * Recursively scans the repository for common bugs, missing features,
 * and easy wins, then generates issue templates for them.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration for what to scan
const SCAN_CONFIG = {
  // File patterns to check for common issues
  patterns: {
    'missing-tests': {
      check: (filePath, content) => {
        // Check for files without corresponding test files
        const ext = path.extname(filePath);
        if (!['.js', '.ts', '.tsx', '.jsx'].includes(ext)) return false;
        if (filePath.includes('.test.') || filePath.includes('.spec.')) return false;
        const testPath = filePath.replace(ext, `.test${ext}`);
        const specPath = filePath.replace(ext, `.spec${ext}`);
        return !fs.existsSync(testPath) && !fs.existsSync(specPath);
      },
      severity: 'low',
      category: 'testing'
    },
    'todo-comments': {
      check: (filePath, content) => {
        const todoRegex = /TODO|FIXME|HACK|XXX/gi;
        const matches = content.match(todoRegex);
        return matches && matches.length > 0;
      },
      severity: 'low',
      category: 'code-quality'
    },
    'empty-functions': {
      check: (filePath, content) => {
        const emptyFunctionRegex = /function\s+\w+\s*\([^)]*\)\s*\{\s*(\/\/.*)?\s*\}/g;
        const arrowEmptyRegex = /const\s+\w+\s*=\s*(\([^)]*\)|[^=]*)\s*=>\s*\{\s*(\/\/.*)?\s*\}/g;
        return emptyFunctionRegex.test(content) || arrowEmptyRegex.test(content);
      },
      severity: 'low',
      category: 'implementation'
    },
    'console-logs': {
      check: (filePath, content) => {
        if (filePath.includes('.test.') || filePath.includes('.spec.')) return false;
        const consoleRegex = /console\.(log|warn|error|debug)\(/g;
        const matches = content.match(consoleRegex);
        return matches && matches.length > 0;
      },
      severity: 'low',
      category: 'code-quality'
    },
    'missing-error-handling': {
      check: (filePath, content) => {
        if (!filePath.includes('api') && !filePath.includes('route')) return false;
        const hasTryCatch = content.includes('try') && content.includes('catch');
        const hasAsync = content.includes('async');
        return hasAsync && !hasTryCatch;
      },
      severity: 'medium',
      category: 'error-handling'
    },
    'hardcoded-values': {
      check: (filePath, content) => {
        const hardcodedRegex = /(http:\/\/localhost|127\.0\.0\.1|3000|8080)/g;
        const matches = content.match(hardcodedRegex);
        return matches && matches.length > 0;
      },
      severity: 'low',
      category: 'configuration'
    },
    'missing-documentation': {
      check: (filePath, content) => {
        if (!filePath.endsWith('.ts') && !filePath.endsWith('.js')) return false;
        const hasJSDoc = content.includes('/**');
        const hasComments = content.includes('//');
        const lines = content.split('\n').length;
        return lines > 30 && !hasJSDoc && !hasComments;
      },
      severity: 'low',
      category: 'documentation'
    }
  },
  // Directories to exclude
  excludeDirs: ['node_modules', '.git', 'dist', 'build', '.next', 'coverage'],
  // File extensions to scan
  extensions: ['.js', '.ts', '.tsx', '.jsx', '.json', '.md']
};

// Results storage
const findings = [];

/**
 * Recursively scan directory for issues
 */
function scanDirectory(dirPath, baseDir = '') {