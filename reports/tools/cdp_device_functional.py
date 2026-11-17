"""
Real-device functional UI tests (demo-mode catalogue). Backend-dependent flows
are explicitly labelled DEMO UI ONLY in the report.
"""
import json, os, time, urllib.request, websocket

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CDP = "http://127.0.0.1:9222"
BASE = "http://localhost:5173"
t = [x for x in json.load(urllib.request.urlopen(CDP + "/json"))
     if x.get("type") == "page" and str(x.get("url", "")).startswith(BASE)][0]
w = websocket.create_connection(t["webSocketDebuggerUrl"], timeout=30, suppress_origin=True)
n = 0
events = []

def send(m, p=None):
    global n
    n += 1
    mid = n
    w.send(json.dumps({"id": mid, "method": m, "params": p or {}}))
    end = time.time() + 30
    while time.time() < end:
        msg = json.loads(w.recv())
        if msg.get("id") == mid:
            if "error" in msg:
                raise RuntimeError(str(msg["error"]))
            return msg.get("result", {})
        if "method" in msg:
            events.append(msg)
    raise TimeoutError(m)

def ev(e):
    r = send("Runtime.evaluate", {"expression": e, "returnByValue": True, "awaitPromise": True})
    return r.get("result", {}).get("value")

def go(path):
    send("Page.navigate", {"url": BASE + path})
    for _ in range(40):
        time.sleep(0.25)
        st = ev("({r:document.readyState,p:location.pathname,l:document.body?document.body.innerText.length:0})")
        if st and st.get("r") == "complete" and st.get("p") == path and st.get("l", 0) > 80:
            time.sleep(0.5)
            return True
    return False

def click_text(text, tag="button"):
    return ev("(()=>{const els=[...document.querySelectorAll('%s')];const e=els.find(x=>(x.innerText||'').includes(%s));if(e){e.click();return true}return false})()" % (tag, json.dumps(text)))

send("Page.enable"); send("Runtime.enable"); send("Log.enable"); send("Network.enable")
R = {"mode": "DEMO UI ONLY - Supabase credentials absent", "steps": {}}

# Sorting
R["steps"]["products_load"] = go("/products")
before = ev("document.querySelector('article')?.innerText.slice(0,80)")
R["steps"]["sort_changed"] = ev("""(()=>{const s=document.querySelector('select');if(!s)return false;
  s.value='price_asc';s.dispatchEvent(new Event('change',{bubbles:true}));return true})()""")
time.sleep(1.2)
after = ev("document.querySelector('article')?.innerText.slice(0,80)")
R["steps"]["sort_result"] = {"before": before, "after": after, "changed": before != after}

# Mobile filter modal
R["steps"]["filter_clicked"] = click_text("Filters")
time.sleep(0.6)
R["steps"]["filter_modal_visible"] = ev("document.body.innerText.includes('Price range') && document.body.innerText.includes('Clear all filters')")
click_text("Close")

# Search
go("/products")
R["steps"]["search_submit"] = ev("""(()=>{const f=document.querySelector('form[role=search]');if(!f)return false;
  const i=f.querySelector('input');i.value='mug';i.dispatchEvent(new Event('input',{bubbles:true}));
  f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));return true})()""")
time.sleep(1.5)
R["steps"]["search_url"] = ev("location.href")
R["steps"]["search_results"] = ev("document.querySelectorAll('article').length")

# Demo sign-in
go("/login")
R["steps"]["demo_signin_clicked"] = click_text("Preview customer")
time.sleep(1.0)
R["steps"]["after_signin_url"] = ev("location.pathname")
R["steps"]["account_menu_has_profile"] = ev("document.body.innerText.includes('Norwood')")

# Add to cart from product detail
go("/products/classic-stoneware-mug-sand-1")
R["steps"]["add_to_cart_clicked"] = click_text("Add to cart")
time.sleep(1.2)
R["steps"]["cart_badge"] = ev("document.querySelector('a[aria-label^=\"Shopping cart\"]')?.getAttribute('aria-label')")
R["steps"]["toast_added"] = ev("document.body.innerText.includes('added to your cart')")

# Cart operations
go("/cart")
R["steps"]["cart_items"] = ev("document.querySelectorAll('article').length || document.body.innerText.includes('Classic Stoneware')")
R["steps"]["increase_clicked"] = ev("""(()=>{const b=document.querySelector('button[aria-label=\"Increase quantity\"]');if(b){b.click();return true}return false})()""")
time.sleep(0.8)
R["steps"]["qty_after_increase"] = ev("document.body.innerText.match(/Qty|1|2/)?.[0] || ''")
R["steps"]["decrease_clicked"] = ev("""(()=>{const b=document.querySelector('button[aria-label=\"Decrease quantity\"]');if(b){b.click();return true}return false})()""")
time.sleep(0.8)
R["steps"]["remove_clicked"] = ev("""(()=>{const b=[...document.querySelectorAll('button')].find(x=>(x.getAttribute('aria-label')||'').startsWith('Remove '));if(b){b.click();return true}return false})()""")
time.sleep(0.8)
R["steps"]["cart_empty_after_remove"] = ev("document.body.innerText.includes('Your cart is empty')")

# Addresses + checkout (demo gating)
go("/addresses")
R["steps"]["addresses_demo_notice"] = ev("document.body.innerText.includes('requires a connected Supabase backend')")
R["steps"]["add_address_disabled"] = ev("[...document.querySelectorAll('button')].some(b=>b.innerText.includes('Add address') && b.disabled)")
go("/checkout")
R["steps"]["checkout_demo_notice"] = ev("document.body.innerText.includes('Demo mode')")
R["steps"]["place_order_disabled"] = ev("[...document.querySelectorAll('button')].some(b=>b.innerText.includes('Place order') && b.disabled)")

# Admin guard + demo admin
go("/admin")
R["steps"]["admin_redirected"] = ev("location.pathname === '/login'")
go("/login")
R["steps"]["demo_admin_clicked"] = click_text("Preview admin")
time.sleep(1.2)
R["steps"]["admin_url_after_login"] = ev("location.pathname")
R["steps"]["admin_dashboard_text"] = ev("document.body.innerText.slice(0,160)")

# Console errors
R["console_errors"] = list(dict.fromkeys([
    str(e.get("params", {}).get("entry", {}).get("text", ""))[:200]
    for e in events if e.get("method") == "Log.entryAdded"
    and e.get("params", {}).get("entry", {}).get("level") == "error"
]))[:20]

print(json.dumps(R, indent=2))
with open(os.path.join(ROOT, "reports", "device_functional_results.json"), "w", encoding="utf-8") as f:
    json.dump(R, f, indent=2)
w.close()
