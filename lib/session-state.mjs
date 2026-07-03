import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "../data");
const stateFile = path.join(dataDir, "session_state.json");
const alertsFile = path.join(dataDir, "sent_alerts.json");

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

/**
 * Get the current active session/prompt state.
 * @returns {object}
 */
export function getSessionState() {
  try {
    if (fs.existsSync(stateFile)) {
      const data = fs.readFileSync(stateFile, "utf8");
      return JSON.parse(data) || {};
    }
  } catch (err) {
    console.error("Failed to read session state:", err.message);
  }
  return {};
}

/**
 * Update the active session/prompt state.
 * @param {object} state
 */
export function setSessionState(state) {
  try {
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to write session state:", err.message);
  }
}

/**
 * Clear the active session/prompt state.
 */
export function clearSessionState() {
  setSessionState({});
}

/**
 * Check if a meeting alert has already been sent to avoid duplicates.
 * @param {string} eventId - Unique calendar event ID
 * @returns {boolean}
 */
export function hasAlertBeenSent(eventId) {
  try {
    if (fs.existsSync(alertsFile)) {
      const data = fs.readFileSync(alertsFile, "utf8");
      const alerts = JSON.parse(data) || [];
      return alerts.includes(eventId);
    }
  } catch (err) {
    console.error("Failed to read sent alerts cache:", err.message);
  }
  return false;
}

/**
 * Mark a meeting event ID as alerted.
 * @param {string} eventId - Unique calendar event ID
 */
export function markAlertAsSent(eventId) {
  try {
    let alerts = [];
    if (fs.existsSync(alertsFile)) {
      const data = fs.readFileSync(alertsFile, "utf8");
      alerts = JSON.parse(data) || [];
    }
    if (!alerts.includes(eventId)) {
      alerts.push(eventId);
      // Keep cache size sane (max 500 entries)
      if (alerts.length > 500) {
        alerts.shift();
      }
      fs.writeFileSync(alertsFile, JSON.stringify(alerts, null, 2), "utf8");
    }
  } catch (err) {
    console.error("Failed to write sent alerts cache:", err.message);
  }
}
