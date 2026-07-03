import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { fetchEmails } from "./lib/gmail-client.mjs";
import { storeEmail, storeCalendarEvent } from "./lib/gbrain-client.mjs";
import { getTodaysEvents, getUpcomingEvents } from "./lib/calendar-client.mjs";
import { config } from "./config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Email & Calendar Ingestion Pipeline
 * Fetches emails from Gmail (with full body) and calendar events, stores them in GBrain.
 * Also saves a local JSON backup of emails.
 * Runs on a configurable schedule (default: every 30 minutes).
 */

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 10000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runIngestion() {
  console.log(`[${new Date().toISOString()}] Starting email ingestion...`);

  let emails;
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      emails = await fetchEmails(config.ingestion.maxEmails);
      break;
    } catch (err) {
      if (err.message?.includes("auth") || err.code === 401 || err.code === 403) {
        retries++;
        console.error(`Auth error (attempt ${retries}/${MAX_RETRIES}):`, err.message);
        if (retries < MAX_RETRIES) await sleep(RETRY_DELAY_MS);
      } else {
        console.error("Gmail fetch error:", err.message);
        return;
      }
    }
  }

  if (!emails) {
    console.error("Auth failed after all retries. Run: node gmail-auth.mjs");
    return;
  }

  console.log(`Fetched ${emails.length} emails from Gmail.`);

  let stored = 0;
  let skipped = 0;
  let failed = 0;

  for (const email of emails) {
    try {
      const wasStored = storeEmail(email);
      if (wasStored) stored++;
      else skipped++;
    } catch (err) {
      console.error(`Failed to store email ${email.id}:`, err.message);
      failed++;
    }
  }

  console.log(`Done: ${stored} stored, ${skipped} skipped (duplicates), ${failed} failed.`);

  // Local JSON backup
  const today = new Date().toISOString().split("T")[0];
  const dataDir = path.join(__dirname, "data", "messages");
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, `${today}.json`), JSON.stringify(emails, null, 2));
}

/**
 * Calendar Ingestion
 * Fetches today's + upcoming 48h calendar events and stores them in GBrain.
 */
async function runCalendarIngestion() {
  console.log(`[${new Date().toISOString()}] Starting calendar ingestion...`);

  let events = [];
  try {
    const todayEvents = await getTodaysEvents();
    const upcomingEvents = await getUpcomingEvents(48);

    // Merge and deduplicate by event ID
    const seen = new Set();
    for (const e of [...todayEvents, ...upcomingEvents]) {
      if (!seen.has(e.id)) {
        seen.add(e.id);
        events.push(e);
      }
    }
  } catch (err) {
    if (err.message?.includes("auth") || err.code === 401) {
      console.error("Calendar auth error:", err.message);
    } else {
      console.error("Calendar fetch error:", err.message);
    }
    return;
  }

  console.log(`Fetched ${events.length} calendar events.`);

  let stored = 0;
  let skipped = 0;

  for (const event of events) {
    try {
      const wasStored = storeCalendarEvent(event);
      if (wasStored) stored++;
      else skipped++;
    } catch (err) {
      console.error(`Failed to store calendar event ${event.id}:`, err.message);
    }
  }

  console.log(`Calendar: ${stored} stored, ${skipped} skipped (duplicates).`);
}

// Run immediately on start
await runIngestion();
await runCalendarIngestion();

// Schedule recurring runs
const intervalMs = config.ingestion.intervalMinutes * 60 * 1000;
console.log(`Scheduling ingestion every ${config.ingestion.intervalMinutes} minutes.`);
setInterval(async () => {
  await runIngestion();
  await runCalendarIngestion();
}, intervalMs);

