import { execSync } from "child_process";

const query = process.argv.slice(2).join(" ");

if (!query) {
console.log("Usage: node workflow-email-agent.mjs <query>");
process.exit(1);
}

console.log("🔎 Searching GBrain...\n");

const results = execSync(
`gbrain query "${query}"`,
{ encoding: "utf8" }
);

const lines = results
.split("\n")
.filter(line => line.includes("Subject:"))
.slice(0, 5);

console.log("📧 Top Relevant Emails\n");

if (lines.length === 0) {
console.log("No matching emails found.");
} else {
lines.forEach((line, index) => {
console.log(`${index + 1}. ${line}`);
});
}
