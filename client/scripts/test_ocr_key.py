import requests

key = "K89796403088957"
payload = {
    'apikey': key,
    'language': 'kor',
}

# Try a dummy small request
try:
    r = requests.post(
        'https://api.ocr.space/parse/image',
        files={'image.jpg': b'dummydata'},
        data=payload,
        timeout=10
    )
    print("Status:", r.status_code)
    print("Response:", r.text)
except Exception as e:
    print("Error:", e)
