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

const res = await gmail.users.messages.list({
userId: "me",
maxResults: 10,
});

console.log(res.data);

