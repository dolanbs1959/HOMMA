/**
 * Quickbase API Proxy Cloud Function
 * This function securely proxies requests to Quickbase API,
 * keeping the API token server-side and never exposed to clients.
 */

const {onRequest, onCall} = require("firebase-functions/v2/https");
const {setGlobalOptions} = require("firebase-functions/v2");
const logger = require("firebase-functions/logger");
const cors = require("cors")({origin: true});

// Set global options for all functions
setGlobalOptions({maxInstances: 10});

// IMPORTANT: Set this as an environment variable when deploying
// For now, we'll use it directly,
// but you should use: firebase functions:config:set
const QUICKBASE_CONFIG = {
  apiKey: "b7gwzr_dcp8_0_dvzja4mbs6b3bpdzddrekikqfkm",
  realm: "bobfaulk.quickbase.com",
  baseUrl: "https://api.quickbase.com/v1/records",
  queryUrl: "https://api.quickbase.com/v1/records/query",
};

/**
 * Quickbase API Proxy - HTTP callable function
 * This function accepts requests from your Angular app
 * and forwards them to Quickbase
 */
exports.quickbaseProxy = onCall({cors: true}, async (request) => {
  const {method, endpoint, body} = request.data;

  if (!method || !endpoint) {
    throw new Error("Missing required parameters: method and endpoint");
  }

  logger.info("Quickbase Proxy Request", {method, endpoint});

  try {
    // Use require instead of dynamic import for compatibility
    const fetch = require("node-fetch");

    // Determine the full URL
    let url;
    if (endpoint === "query") {
      url = QUICKBASE_CONFIG.queryUrl;
    } else if (endpoint === "records") {
      url = QUICKBASE_CONFIG.baseUrl;
    } else if (endpoint.startsWith("https://")) {
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

    // Make the request to Quickbase
    const response = await fetch(url, {
      method: method.toUpperCase(),
      headers: headers,
      body: body ? JSON.stringify(body) : undefined,
    });

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
      logger.error("Quickbase API Error", {status: response.status, data});
      throw new Error(`Quickbase API error: ${response.status}`);
    }

    logger.info("Quickbase Proxy Success", {endpoint, status: response.status});
    return {success: true, data};
  } catch (error) {
    logger.error("Quickbase Proxy Error", {error: error.message});
    throw new Error(`Proxy error: ${error.message}`);
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
