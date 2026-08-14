/**
 * Quickbase API Proxy Cloud Function
 * This function securely proxies requests to Quickbase API,
 * keeping the API token server-side and never exposed to clients.
 */

const {onRequest, onCall} = require("firebase-functions/v2/https");
const {setGlobalOptions} = require("firebase-functions/v2");
const logger = require("firebase-functions/logger");
// v1 functions is used only for HttpsError constructor
let functionsV1;
try { functionsV1 = require('firebase-functions'); } catch (e) { functionsV1 = null; }
const cors = require("cors")({origin: true});
const {generateAgreementPdfBuffer} = require('./pdf/generateAgreementPdf');

// Set global options for all functions
setGlobalOptions({maxInstances: 10});

// IMPORTANT: Do NOT hardcode secrets in source. Configure them securely.
// Recommended options:
// 1) Set environment variables in your hosting environment (preferred for CI/CD):
//    QUICKBASE_API_KEY, QUICKBASE_REALM, QUICKBASE_BASE_URL, QUICKBASE_QUERY_URL
// 2) Or use `firebase functions:config:set quickbase.apikey="KEY" quickbase.realm="..."`
// This code will first try `process.env`, then fall back to `functions.config()` if present.
let ffConfig = {};
try {
  const ff = require('firebase-functions');
  ffConfig = ff.config && ff.config().quickbase ? ff.config().quickbase : {};
} catch (e) {
  ffConfig = {};
}

const QUICKBASE_CONFIG = {
  apiKey: process.env.QUICKBASE_API_KEY || ffConfig.apikey || '',
  realm: process.env.QUICKBASE_REALM || ffConfig.realm || 'bobfaulk.quickbase.com',
  baseUrl: process.env.QUICKBASE_BASE_URL || 'https://api.quickbase.com/v1/records',
  queryUrl: process.env.QUICKBASE_QUERY_URL || 'https://api.quickbase.com/v1/records/query',
};

/**
 * Quickbase API Proxy - HTTP callable function
 * This function accepts requests from your Angular app
 * and forwards them to Quickbase
 */
// Bind the secret so Firebase injects it into `process.env.QUICKBASE_API_KEY` at runtime.
// See: https://firebase.google.com/docs/functions/config-env#secret-manager
exports.quickbaseProxy = onCall({cors: true, secrets: ['QUICKBASE_API_KEY']}, async (request) => {
  // Log incoming payload as early as possible for emulator diagnostics
  try { logger.debug('quickbaseProxy invoked - request.data keys', Object.keys(request.data || {})); } catch (e) { logger.debug('quickbaseProxy invoked - (could not stringify request.data)'); }
  const {method, endpoint, body} = request.data;

  if (!method || !endpoint) {
    throw new Error("Missing required parameters: method and endpoint");
  }

  let bodyPreview = '';
  try { bodyPreview = JSON.stringify(body || {}).substring(0, 1000); } catch (e) { bodyPreview = '[unserializable]'; }
  logger.info("Quickbase Proxy Request", {method, endpoint, bodyPreview});

  // Ensure API key is configured server-side
  if (!QUICKBASE_CONFIG.apiKey) {
    logger.error('Quickbase API key not configured on server');
    // Return a structured error so emulator / callers receive a predictable payload
    return { success: false, error: { type: 'config', message: 'Quickbase API key not configured on server' } };
  }

  try {
    // Use require instead of dynamic import for compatibility
    const fetch = require("node-fetch");

    // Determine the full URL
    let url;
    if (endpoint === "query") {
      url = QUICKBASE_CONFIG.queryUrl;
    } else if (endpoint === "records") {
      url = QUICKBASE_CONFIG.baseUrl;
    } else if (typeof endpoint === 'string' && endpoint.startsWith("https://")) {
      // Allow full URLs for fields endpoint, etc.
      url = endpoint;
    } else {
      url = `https://api.quickbase.com/v1/${endpoint}`;
    }

    // Build headers with the secure API token
    const headers = {
      "QB-Realm-Hostname": QUICKBASE_CONFIG.realm,
      "Authorization": `QB-USER-TOKEN ${QUICKBASE_CONFIG.apiKey}`,
      "Content-Type": "application/json",
    };

    // Make the request to Quickbase with a small retry/backoff for 5xx
    const maxRetries = 2;
    let attempt = 0;
    let response = null;
    let lastErr = null;
    while (attempt <= maxRetries) {
      try {
        response = await fetch(url, {
          method: method.toUpperCase(),
          headers: headers,
          body: body ? JSON.stringify(body) : undefined,
        });

        // Retry on 502/503/504
        if ([502, 503, 504].includes(response.status)) {
          lastErr = new Error(`Quickbase API returned ${response.status}`);
          if (attempt < maxRetries) {
            const waitMs = 500 * Math.pow(2, attempt);
            logger.warn('Quickbase API temporary error, will retry', {status: response.status, attempt, waitMs, endpoint});
            await new Promise(r => setTimeout(r, waitMs));
            attempt++;
            continue;
          }
        }

        // If we got here, break and handle response
        break;
      } catch (err) {
        lastErr = err;
        if (attempt < maxRetries) {
          const waitMs = 500 * Math.pow(2, attempt);
          logger.warn('Quickbase fetch error, retrying', {err: err.message, attempt, waitMs, endpoint});
          await new Promise(r => setTimeout(r, waitMs));
          attempt++;
          continue;
        }
        // no more retries
        throw err;
      }
    }

    const contentType = response.headers.get('content-type') || '';

    // If the response is an image or binary, return base64 so the client can render it
    if (contentType.startsWith('image/') || contentType.includes('application/octet-stream')) {
      const buffer = await response.buffer();
      const base64 = `data:${contentType};base64,${buffer.toString('base64')}`;
      if (!response.ok) {
        logger.error('Quickbase API Error (binary)', {status: response.status});
        throw new Error(`Quickbase API error: ${response.status}`);
      }
      logger.info('Quickbase Proxy Success (binary)', {endpoint, status: response.status});
      return {success: true, data: base64};
    }

    // Otherwise assume JSON
    const data = await response.json();

    if (!response.ok) {
      logger.error("Quickbase API Error", {status: response.status, data, endpoint});
      // Return structured error payload instead of throwing so callers receive a predictable response
      return { success: false, error: { type: 'quickbase', status: response.status, data, endpoint } };
    }

    // logger.info("Quickbase Proxy Success", {endpoint, status: response.status});
          logger.info("Quickbase Proxy Success", {
        endpoint,
        status: response.status,
        metadata: data.metadata,
        lineErrors: data.lineErrors,
        data: data.data
      });
    return {success: true, data};
  } catch (error) {
    // Log stack for deeper debugging
    try { logger.error("Quickbase Proxy Error", {message: error.message, stack: error.stack || null, endpoint, bodyPreview}); } catch (e) { logger.error("Quickbase Proxy Error (logging failed)", {message: error.message}); }

    // Return structured error payload so the client can handle it gracefully
    try { 
      return { success: false, error: { message: error.message, stack: error.stack || null, endpoint, bodyPreview } };
    } catch (e) {
      return { success: false, error: { message: error.message } };
    }
  }
});

