import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { config } from "./config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Helper to sanitize environment variables that might contain outer quotes
function sanitizeEnvJson(val) {
  if (!val) return val;
  let str = val.trim();
  if ((str.startsWith("'") && str.endsWith("'")) || (str.startsWith('"') && str.endsWith('"'))) {
    str = str.substring(1, str.length - 1).trim();
  }
  return str;
}

// 1. Recreate credentials and token files from env if they don't exist (e.g. on Railway)
if (process.env.GMAIL_CREDENTIALS_JSON && !fs.existsSync(path.join(__dirname, "credentials.json"))) {
  const sanitizedCreds = sanitizeEnvJson(process.env.GMAIL_CREDENTIALS_JSON);
  fs.writeFileSync(path.join(__dirname, "credentials.json"), sanitizedCreds, "utf8");
  console.log("📝 Created credentials.json from GMAIL_CREDENTIALS_JSON environment variable.");
}
if (process.env.GMAIL_TOKEN_JSON && !fs.existsSync(path.join(__dirname, "token.json"))) {
  const sanitizedToken = sanitizeEnvJson(process.env.GMAIL_TOKEN_JSON);
  fs.writeFileSync(path.join(__dirname, "token.json"), sanitizedToken, "utf8");
  console.log("📝 Created token.json from GMAIL_TOKEN_JSON environment variable.");
}

const isDocker = fs.existsSync("/.dockerenv") || process.env.RAILWAY_ENVIRONMENT !== undefined;

// 2. OpenClaw config injection (inject Railway environment variables into openclaw.json when in Docker)
try {
  if (isDocker) {
    const homeDir = process.env.HOME || "/root";
    const openclawConfigPath = path.join(homeDir, ".openclaw", "openclaw.json");
    if (fs.existsSync(openclawConfigPath)) {
      console.log("⚙️ Injecting environment variables into openclaw.json...");
      const configStr = fs.readFileSync(openclawConfigPath, "utf8");
      const configJson = JSON.parse(configStr);

      if (!configJson.channels) configJson.channels = {};
      if (!configJson.channels.discord) configJson.channels.discord = {};
      if (!configJson.auth) configJson.auth = {};
      if (!configJson.auth.profiles) configJson.auth.profiles = {};
      if (!configJson.agents) configJson.agents = {};
      if (!configJson.agents.defaults) configJson.agents.defaults = {};

      // Inject Discord token
      if (process.env.DISCORD_TOKEN) {
        configJson.channels.discord.token = process.env.DISCORD_TOKEN;
        configJson.channels.discord.enabled = true;
        console.log("✅ Injected DISCORD_TOKEN into openclaw.json");
      }

      // Inject Telegram token
      if (process.env.TELEGRAM_BOT_TOKEN) {
        if (!configJson.channels.telegram) configJson.channels.telegram = {};
        configJson.channels.telegram.botToken = process.env.TELEGRAM_BOT_TOKEN;
        configJson.channels.telegram.enabled = true;
        console.log("✅ Injected TELEGRAM_BOT_TOKEN into openclaw.json");
      }

      // Inject Gemini API Key
      if (process.env.GEMINI_API_KEY) {
        // Setup Google API profile definition in openclaw.json (without key to prevent schema errors)
        if (!configJson.auth.profiles["google:default"]) {
          configJson.auth.profiles["google:default"] = { mode: "api_key", provider: "google" };
        }
        
        // Write actual key to the internal auth-profiles.json file where OpenClaw expects it
        const authProfilesDir = path.join(homeDir, ".openclaw", "agents", "main", "agent");
        fs.mkdirSync(authProfilesDir, { recursive: true });
        
        const authProfilesPath = path.join(authProfilesDir, "auth-profiles.json");
        const authProfilesJson = {
          version: 1,
          profiles: {
            "google:default": {
              type: "api_key",
              provider: "google",
              key: process.env.GEMINI_API_KEY
            }
          }
        };
        fs.writeFileSync(authProfilesPath, JSON.stringify(authProfilesJson, null, 2), "utf8");
        console.log("✅ Injected GEMINI_API_KEY into OpenClaw auth-profiles.json");
      }

      // Align workspace path with container home directory
      configJson.agents.defaults.workspace = path.join(homeDir, ".openclaw", "workspace");

      fs.writeFileSync(openclawConfigPath, JSON.stringify(configJson, null, 2), "utf8");
      console.log("⚙️ openclaw.json configuration sync complete.");
    } else {
      console.log("⏭️  OpenClaw config file not found at ~/.openclaw/openclaw.json (skipping injection)");
    }
  }
} catch (err) {
  console.error("⚠️ Failed to inject configs into openclaw.json:", err.message);
}

