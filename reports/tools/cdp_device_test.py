"""
Real Android Chrome device testing via Chrome DevTools Protocol over ADB forward.
Target tab is selected ONLY by exact URL http://localhost:5173/ so the user's
other browser tabs are never touched.

Usage: python reports/tools/cdp_device_test.py
Outputs: reports/device_results.json + reports/screenshots/*.png
"""
import base64
import json
import os
import time
import urllib.request

import websocket

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
REPORTS = os.path.join(ROOT, "reports")
SHOTS = os.path.join(REPORTS, "screenshots")
os.makedirs(SHOTS, exist_ok=True)

CDP = "http://127.0.0.1:9222"
TARGET_URL = "http://localhost:5173/"


def targets():
    with urllib.request.urlopen(CDP + "/json", timeout=10) as r:
        return json.load(r)


class Page:
    def __init__(self, ws_url):
        self.ws = websocket.create_connection(ws_url, timeout=30, suppress_origin=True)
        self.n = 0
        self.events = []

    def send(self, method, params=None, timeout=30):
        self.n += 1
        mid = self.n
        self.ws.send(json.dumps({"id": mid, "method": method, "params": params or {}}))
        deadline = time.time() + timeout
        while time.time() < deadline:
            self.ws.settimeout(max(1, deadline - time.time()))
            try:
                msg = json.loads(self.ws.recv())
            except websocket.WebSocketTimeoutException:
                break
            if msg.get("id") == mid:
                if "error" in msg:
                    raise RuntimeError(f"{method}: {msg['error']}")
                return msg.get("result", {})
            if "method" in msg:
                self.events.append(msg)
        raise TimeoutError(method)

    def evaluate(self, expr):
        res = self.send("Runtime.evaluate", {
            "expression": expr,
            "returnByValue": True,
            "awaitPromise": True,
        })
        if res.get("exceptionDetails"):
            return {"__exception__": str(res["exceptionDetails"].get("text", "unknown"))}
        return res.get("result", {}).get("value")

    def navigate(self, url):
        self.send("Page.navigate", {"url": url})
        for _ in range(60):
            time.sleep(0.25)
            ready = self.evaluate("document.readyState")
            if ready == "complete":
                time.sleep(1.0)
                return
        raise TimeoutError("page load: " + url)

    def screenshot(self, name):
        data = self.send("Page.captureScreenshot", {"format": "png", "captureBeyondViewport": False})
        path = os.path.join(SHOTS, name + ".png")
        with open(path, "wb") as f:
            f.write(base64.b64decode(data["data"]))
        return os.path.relpath(path, ROOT).replace("\\", "/")

    def close(self):
        self.ws.close()


JS_VIEWPORT = """({
  innerWidth: window.innerWidth,
  innerHeight: window.innerHeight,
  dpr: window.devicePixelRatio,
  scrollWidth: document.documentElement.scrollWidth,
  scrollHeight: document.documentElement.scrollHeight,
  overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
  bodyText: document.body.innerText.slice(0, 300)
})"""

JS_GRID = """(() => {
  const cards = [...document.querySelectorAll('article')];
  const lefts = [...new Set(cards.map(c => Math.round(c.getBoundingClientRect().left)))];
  const rects = cards.slice(0,6).map(c => { const r=c.getBoundingClientRect(); return {w:Math.round(r.width),h:Math.round(r.height)}; });
  return { cardCount: cards.length, columns: lefts.length, lefts, firstCards: rects,
           overflowX: document.documentElement.scrollWidth > window.innerWidth + 1 };
})()"""

JS_IMAGES = """(() => {
  const imgs=[...document.querySelectorAll('img')];
  return { total: imgs.length, loaded: imgs.filter(i=>i.complete && i.naturalWidth>0).length,
           broken: imgs.filter(i=>i.complete && i.naturalWidth===0).map(i=>i.currentSrc||i.src).slice(0,10) };
})()"""

JS_TOUCH = """(() => {
  const els=[...document.querySelectorAll('button, a, input, select')].filter(e=>{
    const r=e.getBoundingClientRect(); return r.width>0 && r.height>0;
  });
  const small=els.filter(e=>{const r=e.getBoundingClientRect(); return r.height<36 || r.width<36;});
  return { total: els.length, smallCount: small.length,
           smallExamples: small.slice(0,8).map(e=>({tag:e.tagName,text:(e.innerText||e.getAttribute('aria-label')||'').slice(0,40),
             h:Math.round(e.getBoundingClientRect().height),w:Math.round(e.getBoundingClientRect().width)})) };
})()"""

JS_FIXED_OVERFLOW = """(() => {
  const vw=window.innerWidth;
  const bad=[...document.querySelectorAll('body *')].filter(e=>{
    const r=e.getBoundingClientRect();
    return r.width>0 && (r.right>vw+2 || r.left < -2) && getComputedStyle(e).position!=='fixed';
  });
  return bad.slice(0,10).map(e=>({tag:e.tagName,cls:(e.className||'').toString().slice(0,80),
    right:Math.round(e.getBoundingClientRect().right),left:Math.round(e.getBoundingClientRect().left)}));
})()"""


