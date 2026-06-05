import requests
import json

key = "sk-287872eec164422d93076b527de30897"
results = {}

# 1. DeepSeek
try:
    r = requests.get("https://api.deepseek.com/user/balance", headers={"Authorization": f"Bearer {key}"})
    results["DeepSeek"] = r.json()
except Exception as e:
    results["DeepSeek"] = str(e)

# 2. SiliconFlow
try:
    r = requests.get("https://api.siliconflow.cn/v1/user/info", headers={"Authorization": f"Bearer {key}"})
    results["SiliconFlow"] = r.text
except Exception as e:
    results["SiliconFlow"] = str(e)

# 3. DashScope
try:
    r = requests.get("https://dashscope.aliyuncs.com/compatible-mode/v1/models", headers={"Authorization": f"Bearer {key}"})
    results["DashScope"] = r.text
except Exception as e:
    results["DashScope"] = str(e)

# 4. Mistral
try:
    r = requests.get("https://api.mistral.ai/v1/models", headers={"Authorization": f"Bearer {key}"})
    results["Mistral"] = r.text
except Exception as e:
    results["Mistral"] = str(e)

# 5. Novita
try:
    r = requests.get("https://api.novita.ai/v3/openai/models", headers={"Authorization": f"Bearer {key}"})
    results["Novita"] = r.text
except Exception as e:
    results["Novita"] = str(e)

with open("client/scripts/test_key_results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2)

print("Saved results to client/scripts/test_key_results.json")
