const fs = require('fs');
const path = require('path');

const pkgPath = path.resolve(__dirname, '..', 'package.json');
const outPath = path.resolve(__dirname, '..', 'src', 'assets', 'update.json');

function main() {
  let pkg = {};
  try { pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')); } catch (e) { console.error('Could not read package.json', e); }
  const base = pkg && pkg.version ? pkg.version : '';
  const ts = new Date().toISOString();
  let version = base;
  // If package.json has a semver version, increment the patch number.
  try {
    const m = (base || '').match(/^(\d+)\.(\d+)\.(\d+)(.*)$/);
    if (m) {
      const major = parseInt(m[1], 10);
      const minor = parseInt(m[2], 10);
      const patch = parseInt(m[3], 10) + 1; // bump patch
      version = `${major}.${minor}.${patch}` + (m[4] || '');
      pkg.version = version;
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');
    }
  } catch (e) {
    // fall back to base version if anything goes wrong
    version = base || ts;
  }
  const out = { version: version, force: false, generated: ts };
  try {
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
    console.log('Wrote', outPath, 'version=', version);
  } catch (e) { console.error('Could not write update.json', e); process.exit(1); }
}

main();
