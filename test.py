import os

import requests

BASE_URL = "https://zit952ej5b.execute-api.eu-west-3.amazonaws.com/prd/api"

SERVICE_ID = 75  # replace with the actual service ID
NB_RDV = 1


def build_headers():
    headers = {}

    token = os.getenv("API_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"

    api_key = os.getenv("API_KEY")
    if api_key:
        headers["x-api-key"] = api_key

    return headers


def get_json(url):
    r = requests.get(url, headers=build_headers(), timeout=30)

    if r.status_code == 401:
        print("401 Unauthorized")
        print("The API rejected the request. You likely need an auth token or API key.")
        print("Set API_TOKEN or API_KEY before running this script.")
        print(f"URL: {url}")
        print(f"Response: {r.text[:500]}")
        raise SystemExit(1)

    r.raise_for_status()
    return r.json()

def get_available_dates():
    url = f"{BASE_URL}/calandardates/{SERVICE_ID}/nb/{NB_RDV}"
    return get_json(url)

def get_time_slots(date):
    url = f"{BASE_URL}/timeSlots/{SERVICE_ID}/{date}/nb/{NB_RDV}"
    return get_json(url)

dates = get_available_dates()

if not dates:
    print("❌ No appointments available")
else:
    print(f"✅ {len(dates)} available date(s) found")

    for date in dates:
        print(f"\nDate: {date}")
        slots = get_time_slots(date)

        if slots:
            print("Available slots:")
            for slot in slots:
                print("  ", slot)
        else:
            print("No slots on this date")
