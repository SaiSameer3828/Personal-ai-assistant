import { execSync } from "child_process";

const query = process.argv.slice(2).join(" ");

if (!query) {
  console.log("Usage: node query-emails.mjs <query>");
  process.exit(1);
}

const result = execSync(
  `gbrain query "${query}"`,
  { encoding: "utf8" }
);

console.log(result);
