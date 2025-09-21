import json, os, re, base64, hashlib, pathlib

HAR_FILE = "legacy.piazza.com.har"
OUT_DIR  = "styles/raw"        # will create if missing

os.makedirs(OUT_DIR, exist_ok=True)

with open(HAR_FILE, "r", encoding="utf-8") as f:
    har = json.load(f)

entries = har.get("log", {}).get("entries", [])
css_entries = []
for e in entries:
    resp = e.get("response", {})
    mime = (resp.get("content", {}) or {}).get("mimeType", "") or resp.get("content", {}).get("type", "")
    url  = e.get("request", {}).get("url", "")
    if "text/css" in mime or url.endswith(".css"):
        css_entries.append(e)

# Keep network order (important!)
def started_dt(e): return e.get("startedDateTime","")
css_entries.sort(key=started_dt)

# Write files; dedupe by sha256
seen = set()
written = []
for i, e in enumerate(css_entries, 1):
    url = e["request"]["url"]
    cont = e["response"]["content"]
    text = cont.get("text", "")
    if not text:
        print(f"[skip-empty] {url}")
        continue
    if cont.get("encoding") == "base64":
        text = base64.b64decode(text).decode("utf-8", errors="ignore")

    # remove sourcemap comment (optional)
    text = re.sub(r"/\*#\s*sourceMappingURL=.*?\*/\s*$", "", text.strip())

    h = hashlib.sha256(text.encode("utf-8")).hexdigest()[:12]
    if h in seen:
        print(f"[dedupe] {url}")
        continue
    seen.add(h)

    # filename
    name = url.split("/")[-1].split("?")[0] or f"bundle{i}.css"
    safe = re.sub(r"[^a-zA-Z0-9._-]", "_", name)
    out  = os.path.join(OUT_DIR, f"{i:03d}-{safe}")
    with open(out, "w", encoding="utf-8") as w:
        w.write(text)
    written.append(out)
    print(f"[write] {out}  <-- {url}")

print("\nWrote CSS files (network order):")
for p in written: print(" -", p)
print(f"\nTotal unique CSS: {len(written)}")
