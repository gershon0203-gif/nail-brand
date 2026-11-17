import json, time, urllib.request, websocket
BASE="http://localhost:5173"
t=[x for x in json.load(urllib.request.urlopen("http://127.0.0.1:9222/json"))
   if x.get("type")=="page" and str(x.get("url","")).startswith(BASE)][0]
w=websocket.create_connection(t["webSocketDebuggerUrl"],timeout=30,suppress_origin=True)
i=0
def s(m,p=None):
 global i;i+=1;mid=i;w.send(json.dumps({"id":mid,"method":m,"params":p or {}}))
 while True:
  msg=json.loads(w.recv())
  if msg.get("id")==mid:return msg.get("result",{})
def ev(e):return s("Runtime.evaluate",{"expression":e,"returnByValue":True}).get("result",{}).get("value")
def load(path):
 s("Page.navigate",{"url":BASE+path})
 for _ in range(40):
  time.sleep(0.25)
  st=ev("({r:document.readyState,p:location.pathname,l:document.body?document.body.innerText.length:0})")
  if st and st["r"]=="complete" and st["p"]==path and st["l"]>80:time.sleep(0.5);return True
 return False
def click(txt,tag="button"):return ev("(()=>{const e=[...document.querySelectorAll('%s')].find(x=>(x.innerText||'').includes(%s));if(e){e.click();return true}return false})()"%(tag,json.dumps(txt)))
def href(h):return ev("(()=>{const a=[...document.querySelectorAll('a')].find(x=>x.getAttribute('href')===%s);if(a){a.click();return true}return false})()"%json.dumps(h))
def wait(p):
 for _ in range(40):
  time.sleep(0.2)
  if ev("location.pathname")==p:time.sleep(0.5);return True
 return False
R={}
load("/login");click("Preview customer");wait("/")
href("/products");wait("/products")
R["search_toggle"]=ev("(()=>{const b=document.querySelector('button[aria-label=\"Search\"]');if(b){b.click();return true}return false})()")
time.sleep(0.5)
R["search_form_role"]=ev("document.querySelector('form[role=search]')?.getAttribute('role') || null")
R["filter_modal"]=None
click("Filters");time.sleep(0.8)
R["filter_modal"]=ev("[...document.querySelectorAll('[role=dialog]')].some(d=>d.innerText.toLowerCase().includes('price range'))")
click("Close");time.sleep(0.4)
href("/products/classic-stoneware-mug-sand-1");wait("/products/classic-stoneware-mug-sand-1")
click("Add to cart");time.sleep(1)
R["badge_after_add"]=ev("document.querySelector('a[aria-label^=\"Shopping cart\"]')?.getAttribute('aria-label')")
href("/cart");wait("/cart")
R["remove_clicked"]=ev("(()=>{const b=[...document.querySelectorAll('button')].find(x=>(x.getAttribute('aria-label')||'').startsWith('Remove '));if(b){b.click();return true}return false})()")
time.sleep(0.9)
R["cart_empty_after_remove"]=ev("document.body.innerText.includes('Your cart is empty')")
R["badge_after_remove"]=ev("document.querySelector('a[aria-label^=\"Shopping cart\"]')?.getAttribute('aria-label')")
R["touch_small_login"]="see device_results.json (fixed and not re-measured)"
print(json.dumps(R,indent=2))
with open("reports/device_final_retest.json","w",encoding="utf-8") as f:json.dump(R,f,indent=2)
w.close()
