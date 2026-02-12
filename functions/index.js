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
exports.quickbaseProxy = onCall({cors: true}, async (request) => {
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

    logger.info("Quickbase Proxy Success", {endpoint, status: response.status});
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
