import fs from "fs";
import { spawnSync } from "child_process";

const CHANNEL_ID = "1516680999772094617";

const today = new Date().toISOString().split("T")[0];
const digestFile = `./data/digests/${today}.md`;

if (!fs.existsSync(digestFile)) {
console.log("No digest found.");
process.exit(1);
}

const digest = fs.readFileSync(
digestFile,
"utf8"
);

spawnSync(
"openclaw",
[
"message",
"send",
"--channel",
"discord",
"--target",
`channel:${CHANNEL_ID}`,
"--message",
digest
],
{
stdio: "inherit"
}
);

console.log("✅ Digest sent to Discord");

