import http from "http";
import crypto from "crypto";
import { config } from "./config.mjs";
import { parseWebhookMessages, markAsRead, sendWhatsAppMessage } from "./lib/whatsapp-client.mjs";
import { processIncomingMessage } from "./agents/whatsapp-agent.mjs";

/**
 * WhatsApp Webhook Server
 * Receives incoming messages from Meta's WhatsApp Cloud API.
 * 
 * Setup:
 * 1. Set WHATSAPP_VERIFY_TOKEN in .env
 * 2. Expose this server via ngrok or similar: ngrok http 3001
 * 3. Set the webhook URL in Meta Developer Console:
 *    https://developers.facebook.com/apps → Webhooks → WhatsApp
 *    URL: https://your-ngrok-url/webhook
 *    Verify token: your WHATSAPP_VERIFY_TOKEN value
 */

const PORT = parseInt(process.env.PORT || process.env.WHATSAPP_WEBHOOK_PORT || "3002", 10);
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "personal_ai_assistant_verify";

function parseBodyWithRaw(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve({
          raw: body,
          json: JSON.parse(body),
        });
      } catch {
        resolve({
          raw: body,
          json: null,
        });
      }
    });
    req.on("error", reject);
  });
}

function verifySignature(rawBody, signatureHeader, appSecret) {
  if (!appSecret) {
    console.warn("⚠️ WARNING: WHATSAPP_APP_SECRET is not configured. Webhook signature verification is bypassed!");
    return true;
  }
  if (!signatureHeader) {
    console.error("❌ Signature verification failed: Missing x-hub-signature-256 header");
    return false;
  }
  const elements = signatureHeader.split("=");
  if (elements.length !== 2 || elements[0] !== "sha256") {
    console.error("❌ Signature verification failed: Invalid signature format");
    return false;
  }
  const signature = elements[1];
  const expectedSignature = crypto
    .createHmac("sha256", appSecret)
    .update(rawBody)
    .digest("hex");

  try {
    const isMatch = crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
    if (!isMatch) {
      console.error("❌ Signature verification failed: Signature mismatch");
    }
    return isMatch;
  } catch (err) {
    console.error("❌ Signature verification failed:", err.message);
    return false;
  }
}

const server = http.createServer(async (req, res) => {
  console.log(`📡 [HTTP] ${req.method} ${req.url}`);

  const url = new URL(req.url, `http://localhost:${PORT}`);

  // Webhook verification (GET)
  if (req.method === "GET" && url.pathname === "/webhook") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("✅ Webhook verified");
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end(challenge);
    } else {
      res.writeHead(403);
      res.end("Forbidden");
    }
    return;
  }

  // Temporary test route (POST)
  if (req.method === "POST" && url.pathname === "/test") {
    console.log("✅ Test POST received");
    const { json: body } = await parseBodyWithRaw(req);
    console.log(body);
    res.writeHead(200);
    res.end("OK");
    return;
  }

  // Incoming messages (POST)
  if (req.method === "POST" && url.pathname === "/webhook") {
    console.log("🔥 POST /webhook received");
    const { raw, json: body } = await parseBodyWithRaw(req);

    // Verify signature
    const signatureHeader = req.headers["x-hub-signature-256"];
    const isValid = verifySignature(raw, signatureHeader, config.whatsapp.appSecret);

    if (!isValid) {
      res.writeHead(401, { "Content-Type": "text/plain" });
      res.end("Unauthorized: Invalid signature");
      return;
    }

    // Respond 200 immediately (Meta requires quick response)
    res.writeHead(200);
    res.end("OK");

    if (!body) return;

    // Log the raw webhook payload
    console.log("Incoming Webhook Payload:", JSON.stringify(body, null, 2));

    // Parse messages
    const messages = parseWebhookMessages(body);

    for (const msg of messages) {
      try {
        console.log(`📱 WhatsApp from ${msg.senderName} (${msg.from}): ${msg.text}`);

        // Mark as read
        await markAsRead(msg.id).catch(() => { });

        console.log("📩 Processing message...");
        const response = await processIncomingMessage(msg);
        console.log("🤖 Agent response:", response);

        if (response) {
          console.log("📤 Sending WhatsApp reply...");
          try {
            await sendWhatsAppMessage(msg.from, response);
            console.log("✅ Reply sent");
          } catch (err) {
            console.error("❌ Send failed:", err);
          }
        } else {
          console.log("⚠️ No response returned by processIncomingMessage()");
        }
      } catch (err) {
        console.error(`Error processing webhook message from ${msg.from}:`, err);
      }
    }
    return;
  }

  // Health check
  if (req.method === "GET" && url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", service: "whatsapp-webhook" }));
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`🟢 WhatsApp webhook server running on port ${PORT}`);
  console.log(`   Verify token: ${VERIFY_TOKEN}`);
  console.log(`   Webhook URL: http://localhost:${PORT}/webhook`);
  console.log(`\n   To expose publicly: npx ngrok http ${PORT}`);
});
