import fs from "fs";

const cmd = process.argv[2];

if (cmd === "collect") {
  const today = new Date().toISOString().split("T")[0];

  const sampleMail = {
    id: Date.now(),
    from: "test@example.com",
    subject: "Test Email",
    date: new Date().toISOString()
  };

  fs.writeFileSync(
    `data/messages/${today}.json`,
    JSON.stringify([sampleMail], null, 2)
  );

  console.log("Sample email collected.");
}

else if (cmd === "digest") {
  const today = new Date().toISOString().split("T")[0];
  const messages = JSON.parse(
    fs.readFileSync(`data/messages/${today}.json`, "utf8")
  );

  let md = `# Email Digest\n\n`;

  messages.forEach(m => {
    md += `- **${m.subject}** from ${m.from}\n`;
  });

  fs.writeFileSync(`data/digests/${today}.md`, md);

  console.log("Digest generated.");
}

else {
  console.log("Usage:");
  console.log("node email-collector.mjs collect");
  console.log("node email-collector.mjs digest");
}
