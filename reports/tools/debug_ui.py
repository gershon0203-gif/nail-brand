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
s("Page.navigate",{"url":BASE+"/products"})
time.sleep(2)
print("PATH",ev("location.pathname"))
print("FILTER BUTTONS",ev("[...document.querySelectorAll('button')].filter(b=>b.innerText.includes('Filters')).map(b=>({t:b.innerText,h:b.outerHTML.slice(0,200)}))"))
print("CLICK",ev("(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.innerText.includes('Filters'));if(b){b.click();return true}return false})()"))
time.sleep(1.5)
print("AFTER CLICK BODY",ev("document.body.innerText.slice(-1200)"))
print("DIALOGS",ev("[...document.querySelectorAll('[role=dialog]')].map(d=>d.innerText.slice(0,300))"))
print("SEARCH BTN",ev("[...document.querySelectorAll('button')].filter(b=>b.getAttribute('aria-label')==='Search').map(b=>b.outerHTML.slice(0,200))"))
print("SEARCH CLICK",ev("(()=>{const b=document.querySelector('button[aria-label=\"Search\"]');if(b){b.click();return true}return false})()"))
time.sleep(1)
print("FORMS",ev("[...document.querySelectorAll('form')].map(f=>({role:f.getAttribute('role'),html:f.outerHTML.slice(0,180)}))"))
w.close()
