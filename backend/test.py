import urllib.request as r
import json
req = r.Request('http://127.0.0.1:8000/scan', data=json.dumps({"target": "http://example.com"}).encode(), headers={'Content-Type':'application/json'})
print(r.urlopen(req).read().decode())
