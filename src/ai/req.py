import requests

try:
    res = requests.post("http://localhost:9000/chat", data={"query": "Hello"})
    print("STATUS:", res.status_code)
    print("RESPONSE:", res.text)
except Exception as e:
    print("ERROR:", e)
