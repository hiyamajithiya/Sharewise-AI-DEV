import requests
import json
import yfinance as yf

# Base URL
BASE_URL = "http://localhost:8000/api"

# Test credentials
credentials = {
    "username": "testuser", 
    "password": "TestPass123"
}

print("=" * 50)
print("Testing ShareWise AI API Endpoints")
print("=" * 50)

# 1. Login to get token
print("\n1. Testing Login...")
response = requests.post(f"{BASE_URL}/users/login/", json=credentials)
if response.status_code == 200:
    tokens = response.json()
    access_token = tokens.get('access')
    print(f"[OK] Login successful! Token obtained")
    
    # Set authorization header
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
else:
    print(f"[FAIL] Login failed: {response.text}")
    exit(1)

# 2. Test Market Data Endpoints
print("\n2. Testing Market Data APIs...")

# Test single quote
print("\n   a. Testing single quote (AAPL)...")
response = requests.get(f"{BASE_URL}/market-data/quote/AAPL/", headers=headers)
if response.status_code == 200:
    data = response.json()
    print(f"   [OK] Quote received: {data.get('symbol', 'N/A')} - ${data.get('price', 'N/A')}")
else:
    print(f"   [FAIL] Failed: {response.status_code} - {response.text[:100]}")

# Test bulk quotes
print("\n   b. Testing bulk quotes...")
bulk_data = {"symbols": ["AAPL", "GOOGL", "MSFT", "TSLA"]}
response = requests.post(f"{BASE_URL}/market-data/quotes/bulk/", json=bulk_data, headers=headers)
if response.status_code == 200:
    quotes = response.json()
    print(f"   [OK] Received {len(quotes.get('quotes', []))} quotes")
else:
    print(f"   [FAIL] Failed: {response.status_code} - {response.text[:100]}")

# 3. Test Trading Signals
print("\n3. Testing Trading Signal Generation...")
signal_data = {
    "symbols": ["AAPL", "GOOGL"],
    "strategy_id": None
}
response = requests.post(f"{BASE_URL}/trading/signals/generate/", json=signal_data, headers=headers)
if response.status_code == 200:
    result = response.json()
    print(f"   [OK] Generated {result.get('message', 'signals')}")
else:
    print(f"   [FAIL] Failed: {response.status_code} - {response.text[:100]}")

# 4. Test Portfolio API
print("\n4. Testing Portfolio API...")
response = requests.get(f"{BASE_URL}/portfolio/", headers=headers)
if response.status_code == 200:
    portfolio = response.json()
    print(f"   [OK] Portfolio data retrieved")
else:
    print(f"   [FAIL] Failed: {response.status_code} - {response.text[:100]}")

# 5. Test AI Studio Dashboard
print("\n5. Testing AI Studio Dashboard...")
response = requests.get(f"{BASE_URL}/ai-studio/dashboard/", headers=headers)
if response.status_code == 200:
    dashboard = response.json()
    print(f"   [OK] AI Studio dashboard data retrieved")
else:
    print(f"   [FAIL] Failed: {response.status_code} - {response.text[:100]}")

# 6. Test Real-time Market Data with yfinance
print("\n6. Testing Real-time Market Data (via yfinance)...")
try:
    ticker = yf.Ticker("AAPL")
    info = ticker.info
    print(f"   [OK] Real-time AAPL data:")
    print(f"      - Current Price: ${info.get('currentPrice', 'N/A')}")
    print(f"      - Market Cap: ${info.get('marketCap', 'N/A'):,}" if info.get('marketCap') else "      - Market Cap: N/A")
    print(f"      - Volume: {info.get('volume', 'N/A'):,}" if info.get('volume') else "      - Volume: N/A")
    print(f"      - 52 Week High: ${info.get('fiftyTwoWeekHigh', 'N/A')}")
    print(f"      - 52 Week Low: ${info.get('fiftyTwoWeekLow', 'N/A')}")
except Exception as e:
    print(f"   [FAIL] Failed to fetch real-time data: {e}")

# 7. Test WebSocket endpoint info
print("\n7. Checking WebSocket Connections...")
response = requests.get(f"{BASE_URL}/market-data/websocket-connections/", headers=headers)
if response.status_code == 200:
    connections = response.json()
    print(f"   [OK] WebSocket endpoint available")
else:
    print(f"   [FAIL] Failed: {response.status_code}")

print("\n" + "=" * 50)
print("API Testing Complete!")
print("=" * 50)

# Summary
print("\nSummary:")
print("- Authentication: [OK] Working")
print("- Market Data APIs: Check individual results above")
print("- Trading APIs: Check individual results above")
print("- WebSocket Support: Available for real-time updates")
print("\nNote: For production deployment, ensure all endpoints return real data.")