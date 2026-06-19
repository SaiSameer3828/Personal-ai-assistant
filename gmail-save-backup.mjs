import fs from "fs";
import { google } from "googleapis";

const token = JSON.parse(fs.readFileSync("token.json"));

const credentials = JSON.parse(
  fs.readFileSync("credentials.json")
);

const { client_id, client_secret } =
  credentials.installed;

const auth = new google.auth.OAuth2(
  client_id,
  client_secret,
  "http://localhost"
);

auth.setCredentials(token);

const gmail = google.gmail({
version: "v1",
auth,
});

const list = await gmail.users.messages.list({
userId: "me",
maxResults: 20,
});

const emails = [];

for (const msg of list.data.messages || []) {
const details = await gmail.users.messages.get({
userId: "me",
id: msg.id,
});

const headers = details.data.payload.headers || [];

const subject =
headers.find(h => h.name === "Subject")?.value || "";

const from =
headers.find(h => h.name === "From")?.value || "";

const date =
headers.find(h => h.name === "Date")?.value || "";

emails.push({
id: msg.id,
from,
subject,
date,
snippet: details.data.snippet || ""
});
}
const today = new Date().toISOString().split("T")[0];

fs.mkdirSync("./data/messages", { recursive: true });

const fileName = `./data/messages/${today}.json`;

fs.writeFileSync(
fileName,
JSON.stringify(emails, null, 2)
);

console.log(`Saved ${emails.length} emails to ${fileName}`);
