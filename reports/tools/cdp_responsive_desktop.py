"""
Reliable responsive width sweep using headless desktop Chrome (port 9223).
Emulation is NOT real-device testing; real-device results are in device_results.json.
"""
import base64, json, os, time, urllib.request, websocket

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SHOTS = os.path.join(ROOT, "reports", "screenshots", "responsive-desktop")
os.makedirs(SHOTS, exist_ok=True)
CDP = "http://127.0.0.1:9223"

for _ in range(40):
    try:
        targets = json.load(urllib.request.urlopen(CDP + "/json", timeout=2))
        break
    except Exception:
        time.sleep(0.25)
t = [x for x in targets if x.get("type") == "page"][0]
w = websocket.create_connection(t["webSocketDebuggerUrl"], timeout=30, suppress_origin=True)
n = 0

def send(method, params=None):
    global n
    n += 1
    mid = n
    w.send(json.dumps({"id": mid, "method": method, "params": params or {}}))
    deadline = time.time() + 30
    while time.time() < deadline:
        msg = json.loads(w.recv())
        if msg.get("id") == mid:
            if "error" in msg:
                raise RuntimeError(str(msg["error"]))
            return msg.get("result", {})
    raise TimeoutError(method)

def ev(expr):
    return send("Runtime.evaluate", {"expression": expr, "returnByValue": True, "awaitPromise": True}).get("result", {}).get("value")

JS = """(() => {
  const vw=window.innerWidth;
  const cards=[...document.querySelectorAll('article')];
  const lefts=[...new Set(cards.map(c=>Math.round(c.getBoundingClientRect().left)))];
  const bad=[...document.querySelectorAll('body *')].filter(e=>{
    const r=e.getBoundingClientRect();
    return r.width>0 && r.right>vw+2 && getComputedStyle(e).position!=='fixed'
      && !e.closest('[aria-hidden="true"]');
  }).slice(0,6).map(e=>({tag:e.tagName,cls:(e.className||'').toString().slice(0,70),right:Math.round(e.getBoundingClientRect().right)}));
  const nav=document.querySelector('header nav');
  return {innerWidth:vw, scrollWidth:document.documentElement.scrollWidth,
          overflowX:document.documentElement.scrollWidth>vw+1,
          gridColumns:lefts.length||null, cardCount:cards.length,
          badElements:bad, textLength:document.body.innerText.length,
          demoBanner:document.body.innerText.includes('DEMO PREVIEW MODE')};
})()"""

WIDTHS = [360, 375, 390, 430, 768, 1024, 1440]
PAGES = ["/", "/products", "/products/classic-stoneware-mug-sand-1", "/cart", "/login", "/checkout"]
out = {"emulation": "headless desktop Chrome", "results": []}
send("Page.enable")
for width in WIDTHS:
    send("Emulation.setDeviceMetricsOverride", {
        "width": width, "height": 820, "deviceScaleFactor": 1, "mobile": False,
    })
    time.sleep(0.3)
    for path in PAGES:
        send("Page.navigate", {"url": "http://127.0.0.1:5173" + path})
        ok = False
        for _ in range(40):
            time.sleep(0.2)
            st = ev("({r:document.readyState,p:location.pathname,l:document.body?document.body.innerText.length:0})")
            expected = "/login" if path == "/checkout" else path
            if st and st.get("r") == "complete" and st.get("p") == expected and st.get("l", 0) > 80:
                ok = True
                break
        time.sleep(0.35)
        data = ev(JS)
        data.update({"width": width, "path": path, "rendered": ok, "actualPath": ev("location.pathname")})
        if path in ("/", "/products", "/checkout") and width in (360, 390, 768, 1440):
            img = send("Page.captureScreenshot", {"format": "png", "captureBeyondViewport": False})
            fn = f"{width}_{path.strip('/').replace('/','_') or 'home'}.png"
            with open(os.path.join(SHOTS, fn), "wb") as f:
                f.write(base64.b64decode(img["data"]))
            data["screenshot"] = f"reports/screenshots/responsive-desktop/{fn}"
        out["results"].append(data)
send("Emulation.clearDeviceMetricsOverride")
with open(os.path.join(ROOT, "reports", "responsive_desktop_results_true_widths.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, indent=2)
print("done", len(out["results"]))
w.close()
