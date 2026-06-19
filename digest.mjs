import fs from "fs";

const today = new Date().toISOString().split("T")[0];

const emails = JSON.parse(
fs.readFileSync(`./data/messages/${today}.json`)
);

const actionRequired = [];
const important = [];
const promotions = [];

for (const email of emails) {
const subject = (email.subject || "").toLowerCase();
const from = (email.from || "").toLowerCase();

if (
subject.includes("verify") ||
subject.includes("action") ||
subject.includes("important") ||
subject.includes("security") ||
subject.includes("alert")
) {
actionRequired.push(email);
} else if (
from.includes("newsletter") ||
from.includes("marketing") ||
subject.includes("sale") ||
subject.includes("discount")
) {
promotions.push(email);
} else {
important.push(email);
}
}

let digest = `# Smart Email Digest - ${today}\n\n`;

digest += `## 🔥 Action Required\n\n`;
for (const email of actionRequired.slice(0, 10)) {
digest += `- ${email.subject} (${email.from})\n`;
}

digest += `\n## 📧 Important Emails\n\n`;
for (const email of important.slice(0, 10)) {
digest += `- ${email.subject} (${email.from})\n`;
}

digest += `\n## 📰 Promotions & Newsletters\n\n`;
for (const email of promotions.slice(0, 10)) {
digest += `- ${email.subject} (${email.from})\n`;
}

fs.mkdirSync("./data/digests", { recursive: true });

const digestFile = `./data/digests/${today}.md`;

fs.writeFileSync(digestFile, digest);

console.log(`Smart digest saved to ${digestFile}`);

