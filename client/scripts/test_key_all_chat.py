import requests

key = "sk-277f833961b6420fa28165c77dc92a71"

endpoints = [
    {
        "name": "SiliconFlow",
        "url": "https://api.siliconflow.cn/v1/chat/completions",
        "model": "deepseek-ai/DeepSeek-V3",
        "headers": {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    },
    {
        "name": "DeepSeek Official",
        "url": "https://api.deepseek.com/chat/completions",
        "model": "deepseek-chat",
        "headers": {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    },
    {
        "name": "OpenRouter",
        "url": "https://openrouter.ai/api/v1/chat/completions",
        "model": "deepseek/deepseek-chat",
        "headers": {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    },
    {
        "name": "Groq",
        "url": "https://api.groq.com/openai/v1/chat/completions",
        "model": "llama3-8b-8192",
        "headers": {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    },
    {
        "name": "Novita",
        "url": "https://api.novita.ai/v3/openai/chat/completions",
        "model": "deepseek/deepseek_v3",
        "headers": {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    }
]

for ep in endpoints:
    try:
        r = requests.post(
            ep["url"],
            headers=ep["headers"],
            json={
                "model": ep["model"],
                "messages": [{"role": "user", "content": "Hi"}],
                "max_tokens": 10
            },
            timeout=10
        )
        print(f"[{ep['name']}] Status: {r.status_code}")
        print(f"[{ep['name']}] Response: {r.text[:200]}")
    except Exception as e:
        print(f"[{ep['name']}] Error: {e}")
