"""
Responsive audit using CDP viewport emulation on the REAL connected device.
Labels in the report must state this is emulation on-device, not physical
rotation/resize. Physical device viewport measured separately (391 CSS px).
"""
import base64, json, os, time, urllib.request, websocket

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SHOTS = os.path.join(ROOT, "reports", "screenshots", "responsive")
os.makedirs(SHOTS, exist_ok=True)
CDP = "http://127.0.0.1:9222"

targets = json.load(urllib.request.urlopen(CDP + "/json"))
t = [x for x in targets if x.get("type") == "page" and str(x.get("url", "")).startswith("http://localhost:5173/")][0]
w = websocket.create_connection(t["webSocketDebuggerUrl"], timeout=30, suppress_origin=True)
n = 0

def send(method, params=None):
    global n
    n += 1
    mid = n
    w.send(json.dumps({"id": mid, "method": method, "params": params or {}}))
    deadline = time.time() + 30
    while time.time() < deadline:
        try:
            msg = json.loads(w.recv())
        except Exception:
            continue
        if msg.get("id") == mid:
            if "error" in msg:
                raise RuntimeError(str(msg["error"]))
            return msg.get("result", {})
    raise TimeoutError(method)

def ev(expr):
    r = send("Runtime.evaluate", {"expression": expr, "returnByValue": True, "awaitPromise": True})
    return r.get("result", {}).get("value")

JS = """(() => {
  const vw=window.innerWidth;
  const cards=[...document.querySelectorAll('article')];
  const lefts=[...new Set(cards.map(c=>Math.round(c.getBoundingClientRect().left)))];
  const bad=[...document.querySelectorAll('body *')].filter(e=>{
    const r=e.getBoundingClientRect();
    return r.width>0 && r.right>vw+2 && getComputedStyle(e).position!=='fixed'
      && !e.closest('[aria-hidden="true"]');
  }).slice(0,5).map(e=>({tag:e.tagName,cls:(e.className||'').toString().slice(0,60),right:Math.round(e.getBoundingClientRect().right)}));
  return {innerWidth:vw, scrollWidth:document.documentElement.scrollWidth,
          overflowX:document.documentElement.scrollWidth>vw+1,
          gridColumns:lefts.length||null, cardCount:cards.length, badElements:bad,
          textVisible:document.body.innerText.length};
})()"""

WIDTHS = [360, 375, 390, 430, 768, 1024, 1440]
PAGES = ["/", "/products", "/products/classic-stoneware-mug-sand-1", "/cart", "/login"]
out = {"deviceEmulation": True, "results": []}

send("Page.enable")
for width in WIDTHS:
    send("Emulation.setDeviceMetricsOverride", {
        "width": width, "height": 800, "deviceScaleFactor": 2, "mobile": width < 768,
    })
    for path in PAGES:
        send("Page.navigate", {"url": "http://localhost:5173" + path})
        ready = False
        for _ in range(40):
            time.sleep(0.25)
            state = ev("({r:document.readyState,p:location.pathname,l:document.body?document.body.innerText.length:0})")
            if state and state.get("r") == "complete" and state.get("p") == path and state.get("l", 0) > 100:
                ready = True
                break
        time.sleep(0.4)
        data = ev(JS)
        data["rendered"] = ready
        rec = {"width": width, "path": path, **data}
        out["results"].append(rec)
        print(json.dumps(rec))

send("Emulation.clearDeviceMetricsOverride")
with open(os.path.join(ROOT, "reports", "responsive_results.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, indent=2)
w.close()
