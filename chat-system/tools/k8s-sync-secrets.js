const { readFileSync } = require('fs');
const { spawnSync } = require('child_process');
const { resolve } = require('path');

const composePath = resolve(__dirname, '../../docker-compose.delivery.yml');
const compose = readFileSync(composePath, 'utf8');

function readComposeValue(key) {
  const line = compose
    .split(/\r?\n/)
    .find((candidate) => candidate.trim().startsWith(`${key}:`));

  if (!line) {
    throw new Error(`Missing ${key} in ${composePath}`);
  }

  return line.split(':').slice(1).join(':').trim();
}

const smtpUser = readComposeValue('SMTP_USER');
const smtpPass = readComposeValue('SMTP_PASS');

const createSecret = spawnSync(
  'kubectl',
  [
    'create',
    'secret',
    'generic',
    'delivery-secret',
    '-n',
    'apps',
    `--from-literal=SMTP_USER=${smtpUser}`,
    `--from-literal=SMTP_PASS=${smtpPass}`,
    '--dry-run=client',
    '-o',
    'yaml',
  ],
  { encoding: 'utf8' },
);

if (createSecret.status !== 0) {
  process.stderr.write(createSecret.stderr);
  process.exit(createSecret.status ?? 1);
}

const applySecret = spawnSync('kubectl', ['apply', '-f', '-'], {
  input: createSecret.stdout,
  encoding: 'utf8',
  stdio: ['pipe', 'inherit', 'inherit'],
});

process.exit(applySecret.status ?? 0);
