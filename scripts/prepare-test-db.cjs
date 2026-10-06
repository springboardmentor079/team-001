const path = require('node:path');
const { spawnSync } = require('node:child_process');
require('dotenv').config({ path: path.resolve(__dirname, '../backend/.env'), quiet: true });
const connection = new URL(process.env.DATABASE_URL);
connection.pathname = '/buildtrack_test';
const result = spawnSync(
  process.execPath,
  [path.resolve(__dirname, '../node_modules/prisma/build/index.js'), 'migrate', 'deploy'],
  {
    cwd: path.resolve(__dirname, '../backend'),
    env: { ...process.env, DATABASE_URL: connection.toString() },
    stdio: 'inherit',
  },
);
process.exit(result.status ?? 1);
