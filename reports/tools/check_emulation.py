import json, time, urllib.request, websocket
for port in (9223,):
    t=[x for x in json.load(urllib.request.urlopen(f"http://127.0.0.1:{port}/json")) if x.get("type")=="page"][0]
    w=websocket.create_connection(t["webSocketDebuggerUrl"],timeout=20,suppress_origin=True)
    i=0
    def s(m,p=None):
        global i;i+=1;mid=i;w.send(json.dumps({"id":mid,"method":m,"params":p or {}}))
        while True:
            msg=json.loads(w.recv())
            if msg.get("id")==mid:return msg.get("result",{})
    def ev(e):return s("Runtime.evaluate",{"expression":e,"returnByValue":True}).get("result",{}).get("value")
    print("before",ev("[innerWidth,outerWidth,devicePixelRatio,document.documentElement.clientWidth]"))
    for mob in (False,True):
        s("Emulation.setDeviceMetricsOverride",{"width":360,"height":800,"deviceScaleFactor":1,"mobile":mob})
        time.sleep(0.5)
        print("mobile",mob,ev("[innerWidth,outerWidth,devicePixelRatio,document.documentElement.clientWidth]"))
    s("Emulation.clearDeviceMetricsOverride")
    w.close()
