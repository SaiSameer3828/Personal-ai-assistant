import { getBusinessProfile } from "../lib/whatsapp-client.mjs";
import { config } from "../config.mjs";

console.log("Config WhatsApp Phone ID:", config.whatsapp.phoneId);
console.log("Config WhatsApp Token starts with:", config.whatsapp.accessToken ? config.whatsapp.accessToken.substring(0, 15) + "..." : "NONE");

async function run() {
  try {
    console.log("Attempting to fetch WhatsApp Business Profile from Meta Graph API...");
    const profile = await getBusinessProfile();
    console.log("✅ Credentials are VALID! Profile data:", JSON.stringify(profile, null, 2));
  } catch (err) {
    console.error("❌ Token verification FAILED:", err.message);
  }
}

run();
