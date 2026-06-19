import fs from "fs";

const today = new Date().toISOString().split("T")[0];

const emails = JSON.parse(
fs.readFileSync(`./data/messages/${today}.json`)
);

let digest = `# Email Digest - ${today}\n\n`;

for (const email of emails.slice(0, 10)) {
digest += `## ${email.subject}\n`;
digest += `From: ${email.from}\n`;
digest += `Summary: ${email.snippet}\n\n`;
}

fs.mkdirSync("./data/digests", { recursive: true });

const digestFile = `./data/digests/${today}.md`;

fs.writeFileSync(digestFile, digest);

console.log(`Digest saved to ${digestFile}`);
