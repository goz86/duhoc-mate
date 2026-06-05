import requests
import json

key = "sk-287872eec164422d93076b527de30897"
try:
    r = requests.post("https://api.novita.ai/v3/openai/chat/completions",
                      headers={
                          "Content-Type": "application/json",
                          "Authorization": f"Bearer {key}"
                      },
                      json={
                          "model": "deepseek/deepseek-v3",
                          "messages": [
                              {"role": "system", "content": "You are a helpful assistant."},
                              {"role": "user", "content": "Hello!"}
                          ],
                          "temperature": 0.1,
                          "max_tokens": 100
                      })
    print("Status code:", r.status_code)
    print("Response:", r.text)
except Exception as e:
    print("Exception:", str(e))
