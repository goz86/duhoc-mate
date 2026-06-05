import requests

key = "sk-287872eec164422d93076b527de30897"

endpoints = [
    {
        "name": "OpenAI",
        "url": "https://api.openai.com/v1/chat/completions",
        "model": "gpt-4o-mini",
        "headers": {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    },
    {
        "name": "Cohere",
        "url": "https://api.cohere.ai/v1/chat",
        "headers": {"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        "json": {
            "message": "Hi",
            "model": "command-r-plus"
        }
    },
    {
        "name": "Together AI",
        "url": "https://api.together.xyz/v1/chat/completions",
        "model": "meta-llama/Llama-3-8b-chat-hf",
        "headers": {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    },
    {
        "name": "Perplexity",
        "url": "https://api.perplexity.ai/chat/completions",
        "model": "sonar",
        "headers": {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    }
]

for ep in endpoints:
    try:
        req_json = ep.get("json", {
            "model": ep.get("model"),
            "messages": [{"role": "user", "content": "Hi"}],
            "max_tokens": 10
        })
        r = requests.post(
            ep["url"],
            headers=ep["headers"],
            json=req_json,
            timeout=10
        )
        print(f"[{ep['name']}] Status: {r.status_code}")
        print(f"[{ep['name']}] Response: {r.text[:200]}")
    except Exception as e:
        print(f"[{ep['name']}] Error: {e}")
