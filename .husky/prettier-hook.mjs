#!/usr/bin/env node

import { spawn } from 'child_process';

// Get the directory path of the current file

// Run prettier with ESM support
const prettierProcess = spawn('node', [
  '--experimental-json-modules',
  '--no-warnings',
  '--loader=ts-node/esm',
  './node_modules/.bin/prettier',
  '--write',
  ...process.argv.slice(2)
], {
  stdio: 'inherit',
  cwd: process.cwd()
});

prettierProcess.on('close', (code) => {
  process.exit(code);
}); 