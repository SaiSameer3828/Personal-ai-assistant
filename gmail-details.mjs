import fs from "fs";
import { google } from "googleapis";

const credentials = JSON.parse(
fs.readFileSync("credentials.json")
);

const token = JSON.parse(
fs.readFileSync("token.json")
);

const { client_id, client_secret, redirect_uris } =
credentials.installed;

const auth = new google.auth.OAuth2(
client_id,
client_secret,
redirect_uris[0]
);

auth.setCredentials(token);

const gmail = google.gmail({
version: "v1",
auth,
});

const list = await gmail.users.messages.list({
userId: "me",
maxResults: 5,
});

for (const msg of list.data.messages || []) {
const details = await gmail.users.messages.get({
userId: "me",
id: msg.id,
});

const headers = details.data.payload.headers || [];

const subject =
headers.find(h => h.name === "Subject")?.value ||
"(No Subject)";

const from =
headers.find(h => h.name === "From")?.value ||
"(Unknown Sender)";

console.log("\n=================");
console.log("FROM:", from);
console.log("SUBJECT:", subject);
console.log("SNIPPET:", details.data.snippet);
}

