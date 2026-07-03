import { parseIntent } from "../lib/gemini-client.mjs";

async function run() {
  const message = "What is the summary of last mail";
  const parsed = await parseIntent(message);
  console.log("Parsed intent:", JSON.stringify(parsed, null, 2));
}

run();
