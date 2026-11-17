"""Read-only check: fetch PostgREST OpenAPI document and list exposed RPC functions.
No function is executed. Values of keys are never printed.
"""
import json, os, urllib.request, urllib.error

env = {}
root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
for line in open(os.path.join(root, ".env"), encoding="utf-8"):
    if "=" in line and not line.strip().startswith("#"):
        k, v = line.strip().split("=", 1)
        env[k.strip()] = v.strip()

base = env["VITE_SUPABASE_URL"].rstrip("/")
key = env["VITE_SUPABASE_ANON_KEY"]
req = urllib.request.Request(
    base + "/rest/v1/",
    headers={
        "apikey": key,
        "Authorization": "Bearer " + key,
        "Accept": "application/openapi+json",
    },
)
try:
    with urllib.request.urlopen(req, timeout=20) as r:
        doc = json.load(r)
except urllib.error.HTTPError as e:
    print("HTTP error fetching OpenAPI:", e.code)
    raise SystemExit(0)

paths = sorted(p for p in doc.get("paths", {}) if "/rpc/" in p)
print("EXPOSED RPC FUNCTIONS (from read-only OpenAPI document):")
for p in paths:
    print("  ", p.replace("/rpc/", ""))
print("\ncreate_order_from_cart exposed:", "/rpc/create_order_from_cart" in paths)
print("add_to_cart exposed:", "/rpc/add_to_cart" in paths)
print("get_cart_count exposed:", "/rpc/get_cart_count" in paths)
print("set_stock exposed:", "/rpc/set_stock" in paths)
print("admin_dashboard_stats exposed:", "/rpc/admin_dashboard_stats" in paths)

# Read-only: which tables are exposed in the schema?
tables = sorted(p.strip("/") for p in doc.get("paths", {}) if not p.startswith("/rpc") and p != "/")
print("\nEXPOSED TABLE ENDPOINTS:")
for t in tables:
    print("  ", t)
