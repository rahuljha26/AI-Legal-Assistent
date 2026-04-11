import urllib.request, urllib.error, json

url = "http://localhost:8000/api/v1/auth/signup/"
data = json.dumps({
    "full_name": "Test User",
    "email": "testdebug@example.com",
    "password": "TestPass1234",
    "confirm_password": "TestPass1234",
    "role": "user"
}).encode()

req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
try:
    with urllib.request.urlopen(req) as resp:
        print("STATUS:", resp.status)
        print("BODY:", resp.read().decode())
except urllib.error.HTTPError as e:
    print("HTTP ERROR:", e.code)
    print("BODY:", e.read().decode())
except urllib.error.URLError as e:
    print("URL ERROR (server may be down):", e.reason)