/**
 * Health check endpoint
 */
exports.healthCheck = onRequest((req, res) => {
  cors(req, res, () => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "Quickbase Proxy",
    });
  });
});

/**
 * Generates a PDF for the Disciplinary Stipulated Agreement.
 * Accepts the agreement data from the Angular app and returns a base64 PDF.
 */
exports.generateStipulatedAgreementPdf = onCall({
  cors: true,
  memory: '1GiB',
  timeoutSeconds: 120,
}, async (request) => {
  try {
    const data = request.data || {};

    if (!data.participantName || !data.effectiveDate) {
      throw new Error("Missing required agreement fields: participantName and effectiveDate");
    }

    logger.info("Generating stipulated agreement PDF", {
      participantName: data.participantName,
      effectiveDate: data.effectiveDate,
    });

    const pdfBase64 = await generateAgreementPdfBuffer(data);

    return {
      success: true,
      pdfBase64,
    };
  } catch (error) {
    logger.error("Failed to generate stipulated agreement PDF", {
      message: error.message,
      stack: error.stack,
    });

    return {
      success: false,
      error: {
        message: error.message,
        stack: error.stack || null,
      },
    };
  }
});

/**
 * Sends the Disciplinary Stipulated Agreement PDF via email.
 * Updates the participant's QuickBase record with a new email if requested.
 * Uses Nodemailer over IONOS SMTP; credentials come from Firebase secrets.
 */