// 3. Auto-initialize or seed GBrain database (clean container launches in Docker)
try {
  if (isDocker) {
    const homeDir = process.env.HOME || "/root";
    const gbrainDbDir = path.join(homeDir, ".gbrain");
    const gbrainDbFile = path.join(gbrainDbDir, "brain.pglite");
    const seedDir = "/usr/src/gbrain-seed";

    if (!fs.existsSync(gbrainDbFile)) {
      const { execSync } = await import("child_process");
      if (fs.existsSync(seedDir)) {
        console.log("🌱 Database is empty. Seeding GBrain database with your local data...");
        fs.mkdirSync(gbrainDbDir, { recursive: true });
        execSync(`cp -R ${seedDir}/* ${gbrainDbDir}/`, { stdio: "inherit" });
        console.log("✅ Seeded database successfully.");
      } else {
        console.log("🗄️ Database not found and seed data missing. Initializing fresh GBrain database...");
        execSync("gbrain init --pglite", { stdio: "inherit" });
        console.log("✅ Fresh GBrain database initialized.");
      }
    }
  }
} catch (err) {
  console.error("⚠️ Failed to initialize/seed GBrain database:", err.message);
}

// 4. Inject GEMINI_API_KEY into gbrain config.json and run diagnostics when in Docker
try {
  if (isDocker) {
    const homeDir = process.env.HOME || "/root";
    const gbrainConfigPath = path.join(homeDir, ".gbrain", "config.json");
    if (fs.existsSync(gbrainConfigPath) && process.env.GEMINI_API_KEY) {
      console.log("⚙️ Injecting GEMINI_API_KEY into gbrain config.json...");
      const configStr = fs.readFileSync(gbrainConfigPath, "utf8");
      const configJson = JSON.parse(configStr);
      configJson.google_api_key = process.env.GEMINI_API_KEY;
      fs.writeFileSync(gbrainConfigPath, JSON.stringify(configJson, null, 2), "utf8");
      console.log("✅ Injected GEMINI_API_KEY into gbrain config.json.");
    }

    // Run diagnostics to debug the PGlite initialization failure
    console.log("🩺 Running gbrain doctor diagnostics inside container...");
    try {
      const { execSync } = await import("child_process");
      execSync("gbrain doctor", { stdio: "inherit" });
    } catch (docErr) {
      console.error("❌ gbrain doctor command failed:", docErr.message);
    }
  }
} catch (err) {
  console.error("⚠️ Failed to inject API key or run diagnostics:", err.message);
}

console.log("🚀 Personal AI Assistant — Starting services...\n");

const processes = [];

function spawnProcess(name, file, env = {}) {
  const proc = spawn("node", [path.join(__dirname, file)], {
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
  proc.on("error", (err) => console.error(`[${name}] Error:`, err.message));
  proc.on("exit", (code) => {
    if (code !== 0) console.error(`[${name}] Exited with code ${code}`);
  });
  processes.push(proc);
  console.log(`✅ Started: ${name}`);
  return proc;
}

// Always start the Discord bot
spawnProcess("Discord Bot", "discord-bot.mjs");

// Always start the ingestion pipeline
spawnProcess("Email Ingestion", "ingestion-pipeline.mjs");

// Start WhatsApp webhook only if access token is configured
if (config.whatsapp.accessToken) {
  spawnProcess("WhatsApp Webhook", "whatsapp-webhook.mjs");
} else {
  console.log("⏭️  WhatsApp webhook skipped (WHATSAPP_ACCESS_TOKEN not set)");
}

// Start OpenClaw Gateway on Linux/Railway only when running in Docker
try {
  if (isDocker) {
    console.log("🟢 Starting OpenClaw Gateway...");
    const openclawProc = spawn("openclaw", ["gateway", "run", "--force"], {
      stdio: "inherit",
      env: { ...process.env },
    });
    openclawProc.on("error", (err) => console.error("[OpenClaw Gateway] Error:", err.message));
    openclawProc.on("exit", (code) => {
      if (code !== 0) console.error(`[OpenClaw Gateway] Exited with code ${code}`);
    });
    processes.push(openclawProc);
  }
} catch (err) {
  console.error("⚠️ Failed to launch OpenClaw Gateway:", err.message);
}

console.log("");

// Graceful shutdown
function shutdown() {
  console.log("\n🛑 Shutting down all services...");
  for (const proc of processes) {
    proc.kill("SIGTERM");
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
