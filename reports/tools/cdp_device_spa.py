"""
Retest of previously inconclusive device steps using SPA navigation only,
so the in-memory demo session is preserved across pages.
"""
import json, os, time, urllib.request, websocket

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BASE = "http://localhost:5173"
t = [x for x in json.load(urllib.request.urlopen("http://127.0.0.1:9222/json"))
     if x.get("type") == "page" and str(x.get("url", "")).startswith(BASE)][0]
w = websocket.create_connection(t["webSocketDebuggerUrl"], timeout=30, suppress_origin=True)
n = 0

def s(m, p=None):
    global n
    n += 1
    mid = n
    w.send(json.dumps({"id": mid, "method": m, "params": p or {}}))
    end = time.time() + 30
    while time.time() < end:
        msg = json.loads(w.recv())
        if msg.get("id") == mid:
            if "error" in msg: raise RuntimeError(str(msg["error"]))
            return msg.get("result", {})
    raise TimeoutError(m)

def ev(e):
    r = s("Runtime.evaluate", {"expression": e, "returnByValue": True, "awaitPromise": True})
    return r.get("result", {}).get("value")

def load(path):
    s("Page.navigate", {"url": BASE + path})
    for _ in range(40):
        time.sleep(0.25)
        st = ev("({r:document.readyState,p:location.pathname,l:document.body?document.body.innerText.length:0})")
        if st and st.get("r") == "complete" and st.get("p") == path and st.get("l", 0) > 80:
            time.sleep(0.5)
            return True
    return False

def click_href(href):
    return ev("(()=>{const a=[...document.querySelectorAll('a')].find(x=>x.getAttribute('href')===%s);if(a){a.click();return true}return false})()" % json.dumps(href))

def click_text(text, tag="button"):
    return ev("(()=>{const e=[...document.querySelectorAll('%s')].find(x=>(x.innerText||'').includes(%s));if(e){e.click();return true}return false})()" % (tag, json.dumps(text)))

def wait_path(path):
    for _ in range(40):
        time.sleep(0.2)
        if ev("location.pathname") == path:
            time.sleep(0.5)
            return True
    return False

R = {"approach": "SPA anchor clicks; in-memory demo session preserved", "steps": {}}
s("Page.enable")
load("/login")
R["steps"]["demo_signin"] = click_text("Preview customer")
wait_path("/")

R["steps"]["nav_products_click"] = click_href("/products")
R["steps"]["products_reached"] = wait_path("/products")

# Filter modal
R["steps"]["filter_click"] = click_text("Filters")
time.sleep(0.7)
R["steps"]["filter_modal"] = ev("document.body.innerText.includes('Price range') && document.body.innerText.includes('Clear all filters')")
click_text("Close")
time.sleep(0.4)

# Search toggle
R["steps"]["search_toggle"] = ev("""(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.getAttribute('aria-label')==='Search');if(b){b.click();return true}return false})()""")
time.sleep(0.5)
R["steps"]["search_form_present"] = ev("!!document.querySelector('form[role=search]')")

# Product detail + add to cart
a = click_href("/products/classic-stoneware-mug-sand-1")
R["steps"]["detail_click"] = a
R["steps"]["detail_reached"] = wait_path("/products/classic-stoneware-mug-sand-1")
R["steps"]["add_click"] = click_text("Add to cart")
time.sleep(1.2)
R["steps"]["cart_badge"] = ev("document.querySelector('a[aria-label^=\"Shopping cart\"]')?.getAttribute('aria-label')")
R["steps"]["toast"] = ev("document.body.innerText.includes('added to your cart')")

# Cart
R["steps"]["cart_link"] = click_href("/cart")
R["steps"]["cart_reached"] = wait_path("/cart")
R["steps"]["cart_has_item"] = ev("document.body.innerText.includes('Classic Stoneware')")
R["steps"]["qty_before"] = ev("document.body.innerText.match(/\\b\\d+ available\\b/)?.[0] || ''")
R["steps"]["increase"] = ev("""(()=>{const b=document.querySelector('button[aria-label=\"Increase quantity\"]');if(b){b.click();return true}return false})()""")
time.sleep(0.9)
R["steps"]["cart_badge_after_increase"] = ev("document.querySelector('a[aria-label^=\"Shopping cart\"]')?.getAttribute('aria-label')")
R["steps"]["decrease"] = ev("""(()=>{const b=document.querySelector('button[aria-label=\"Decrease quantity\"]');if(b){b.click();return true}return false})()""")
time.sleep(0.9)
R["steps"]["cart_badge_after_decrease"] = ev("document.querySelector('a[aria-label^=\"Shopping cart\"]')?.getAttribute('aria-label')")

# Checkout via cart link
R["steps"]["checkout_link"] = click_href("/checkout")
R["steps"]["checkout_reached"] = wait_path("/checkout")
R["steps"]["checkout_demo_notice"] = ev("document.body.innerText.includes('Demo mode')")
R["steps"]["place_order_disabled"] = ev("[...document.querySelectorAll('button')].some(b=>b.innerText.includes('Place order') && b.disabled)")

# Addresses via account menu
R["steps"]["account_menu"] = ev("""(()=>{const b=document.querySelector('button[aria-label=\"Account menu\"]');if(b){b.click();return true}return false})()""")
time.sleep(0.4)
R["steps"]["addresses_link"] = click_text("Addresses", "a")
R["steps"]["addresses_reached"] = wait_path("/addresses")
R["steps"]["addresses_demo_notice"] = ev("document.body.innerText.includes('requires a connected Supabase backend')")
R["steps"]["add_address_disabled"] = ev("[...document.querySelectorAll('button')].some(b=>b.innerText.includes('Add address') && b.disabled)")

print(json.dumps(R, indent=2))
with open(os.path.join(ROOT, "reports", "device_spa_results.json"), "w", encoding="utf-8") as f:
    json.dump(R, f, indent=2)
w.close()
