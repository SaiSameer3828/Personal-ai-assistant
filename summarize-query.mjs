import { execSync } from "child_process";

const query = process.argv.slice(2).join(" ");

const result = execSync(
  `gbrain query "${query}"`,
  { encoding: "utf8" }
);

console.log("=== SEARCH RESULTS ===");
console.log(result);
