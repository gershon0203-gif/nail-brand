import json, time, urllib.request, websocket
CDP="http://127.0.0.1:9222"
t=[x for x in json.load(urllib.request.urlopen(CDP+"/json")) if x.get("type")=="page" and str(x.get("url","")).startswith("http://localhost:5173/")][0]
w=websocket.create_connection(t["webSocketDebuggerUrl"],timeout=30,suppress_origin=True)
i=0
def s(m,p=None):
 global i;i+=1;w.send(json.dumps({"id":i,"method":m,"params":p or {}}));mid=i
 while True:
  msg=json.loads(w.recv())
  if msg.get("id")==mid:return msg.get("result",{})
def ev(e):return s("Runtime.evaluate",{"expression":e,"returnByValue":True}).get("result",{}).get("value")
s("Page.enable")
s("Emulation.setDeviceMetricsOverride",{"width":375,"height":812,"deviceScaleFactor":2,"mobile":True})
time.sleep(1)
s("Page.navigate",{"url":"http://localhost:5173/cart"})
for _ in range(40):
 time.sleep(0.25)
 st=ev("({r:document.readyState,p:location.pathname,l:document.body?document.body.innerText.length:0})")
 if st and st.get("r")=="complete" and st.get("p")=="/cart" and st.get("l",0)>50:break
time.sleep(1)
print(json.dumps(ev("({innerWidth,scrollWidth:document.documentElement.scrollWidth,overflowX:document.documentElement.scrollWidth>innerWidth+1,text:document.body.innerText.slice(0,200)})"),indent=2))
s("Emulation.clearDeviceMetricsOverride")
w.close()
