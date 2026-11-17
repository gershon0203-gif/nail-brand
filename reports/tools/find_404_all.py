import json, time, urllib.request, websocket
BASE="http://localhost:5173"
t=[x for x in json.load(urllib.request.urlopen("http://127.0.0.1:9222/json"))
   if x.get("type")=="page" and str(x.get("url","")).startswith(BASE)][0]
w=websocket.create_connection(t["webSocketDebuggerUrl"],timeout=30,suppress_origin=True)
i=0;events=[]
def s(m,p=None):
 global i;i+=1;mid=i;w.send(json.dumps({"id":mid,"method":m,"params":p or {}}))
 while True:
  msg=json.loads(w.recv())
  if msg.get("id")==mid:return msg.get("result",{})
  if "method" in msg:events.append(msg)
def ev(e):return s("Runtime.evaluate",{"expression":e,"returnByValue":True}).get("result",{}).get("value")
s("Network.enable");s("Page.enable")
for path in ["/","/products","/products/classic-stoneware-mug-sand-1","/cart","/login","/admin"]:
 s("Page.navigate",{"url":BASE+path});time.sleep(1.8)
bad=[]
for e in events:
 if e.get("method")=="Network.responseReceived":
  r=e["params"]["response"]
  if r.get("status",0)>=400:bad.append({"status":r["status"],"url":r["url"]})
 if e.get("method")=="Network.loadingFailed":
  bad.append({"status":"loadingFailed","url":e["params"].get("errorText","")})
# also Log entries
logs=[e["params"]["entry"]["text"] for e in events if e.get("method")=="Log.entryAdded"]
print(json.dumps({"bad":bad,"logs":logs[-15:]},indent=2))
w.close()
