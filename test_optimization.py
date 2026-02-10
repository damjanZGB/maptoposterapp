import requests
import time
import os

BASE_URL = "http://127.0.0.1:8002"
OUTPUT_DIR = "backend/outputs"

def test_generation(city, country, quality):
    print(f"\n--- Testing {quality} generation for {city}, {country} ---")
    start_time = time.time()
    payload = {
        "city": city,
        "country": country,
        "theme": "terracotta",
        "scale": 12000,
        "quality": quality
    }
    
    try:
        response = requests.post(f"{BASE_URL}/generate", json=payload)
        end_time = time.time()
        duration = end_time - start_time
        
        if response.status_code == 200:
            data = response.json()
            filename = data['filename']
            print(f"Success! Generated: {filename}")
            print(f"Time taken: {duration:.2f} seconds")
            
            # Check file size if running locally relative to this script
            file_path = os.path.join(OUTPUT_DIR, filename)
            if os.path.exists(file_path):
                size_mb = os.path.getsize(file_path) / (1024 * 1024)
                print(f"File size: {size_mb:.2f} MB")
            return duration
        else:
            print(f"Failed with status {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"Error: {e}")
        return None

if __name__ == "__main__":
    # Wait for server to start if running immediately after spawn
    print("Ensuring server is ready...")
    time.sleep(2)
    
    # 1. Warmup / Cache population (first run might be slower due to downloading)
    # print("Warmup run (populating OSM cache)...")
    # test_generation("Munich", "Germany", "preview")
    
    # 2. Test Preview Speed (Cached)
    print("\nBenchmark: Preview (Cached)")
    preview_time = test_generation("Munich", "Germany", "preview")
    
    # 3. Test Print Speed (Cached)
    print("\nBenchmark: Print (Cached)")
    print_time = test_generation("Munich", "Germany", "print")
    
    if preview_time and print_time:
        print(f"\nSummary:")
        print(f"Preview: {preview_time:.2f}s")
        print(f"Print:   {print_time:.2f}s")
        print(f"Speedup: {print_time / preview_time:.1f}x faster")