exports.sendStipulatedAgreementEmail = onCall({
  cors: true,
  secrets: ['QUICKBASE_API_KEY', 'EMAIL_USER', 'EMAIL_PASS'],
}, async (request) => {
  const data = request.data || {};
  const {
    recipientEmail,
    pdfBase64,
    participantName,
    participantRecordId,
    updateParticipantEmail,
    houseLeaderEmail,
  } = data;

  if (!recipientEmail || !pdfBase64) {
    throw new Error('Missing required parameters: recipientEmail and pdfBase64');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(recipientEmail)) {
    throw new Error('Invalid email address');
  }

  // Ensure SMTP credentials are configured.
  const smtpUser = process.env.EMAIL_USER;
  const smtpPass = process.env.EMAIL_PASS;
  if (!smtpUser || !smtpPass) {
    throw new Error('SMTP credentials are not configured. Set EMAIL_USER and EMAIL_PASS secrets.');
  }

  // Avoid exposing full email addresses in logs.
  const maskEmail = (email) => {
    if (!email || typeof email !== 'string') return null;
    const [local, domain] = email.split('@');
    if (!local || !domain) return null;
    return `${local.slice(0, 2)}***@${domain}`;
  };

  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: 'smtp.ionos.com',
      port: 465,
      secure: true,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const safeName = String(participantName || 'Participant')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    const filename = safeName
      ? `Disciplinary-Stipulated-Agreement-${safeName}.pdf`
      : 'Disciplinary-Stipulated-Agreement.pdf';

    const pdfBuffer = Buffer.from(pdfBase64, 'base64');

    // Build CC list: always include the fixed address; add the House Leader when available and not the primary recipient.
    let ccList = ['timothy.ramirez@homtransitions.org'];
    // let ccList = ['barry@intelli-bridge.net'];
    if (houseLeaderEmail && emailRegex.test(houseLeaderEmail) && houseLeaderEmail !== recipientEmail) {
      ccList.unshift(houseLeaderEmail);
    }

    // Never duplicate the primary recipient in CC (e.g., fallback case where Timothy is the To).
    ccList = ccList.filter(addr => addr !== recipientEmail);

    await transporter.sendMail({
      from: `"House of Mercy" <${smtpUser}>`,
      to: recipientEmail,
      cc: ccList,
      subject: `Disciplinary Stipulated Agreement - ${participantName || 'Participant'}`,
      text: `Hello ${participantName || 'Participant'},\n\nAttached is your Disciplinary Stipulated Agreement from House of Mercy.\n\nPlease retain this document for your records.\n\nThank you,\nHouse of Mercy`,
      html: `<p>Hello ${participantName || 'Participant'},</p><p>Attached is your Disciplinary Stipulated Agreement from House of Mercy.</p><p>Please retain this document for your records.</p><p>Thank you,<br>House of Mercy</p>`,
      attachments: [
        {
          filename,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    logger.info('Stipulated agreement emailed', {
      recipientEmail: maskEmail(recipientEmail),
      cc: ccList.map(maskEmail),
      participantName,
      participantRecordId,
    });

    // Update QuickBase participant record with the email when appropriate.
    if (updateParticipantEmail && participantRecordId) {
      try {
        const fetch = require('node-fetch');
        const tableId = 'bjgvye6ni';
        const updateBody = {
          to: tableId,
          data: [
            {
              3: {value: participantRecordId},
              177: {value: recipientEmail},
            },
          ],
        };

        const headers = {
          'QB-Realm-Hostname': QUICKBASE_CONFIG.realm,
          'Authorization': `QB-USER-TOKEN ${QUICKBASE_CONFIG.apiKey}`,
          'Content-Type': 'application/json',
        };

        const response = await fetch(QUICKBASE_CONFIG.baseUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(updateBody),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`QuickBase update failed: ${response.status} ${JSON.stringify(errorData)}`);
        }
      } catch (error) {
        logger.error('Failed to update participant email in QuickBase', {
          participantRecordId,
          error: error.message,
        });
        throw new Error(`Unable to update participant email after the agreement was emailed: ${error.message}`);
      }
    }

    return {success: true};
  } catch (error) {
    logger.error('Failed to send stipulated agreement email', {
      recipientEmail,
      error: error.message,
    });
    throw new Error(`Unable to send the agreement: ${error.message}`);
  }
});

/**
 * Uploads the Disciplinary Stipulated Agreement PDF to the participant's QuickBase record.
 * Stores the PDF as an attachment in Field ID 1125 (Stipulated Agreement).
 */
exports.uploadStipulatedAgreementPdf = onCall({
  cors: true,
  secrets: ['QUICKBASE_API_KEY'],
}, async (request) => {
  const data = request.data || {};
  const {pdfBase64, participantRecordId, participantName} = data;

  if (!pdfBase64 || !participantRecordId) {
    throw new Error('Missing required parameters: pdfBase64 and participantRecordId');
  }

  const safeName = String(participantName || 'Participant')
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const filename = safeName
    ? `Disciplinary-Stipulated-Agreement-${safeName}.pdf`
    : 'Disciplinary-Stipulated-Agreement.pdf';

  try {
    const pdfData = Buffer.from(pdfBase64, 'base64').toString('base64');

    const fetch = require('node-fetch');
    const tableId = 'bjgvye6ni';
    const uploadBody = {
      to: tableId,
      data: [
        {
          3: {value: participantRecordId},
          1125: {value: {fileName: filename, data: pdfData}},
        },
      ],
    };

    const headers = {
      'QB-Realm-Hostname': QUICKBASE_CONFIG.realm,
      'Authorization': `QB-USER-TOKEN ${QUICKBASE_CONFIG.apiKey}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(QUICKBASE_CONFIG.baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(uploadBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`QuickBase upload failed: ${response.status} ${JSON.stringify(errorData)}`);
    }

    logger.info('Stipulated agreement PDF uploaded to QuickBase', {
      participantRecordId,
      participantName,
      filename,
    });

    return {success: true};
  } catch (error) {
    logger.error('Failed to upload stipulated agreement PDF to QuickBase', {
      participantRecordId,
      error: error.message,
    });
    throw new Error(`Unable to upload the agreement to QuickBase: ${error.message}`);
  }
});
