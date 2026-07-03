import { getSessionState, clearSessionState, hasAlertBeenSent, markAlertAsSent, setSessionState } from "../lib/session-state.mjs";
import { processCommand } from "../agents/orchestrator.mjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const alertsFile = path.join(__dirname, "../data/sent_alerts.json");

// Helper to simulate meeting alert trigger
function simulateAlertTrigger(eventId, title, startOffsetMinutes) {
  const start = new Date(Date.now() + startOffsetMinutes * 60 * 1000);
  
  if (hasAlertBeenSent(eventId)) {
    console.log(`Alert already sent for ${title}. Skipped.`);
    return false;
  }
  
  markAlertAsSent(eventId);
  
  setSessionState({
    activePrompt: {
      type: "meeting_prep_confirm",
      target: title,
      timestamp: Date.now()
    }
  });
  
  const startTimeStr = start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  console.log(`\n⏰ [SIMULATED ALERT] "${title}" starts in ${startOffsetMinutes} mins (at ${startTimeStr}).`);
  console.log("Prompting user: Would you like me to prepare a meeting brief for you?\n");
  return true;
}

async function run() {
  // Clear state and caches
  clearSessionState();
  if (fs.existsSync(alertsFile)) {
    try { fs.unlinkSync(alertsFile); } catch {}
  }

  console.log("--- Test Case 1: Triggering automated alert ---");
  const eventId = "test-alert-event-101";
  const title = "Project Nova";
  
  simulateAlertTrigger(eventId, title, 45);
  
  let state = getSessionState();
  console.log("Current active session prompt state:", JSON.stringify(state, null, 2));

  console.log("\n--- Test Case 2: User declines ('No') ---");
  let response = await processCommand("No");
  console.log("User: No");
  console.log("Agent:", response);
  console.log("State after decline:", JSON.stringify(getSessionState(), null, 2));

  console.log("\n--- Test Case 3: Trigger alert again and User accepts ('Yes') ---");
  // Clean alert cache for same event to re-trigger
  if (fs.existsSync(alertsFile)) {
    try { fs.unlinkSync(alertsFile); } catch {}
  }
  
  simulateAlertTrigger(eventId, title, 30);
  
  console.log("User: Yes");
  response = await processCommand("Yes");
  console.log("Agent response:\n", response);
  console.log("State after accept:", JSON.stringify(getSessionState(), null, 2));
}

run().catch(console.error);
