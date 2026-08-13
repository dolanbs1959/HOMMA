/**
 * Loads the House of Mercy logo as a base64 data URL so it can be embedded
 * directly into the PDF HTML without depending on browser-relative URLs.
 */
const {promises: fs} = require('fs');
const path = require('path');

let cachedLogo = null;

async function loadLogoBase64() {
  if (cachedLogo) {
    return cachedLogo;
  }

  const candidates = [
    path.join(__dirname, '..', 'assets', 'logo', 'HOM3.png'),
    path.join(__dirname, '..', '..', 'src', 'assets', 'logo', 'HOM3.png'),
  ];

  for (const candidate of candidates) {
    try {
      const buffer = await fs.readFile(candidate);
      cachedLogo = `data:image/png;base64,${buffer.toString('base64')}`;
      return cachedLogo;
    } catch (err) {
      // try the next candidate
    }
  }

  throw new Error(
    `HOMMA logo not found. Expected one of: ${candidates.join(', ')}`
  );
}

module.exports = {loadLogoBase64};
