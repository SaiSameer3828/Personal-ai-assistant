import { processCommand } from "../agents/orchestrator.mjs";

async function run() {
  const query = "What is the summary of last mail";
  console.log(`Running processCommand('${query}')...`);
  try {
    const res = await processCommand(query);
    console.log("\n--- RESPONSE ---");
    console.log(res);
    console.log("----------------\n");
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
