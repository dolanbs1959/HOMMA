#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function readPackageVersion() {
  const pkgPath = path.join(__dirname, '..', 'package.json');
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    return pkg.version || '0.0.0';
  } catch (e) {
    console.error('Unable to read package.json for version', e);
    return '0.0.0';
  }
}

const argv = process.argv.slice(2);
let provided = null;
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--version' && argv[i+1]) { provided = argv[i+1]; i++; }
}

const semver = provided || readPackageVersion();
const displayVersion = `V.${semver}`;
const payload = {
  version: displayVersion,
  force: false,
  generated: new Date().toISOString()
};

const targets = [
  path.join(__dirname, '..', 'src', 'assets', 'update.json'),
  path.join(__dirname, '..', 'docs', 'assets', 'update.json')
];

for (const t of targets) {
  const dir = path.dirname(t);
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(t, JSON.stringify(payload, null, 2) + '\n', 'utf8');
    console.log('Wrote', t);
  } catch (e) {
    console.error('Failed to write', t, e);
  }
}

console.log('generate-update-json done. version=', displayVersion);
