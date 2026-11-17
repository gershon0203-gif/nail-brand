import json, time, urllib.request, websocket

targets = json.load(urllib.request.urlopen("http://127.0.0.1:9222/json"))
t = [x for x in targets if x.get("type") == "page" and str(x.get("url", "")).startswith("http://localhost:5173/")][0]
w = websocket.create_connection(t["webSocketDebuggerUrl"], timeout=20, suppress_origin=True)
i = 0

def send(m, p=None):
    global i
    i += 1
    w.send(json.dumps({"id": i, "method": m, "params": p or {}}))

send("Network.enable")
send("Page.enable")
send("Page.navigate", {"url": "http://localhost:5173/"})
bad = []
end = time.time() + 8
while time.time() < end:
    try:
        msg = json.loads(w.recv())
    except Exception:
        continue
    if msg.get("method") == "Network.responseReceived":
        r = msg["params"]["response"]
        if r.get("status", 0) >= 400:
            bad.append({"status": r["status"], "url": r["url"]})
print(json.dumps(bad, indent=2))
w.close()
