import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(root, '.env') });

const k6Args = process.argv.slice(2);
if (k6Args.length === 0) {
  console.error('Usage: node scripts/k6-with-env.mjs run k6/auth.js [...]');
  process.exit(1);
}

const child = spawn('k6', k6Args, {
  stdio: 'inherit',
  env: process.env,
  cwd: root,
});

child.on('error', (err) => {
  if (err && 'code' in err && err.code === 'ENOENT') {
    console.error(`
k6 is not installed (or not on PATH). Install it, then re-run.

  macOS:    brew install k6
  Others:   https://grafana.com/docs/k6/latest/set-up/install-k6/
`);
    process.exit(127);
  }
  throw err;
});

child.on('exit', (code) => process.exit(code ?? 0));