def main():
    result = {"device": {}, "pages": {}, "console_errors": [], "network_failures": [], "screenshots": []}

    # Device identity via ADB is recorded in the report manually; CDP gives browser info.
    t = [x for x in targets() if x.get("type") == "page" and x.get("url") == TARGET_URL]
    if not t:
        raise SystemExit("Target tab http://localhost:5173/ not found. Open it on the device first.")
    p = Page(t[0]["webSocketDebuggerUrl"])
    try:
        p.send("Runtime.enable")
        p.send("Log.enable")
        p.send("Network.enable")
        p.send("Page.enable")

        result["device"]["browser"] = p.evaluate("navigator.userAgent")
        result["device"]["language"] = p.evaluate("navigator.language")
        result["device"]["onLine"] = p.evaluate("navigator.onLine")

        # --- Homepage (already loaded) ---
        result["pages"]["home"] = {
            "viewport": p.evaluate(JS_VIEWPORT),
            "images": p.evaluate(JS_IMAGES),
            "touchTargets": p.evaluate(JS_TOUCH),
            "overflowElements": p.evaluate(JS_FIXED_OVERFLOW),
            "demoBanner": p.evaluate("document.body.innerText.includes('DEMO PREVIEW MODE')"),
            "title": p.evaluate("document.title"),
        }
        result["screenshots"].append(p.screenshot("01_home_real_device"))

        # --- Products page via real click on the nav link ---
        clicked = p.evaluate("""(() => { const a=[...document.querySelectorAll('a')].find(x=>x.getAttribute('href')==='/products'); if(a){a.click(); return true;} return false; })()""")
        time.sleep(2.0)
        result["pages"]["products"] = {
            "clickedNav": clicked,
            "url": p.evaluate("location.href"),
            "viewport": p.evaluate(JS_VIEWPORT),
            "grid": p.evaluate(JS_GRID),
            "images": p.evaluate(JS_IMAGES),
            "overflowElements": p.evaluate(JS_FIXED_OVERFLOW),
            "hasFilterButton": p.evaluate("document.body.innerText.includes('Filters')"),
            "cardSample": p.evaluate("[...document.querySelectorAll('article')].slice(0,2).map(a=>a.innerText.slice(0,160))"),
        }
        result["screenshots"].append(p.screenshot("02_products_real_device"))

        # --- Product detail via real card click ---
        opened = p.evaluate("""(() => { const a=document.querySelector('article a'); if(a){a.click(); return true;} return false; })()""")
        time.sleep(2.0)
        result["pages"]["product_detail"] = {
            "clickedCard": opened,
            "url": p.evaluate("location.href"),
            "viewport": p.evaluate(JS_VIEWPORT),
            "images": p.evaluate(JS_IMAGES),
            "hasQuantity": p.evaluate("!!document.querySelector('button[aria-label=\"Increase quantity\"]')"),
            "hasAddToCart": p.evaluate("document.body.innerText.includes('Add to cart')"),
            "overflowElements": p.evaluate(JS_FIXED_OVERFLOW),
        }
        result["screenshots"].append(p.screenshot("03_product_detail_real_device"))

        # --- Cart page ---
        p.navigate(TARGET_URL + "cart")
        time.sleep(1.5)
        result["pages"]["cart"] = {
            "url": p.evaluate("location.href"),
            "viewport": p.evaluate(JS_VIEWPORT),
            "emptyState": p.evaluate("document.body.innerText.includes('Your cart is empty')"),
            "overflowElements": p.evaluate(JS_FIXED_OVERFLOW),
        }
        result["screenshots"].append(p.screenshot("04_cart_real_device"))

        # --- Login page ---
        p.navigate(TARGET_URL + "login")
        time.sleep(1.5)
        result["pages"]["login"] = {
            "url": p.evaluate("location.href"),
            "viewport": p.evaluate(JS_VIEWPORT),
            "hasDemoPanel": p.evaluate("document.body.innerText.includes('Demo preview')"),
            "inputs": p.evaluate("document.querySelectorAll('input').length"),
            "touchTargets": p.evaluate(JS_TOUCH),
            "overflowElements": p.evaluate(JS_FIXED_OVERFLOW),
        }
        result["screenshots"].append(p.screenshot("05_login_real_device"))

        # --- Admin page (should be restricted in demo until admin preview sign-in) ---
        p.navigate(TARGET_URL + "admin")
        time.sleep(1.5)
        result["pages"]["admin_guard"] = {
            "url": p.evaluate("location.href"),
            "redirectedToLogin": p.evaluate("location.pathname === '/login'"),
            "text": p.evaluate("document.body.innerText.slice(0,200)"),
        }

        # --- Collect errors seen during the whole session ---
        for ev in p.events:
            if ev.get("method") == "Runtime.exceptionThrown":
                d = ev["params"]["exceptionDetails"]
                result["console_errors"].append(str(d.get("text", "")) + " " + str((d.get("exception") or {}).get("description", ""))[:300])
            elif ev.get("method") == "Log.entryAdded":
                e = ev["params"]["entry"]
                if e.get("level") in ("error", "warning"):
                    result["console_errors"].append(f"{e.get('level')}: {e.get('text','')[:300]}")
            elif ev.get("method") == "Network.loadingFailed":
                result["network_failures"].append(str(ev["params"].get("errorText", "")))
    finally:
        p.close()

    # Trim noise
    result["console_errors"] = list(dict.fromkeys(result["console_errors"]))[:40]
    result["network_failures"] = list(dict.fromkeys(result["network_failures"]))[:40]
    result["http_errors"] = [
        {"status": e["params"]["response"]["status"], "url": e["params"]["response"]["url"]}
        for e in p.events
        if e.get("method") == "Network.responseReceived"
        and e["params"]["response"].get("status", 0) >= 400
    ]
    out = os.path.join(REPORTS, "device_results.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
