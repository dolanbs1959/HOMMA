/**
 * Generates a PDF Buffer for a Disciplinary Stipulated Agreement using
 * Puppeteer with @sparticuz/chromium.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const puppeteer = require('puppeteer-core');
const chromiumModule = require('@sparticuz/chromium');
const Chromium = chromiumModule.default || chromiumModule;
const {renderStipulatedAgreementPdf} = require('./stipulatedAgreementRenderer');

/**
 * Search for a locally installed Chrome/Chromium executable.
 * @returns {string | null}
 */
function findLocalChrome() {
  const platform = os.platform();
  const candidates = [];

  if (platform === 'win32') {
    const programFiles = process.env['PROGRAMFILES'] || 'C:\\Program Files';
    const programFilesX86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)';
    const localAppData = process.env['LOCALAPPDATA'] || path.join(os.homedir(), 'AppData', 'Local');
    candidates.push(
      path.join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(programFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe')
    );
  } else if (platform === 'darwin') {
    candidates.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
  } else {
    candidates.push(
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/usr/local/bin/google-chrome',
      '/usr/local/bin/chromium-browser',
      '/usr/local/bin/chromium'
    );
  }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

/**
 * Launch a headless Chromium browser appropriate for the environment.
 * @returns {Promise<import('puppeteer-core').Browser>}
 */
async function launchBrowser() {
  // Allow local override via environment variable (trim surrounding quotes/spaces).
  let executablePath = (process.env.PUPPETEER_EXECUTABLE_PATH || '').trim();
  if (executablePath) {
    executablePath = executablePath.replace(/^["']|["']$/g, '').trim();
  }

  if (!executablePath) {
    executablePath = findLocalChrome();
  }

  if (!executablePath) {
    executablePath = await Chromium.executablePath();
  }

  return puppeteer.launch({
    executablePath,
    headless: true,
    args: Chromium.args,
  });
}

/**
 * Generate a PDF Buffer from the agreement data.
 * @param {Object} data - Agreement payload from the client.
 * @returns {Promise<string>}
 */
async function generateAgreementPdfBuffer(data) {
  const html = await renderStipulatedAgreementPdf(data);
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(html, {waitUntil: 'networkidle0'});
    const pdfBytes = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: {
        top: '0.2in',
        right: '0.25in',
        bottom: '0.2in',
        left: '0.25in',
      },
      preferCSSPageSize: true,
    });
    // page.pdf() returns a Uint8Array in this version of Puppeteer;
    // Buffer.from() ensures a real base64 string is produced.
    return Buffer.from(pdfBytes).toString('base64');
  } finally {
    await browser.close();
  }
}

module.exports = {generateAgreementPdfBuffer};
