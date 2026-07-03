import json
import os

path = os.path.expanduser("~/.openclaw/openclaw.json")
if not os.path.exists(path):
    print(f"Error: {path} not found.")
    exit(1)

with open(path, "r") as f:
    cfg = json.load(f)

cfg["channels"]["telegram"]["botToken"] = "8895190371:AAF_VkgNS49gnO7zwThMgMgpTTFlJlfP_e4"
cfg["channels"]["telegram"]["enabled"] = True

with open(path, "w") as f:
    json.dump(cfg, f, indent=2)

print("✅ Telegram token updated in ~/.openclaw/openclaw.json")
