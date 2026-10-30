
import os
import urllib.request
import urllib.error

token = os.getenv("HF_TOKEN")

if not token:
    print("HF_TOKEN is missing")
    raise SystemExit(1)

request = urllib.request.Request(
    "https://huggingface.co/api/whoami-v2",
    headers={"Authorization": "Bearer " + token},
)

try:
    with urllib.request.urlopen(request, timeout=20) as response:
        print("HTTP status:", response.status)
        print("Token accepted")

except urllib.error.HTTPError as error:
    print("HTTP status:", error.code)
    print("Token rejected or unavailable" if error.code == 401 else "Request returned an error")

except Exception as error:
    print("Connection error:", type(error).__name__)
    print(str(error)[:300])
