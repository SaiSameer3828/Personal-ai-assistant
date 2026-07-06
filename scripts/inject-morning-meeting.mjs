import { storeDocument } from "../lib/gbrain-client.mjs";

const meetingId = `meeting-morning-sync-${Date.now()}`;

const metadata = {
  title: "Personal AI Assistant - Daily Morning Sync",
  date: new Date().toISOString(),
  platform: "Google Meet",
  participants: "Anil, Radesh, Sameer",
  duration: "30 minutes",
};

const analysis = {
  summary: "The team held a 30-minute daily morning sync to check progress on the Personal AI Assistant. Sameer reported successful integration and testing of the WhatsApp webhook on port 3002, including verifying the callback token. Radesh reported resolving the PGlite database lock issues in container runtimes and confirming native Postgres schema initialization. Anil (Manager) reviewed their status, reminded Sameer to verify the OAuth token files, and tasked Radesh with monitoring memory usage on Railway.",
  actionItems: [
    "Sameer: Test email ingestion reliability and verify the OAuth token.json file in the deployment.",
    "Radesh: Monitor Railway container logs for any memory spikes or Gemini rate limits."
  ],
  decisions: [
    "Confirmed WhatsApp integration is stable and ready for end-user testing.",
    "Approved transition of all database logging to production Postgres."
  ],
  topics: [
    "WhatsApp Webhook Status",
    "Database Deployment & PGlite Locks",
    "Deployment Verification & Next Tasks"
  ],
  keyPoints: "Sameer finished setting up and testing the WhatsApp webhook. Radesh resolved the database connection lockups on Railway. Anil approved the progress and outlined testing priorities.",
  followUps: [
    "Sameer to demo WhatsApp messaging flow in the next sync.",
    "Radesh to present a brief report on container memory stability."
  ]
};

const transcript = `[00:00:05] Anil: Good morning, team. Let's start our daily sync. Sameer, let's hear from you first. What's the status of the WhatsApp webhook?
[00:01:10] Sameer: Morning, Anil. The WhatsApp webhook is fully running. I successfully configured the Meta Developer Console, tested the verification token 'personal_ai_assistant_verify', and verified that messages are correctly received on port 3002. It's successfully saving messages to GBrain.
[00:03:00] Anil: That's great to hear. Have you tested it with actual incoming queries?
[00:04:15] Sameer: Yes, I sent a couple of test messages. GStack successfully parsed the intent and replied using the new Gemini key. Next, I'm going to double-check the email ingestion flow to ensure the OAuth token.json is active in our build.
[00:06:30] Anil: Excellent progress, Sameer. Radesh, what about the database lock issues we talked about yesterday?
[00:07:50] Radesh: Hi Anil. The database locks are fully resolved. I verified that using native PostgreSQL instead of PGlite completely removes the WASM memory security alerts. The schema initialization ran successfully, and the pipeline has been storing new events with zero errors.
[00:10:45] Anil: Great. What are you focusing on next, Radesh?
[00:12:00] Radesh: I'll be monitoring the container logs on Railway for the next few hours to ensure there are no memory leaks or sudden API rate limits.
[00:14:30] Anil: Perfect. So Sameer is on email ingestion verification, and Radesh is on container stability monitoring. Let's make sure we document these updates so that our assistant can query them if we need a summary later. Thanks, team. Let's sync up tomorrow.
[00:16:15] Sameer: Thanks, Anil.
[00:16:40] Radesh: Thanks, talk to you tomorrow.`;

const content = `# Meeting: ${metadata.title}

**Date:** ${metadata.date}
**Platform:** ${metadata.platform}
**Participants:** ${metadata.participants}
**Duration:** ${metadata.duration}

## Summary
${analysis.summary}

## Action Items
${analysis.actionItems.map((item, i) => `${i + 1}. ${item}`).join("\n")}

## Decisions Made
${analysis.decisions.map((d, i) => `${i + 1}. ${d}`).join("\n")}

## Topics Discussed
${analysis.topics.map(t => `- ${t}`).join("\n")}

## Key Points
${analysis.keyPoints}

## Follow-ups for Next Meeting
${analysis.followUps.map(f => `- ${f}`).join("\n")}

## Raw Transcript
${transcript}

---
_Source: Meeting Recording | Platform: ${metadata.platform} | ID: ${meetingId}_
`;

try {
  console.log("Injecting morning sync meeting into GBrain...");
  const success = storeDocument(meetingId, content);
  if (success) {
    console.log(`\n✅ Successfully injected meeting with ID: ${meetingId}`);
  } else {
    console.error("❌ Failed to inject meeting into GBrain.");
    process.exit(1);
  }
} catch (err) {
  console.error("Error during injection:", err.message);
  process.exit(1);
}
