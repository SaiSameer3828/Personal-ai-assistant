import fs from "fs";

const today = new Date().toISOString().split("T")[0];
const digestFile = `./data/digests/${today}.md`;

if (!fs.existsSync(digestFile)) {
  console.log("No digest found");
  process.exit(1);
}

const digest = fs.readFileSync(digestFile, "utf8");

console.log(digest);
