import { execSync } from "child_process";

const query = process.argv.slice(2).join(" ");

console.log("Searching GBrain...");

const result = execSync(
  `gbrain query "${query}"`,
  { encoding: "utf8" }
);

console.log("\nTop Results:\n");
console.log(result);

