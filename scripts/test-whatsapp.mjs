import { getBusinessProfile } from "../lib/whatsapp-client.mjs";
import { config } from "../config.mjs";

async function runDiagnostics() {
  console.log("🩺 Starting WhatsApp Integration Diagnostics...\n");

  console.log("1. Checking Environment Variables...");
  console.log(`   - WHATSAPP_PHONE_ID: ${config.whatsapp.phoneId ? "✅ Set" : "❌ MISSING"}`);
  console.log(`   - WHATSAPP_BUSINESS_ID: ${config.whatsapp.whatsappId ? "✅ Set" : "❌ MISSING"}`);
  console.log(`   - WHATSAPP_ACCESS_TOKEN: ${config.whatsapp.accessToken ? "✅ Set" : "❌ MISSING"}`);
  console.log(`   - WHATSAPP_VERIFY_TOKEN: ${config.whatsapp.verifyToken ? `✅ Set (${config.whatsapp.verifyToken})` : "❌ MISSING"}`);
  console.log(`   - WHATSAPP_APP_SECRET: ${config.whatsapp.appSecret ? "✅ Set" : "⚠️ Optional but recommended for signature verification"}`);

  if (!config.whatsapp.accessToken || !config.whatsapp.phoneId) {
    console.error("\n❌ Diagnostics failed: WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_ID must be configured in .env");
    process.exit(1);
  }

  console.log("\n2. Testing Meta Graph API Connection (Fetching Business Profile)...");
  try {
    const profile = await getBusinessProfile();
    console.log("✅ Successfully connected to Meta Graph API!");
    console.log("\nBusiness Profile Information:");
    console.log(JSON.stringify(profile, null, 2));
    
    console.log("\n🎉 Your WhatsApp credentials are valid and working!");
    console.log("Next steps to verify the webhook:");
    console.log("1. Run your server: npm start");
    console.log("2. Open a tunnel (e.g. ngrok): npx ngrok http 3002");
    console.log("3. Configure the webhook URL in Meta Developers Console to point to your tunnel.");
  } catch (error) {
    console.error("\n❌ Meta Graph API Connection failed!");
    console.error("Error details:", error.message);
    
    console.log("\n💡 Troubleshooting Tips:");
    if (error.message.includes("401") || error.message.includes("invalid") || error.message.includes("token")) {
      console.log("👉 The WHATSAPP_ACCESS_TOKEN in your .env is invalid or expired.");
      console.log("   Temporary access tokens expire in 24 hours. Generate a Permanent System User Token.");
    } else if (error.message.includes("400") || error.message.includes("phoneId")) {
      console.log("👉 The WHATSAPP_PHONE_ID is invalid. Ensure you are using the Phone Number ID, NOT the Phone Number itself or the Business Account ID.");
    } else {
      console.log("👉 Double check your WHATSAPP_PHONE_ID and WHATSAPP_BUSINESS_ID in your .env file.");
    }
  }
}

runDiagnostics();
