import { analyzeMeeting } from "../lib/meeting-summarizer.mjs";
import { storeDocument } from "../lib/gbrain-client.mjs";

const transcript = `
Alice: Hi everyone, thanks for joining. Today we are focusing on the Project Nova launch preparations. We are currently scheduled to launch on August 1st. I want to check in on everyone's status. Bob, let's start with development.
Bob: Sure, Alice. Development-wise, the core features of Project Nova are 95% complete. We are currently optimizing the website landing page to improve loading speed, targeting under 1.5 seconds. The only risk is the integration of the payment gateway, which is taking a bit longer than expected.
Alice: Okay, thanks Bob. David, where do we stand on the design assets for the landing page?
David: The design mockups for the landing page are ready. I just need to export the final high-resolution assets and hand them over to Bob. I'll get that done by end of day today.
Charlie: From marketing, we are finalizing the email marketing campaigns. We plan to send the first teaser email on July 10th. I've drafted the email copy, but I need Eva to approve the promotional budget before we can set up the campaign.
Eva: That brings us to budget. We have a slight budget constraint of $5,000 for the initial launch phase, specifically for paid search ads. We must keep paid marketing expenses under this limit. Charlie, I need a detailed cost breakdown of the campaign before I can sign off.
Charlie: Understood, Eva. I'll compile that cost breakdown and email it to you by tomorrow morning.
Alice: Great. Let's make some decisions. Do we agree to lock the launch date for August 1st?
Bob: Yes, that is feasible from dev.
Charlie: Yes, fits the marketing schedule.
Eva: Yes, budget is allocated for that timeline.
Alice: Great, launch date is locked for August 1st. Also, let's decide to prioritize the payment gateway integration as a blocker. Bob, please focus on that first.
Bob: Got it, will do.
Alice: Excellent. To summarize the action items: David will send landing page design assets to Bob by end of day. Charlie will send the marketing campaign cost breakdown to Eva by tomorrow morning. Bob will prioritize payment gateway integration and keep us updated daily. Eva will review the cost breakdown and approve the budget once received.
Eva: Sounds good to me.
Alice: Perfect, let's meet again next Friday for our weekly sync. Thanks, everyone!
`;

const metadata = {
  title: "Project Nova Launch Prep Weekly Sync",
  participants: "Alice, Bob, Charlie, David, Eva",
  platform: "Google Meet",
  date: "2026-07-03T10:00:00Z",
  duration: "30 minutes"
};

async function run() {
  console.log("🚀 Starting dummy meeting ingestion...");
  
  try {
    console.log("Analyzing transcript with Gemini...");
    const analysis = await analyzeMeeting(transcript, metadata);
    
    console.log("Structuring meeting document...");
    const meetingId = `meeting-dummy-nova-101`;
    const title = metadata.title;
    const date = metadata.date;
    const platform = metadata.platform;
    const participants = metadata.participants;
    
    const content = `# Meeting: ${title}

**Date:** ${date}
**Platform:** ${platform}
**Participants:** ${participants}
**Duration:** ${metadata.duration}

## Summary
${analysis.summary || "No summary generated"}

## Action Items
${(analysis.actionItems || []).map((item, i) => `${i + 1}. ${item}`).join("\n") || "None identified"}

## Decisions Made
${(analysis.decisions || []).map((d, i) => `${i + 1}. ${d}`).join("\n") || "None recorded"}

## Topics Discussed
${(analysis.topics || []).map(t => `- ${t}`).join("\n") || "Not available"}

## Key Points
${analysis.keyPoints || "Not available"}

## Follow-ups for Next Meeting
${(analysis.followUps || []).map(f => `- ${f}`).join("\n") || "None"}

## Raw Transcript
${transcript.trim()}

---
_Source: Meeting Recording | Platform: ${platform} | ID: ${meetingId}_
`;

    console.log("Storing meeting summary in GBrain...");
    const stored = storeDocument(meetingId, content);
    
    if (stored) {
      console.log(`✅ Stored successfully in GBrain with ID: ${meetingId}`);
      console.log("\n--- Preview of Stored Summary ---");
      console.log(content);
    } else {
      console.error("❌ Failed to store document in GBrain.");
    }
  } catch (err) {
    console.error("Error during ingestion:", err.message);
  }
}

run();
