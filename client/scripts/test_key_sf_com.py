import requests

key = "sk-287872eec164422d93076b527de30897"

try:
    r = requests.get(
        "https://api.siliconflow.com/v1/user/info",
        headers={"Authorization": f"Bearer {key}"},
        timeout=10
    )
    print("[SiliconFlow .com] Status:", r.status_code)
    print("[SiliconFlow .com] Response:", r.text)
except Exception as e:
    print("[SiliconFlow .com] Error:", e)
