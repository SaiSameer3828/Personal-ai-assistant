import fs from "fs";
import readline from "readline";
import { google } from "googleapis";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/calendar.readonly"
];

if (!fs.existsSync("credentials.json")) {
  console.error("Error: credentials.json not found.");
  process.exit(1);
}

const credentials = JSON.parse(fs.readFileSync("credentials.json"));
const { client_id, client_secret, redirect_uris } = credentials.installed;
const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
  prompt: "consent"
});

console.log("-----------------------------------------");
console.log("Authorize this app by visiting this url:");
console.log(authUrl);
console.log("-----------------------------------------");

fs.writeFileSync("scratch/auth_url.txt", authUrl, "utf8");
console.log("URL written to scratch/auth_url.txt");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Enter the code from that page (or paste the redirect URL): ", async (codeOrUrl) => {
  let code = codeOrUrl.trim();
  if (code.includes("code=")) {
    try {
      const parsedUrl = new URL(code);
      code = parsedUrl.searchParams.get("code") || code;
    } catch (e) {
      if (code.includes("?")) {
        const urlParams = new URLSearchParams(code.split("?")[1]);
        code = urlParams.get("code") || code;
      }
    }
  }
  
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    fs.writeFileSync("token.json", JSON.stringify(tokens, null, 2), "utf8");
    console.log("✅ Token saved to token.json");
  } catch (err) {
    console.error("Error retrieving access token:", err.message);
  }
  rl.close();
});
