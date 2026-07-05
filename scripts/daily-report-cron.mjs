#!/usr/bin/env node
/**
 * Daily Report - Scheduled delivery to Discord at 8 AM.
 * Run via cron: 0 8 * * * cd /mnt/c/Users/botsa/email-collector && node scripts/daily-report-cron.mjs
 */

import { execSync } from "child_process";
import os from "os";
import path from "path";
import { getDailyReport } from "../agents/summary-agent.mjs";
import { config } from "../config.mjs";

const CHANNEL_ID = config.discord.channelId || "1516680999772094617";

async function sendDiscordMessage(channelId, text) {
  const token = config.discord.token;
  if (!token) {
    throw new Error("DISCORD_TOKEN not set in environment configuration");
  }

  // Split message into 2000-character chunks for Discord's limits
  const chunks = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= 2000) {
      chunks.push(remaining);
      break;
    }
    let splitIndex = remaining.lastIndexOf("\n", 2000);
    if (splitIndex === -1 || splitIndex < 1000) {
      splitIndex = remaining.lastIndexOf(" ", 2000);
    }
    if (splitIndex === -1) {
      splitIndex = 2000;
    }
    chunks.push(remaining.substring(0, splitIndex));
    remaining = remaining.substring(splitIndex).trimStart();
  }

  for (const chunk of chunks) {
    const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bot ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content: chunk }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Discord API error (${res.status}): ${errText}`);
    }
  }
}

async function sendDailyReport() {
  console.log(`[${new Date().toISOString()}] Generating daily report...`);

  try {
    const report = await getDailyReport();

    if (config.discord.token) {
      console.log("Directly sending daily report to Discord via REST API...");
      await sendDiscordMessage(CHANNEL_ID, report);
    } else {
      console.log("DISCORD_TOKEN not set. Falling back to OpenClaw CLI...");
      const escaped = report.replace(/"/g, '\\"').replace(/\n/g, '\\n');
      const wslHomeDir = os.homedir();
      const bunBinPath = path.join(wslHomeDir, ".bun", "bin");
      execSync(
        `npx openclaw message send --channel discord --target "channel:${CHANNEL_ID}" --message "${escaped}"`,
        {
          stdio: "inherit",
          timeout: 15000,
          env: { ...process.env, PATH: `${bunBinPath}:/usr/bin:/bin:${process.env.PATH || ""}` },
        }
      );
    }

    console.log("✅ Daily report sent to Discord");
  } catch (err) {
    console.error("Failed to send daily report:", err.message);

    // Fallback: try a simpler message
    try {
      if (config.discord.token) {
        await sendDiscordMessage(CHANNEL_ID, "⚠️ Daily report generation failed. Ask me 'give me my daily report' to try manually.");
      } else {
        execSync(
          `openclaw message send --channel discord --target "channel:${CHANNEL_ID}" --message "⚠️ Daily report generation failed. Ask me 'give me my daily report' to try manually."`,
          { stdio: "ignore", timeout: 10000 }
        );
      }
    } catch {}
  }
}

await sendDailyReport();
