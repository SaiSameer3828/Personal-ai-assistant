import { crossSourceSearch } from "../agents/memory-agent.mjs";

async function run() {
  const query = "What was decided in the Project Nova meeting and what are the action items for David and Charlie?";
  console.log(`🔍 Querying Memory Agent: "${query}"\n`);
  
  try {
    const answer = await crossSourceSearch(query);
    console.log("--- Answer from Memory Agent ---");
    console.log(answer);
    console.log("---------------------------------");
  } catch (err) {
    console.error("Error running query test:", err.message);
  }
}

run();
