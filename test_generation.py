import requests
import json

url = "http://127.0.0.1:8001/generate"
data = {
    "city": "Munich",
    "country": "Germany",
    "theme": "terracotta"
}

try:
    print(f"Sending request to {url} with data: {data}")
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
