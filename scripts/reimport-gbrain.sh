#!/bin/bash
# Re-import emails into GBrain without embeddings (uses FTS for search)
export PATH=$HOME/.bun/bin:/usr/bin:/bin:$PATH
export GOOGLE_GENERATIVE_AI_API_KEY=$(python3 -c "import json, os; f=open(os.path.expanduser('~/.openclaw/agents/main/agent/auth-profiles.json')); d=json.load(f); print(d['profiles']['google:default']['key'])")

echo "Importing emails from OpenClaw memory into GBrain (no-embed mode)..."

gbrain import ~/.openclaw/workspace/memory/ --no-embed 2>&1

echo ""
echo "Done!"
gbrain stats
