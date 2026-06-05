import requests

key = "sk-287872eec164422d93076b527de30897"

try:
    r = requests.post(
        "https://api.moonshot.cn/v1/chat/completions",
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        json={
            "model": "moonshot-v1-8k",
            "messages": [{"role": "user", "content": "Hi"}],
            "max_tokens": 10
        },
        timeout=10
    )
    print("[Moonshot] Status:", r.status_code)
    print("[Moonshot] Response:", r.text)
except Exception as e:
    print("[Moonshot] Error:", e)
