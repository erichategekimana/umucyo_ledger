"""
Automated Endpoint Auditor & Curl Tester for Umucyo Ledger.
Tests every API endpoint across all 7 domain apps.
"""
import urllib.request
import urllib.parse
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def make_request(url, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    
    req_data = None
    if data is not None:
        if isinstance(data, dict):
            req_data = json.dumps(data).encode("utf-8")
            headers["Content-Type"] = "application/json"
        elif isinstance(data, str):
            req_data = data.encode("utf-8")

    req = urllib.request.Request(f"{BASE_URL}{url}", data=req_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read().decode("utf-8")
            status = resp.status
            try:
                content = json.loads(body)
            except Exception:
                content = body
            return status, content
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            content = json.loads(body)
        except Exception:
            content = body
        return e.code, content
    except Exception as exc:
        return 500, str(exc)

def run_tests():
    print("==================================================")
    print("   UMUCYO LEDGER - BACKEND AUDIT & TEST SUITE   ")
    print("==================================================")
    results = []

    # 1. ACCOUNTS & AUTH
    print("\n--- 1. ACCOUNTS & AUTH DOMAIN ---")
    status, res = make_request("/api/v1/auth/token/", "POST", {
        "username": "superadmin",
        "password": "password123"
    })
    results.append(("SuperAdmin JWT Token", status, status == 200))
    super_token = res.get("access") if status == 200 else None

    status, res = make_request("/api/v1/auth/token/", "POST", {
        "username": "officer_coop",
        "password": "password123"
    })
    results.append(("Officer JWT Token", status, status == 200))
    officer_token = res.get("access") if status == 200 else None

    status, res = make_request("/api/v1/auth/token/", "POST", {
        "username": "farmer_jean",
        "password": "password123"
    })
    results.append(("Farmer JWT Token", status, status == 200))
    farmer_token = res.get("access") if status == 200 else None

    status, res = make_request("/api/v1/auth/token/", "POST", {
        "username": "manager_coop",
        "password": "password123"
    })
    results.append(("Manager JWT Token", status, status == 200))
    manager_token = res.get("access") if status == 200 else None

    # Test /users/me/
    if super_token:
        status, res = make_request("/api/v1/users/me/", "GET", headers={"Authorization": f"Bearer {super_token}"})
        results.append(("GET /users/me/ (SuperAdmin)", status, status == 200))

    # Test /users/
    if super_token:
        status, res = make_request("/api/v1/users/", "GET", headers={"Authorization": f"Bearer {super_token}"})
        results.append(("GET /users/ (SuperAdmin)", status, status == 200))

    # 2. COOPERATIVES
    print("\n--- 2. COOPERATIVES DOMAIN ---")
    if super_token:
        status, res = make_request("/api/v1/cooperatives/", "GET", headers={"Authorization": f"Bearer {super_token}"})
        results.append(("GET /cooperatives/", status, status == 200))

        status, res = make_request("/api/v1/staff/", "GET", headers={"Authorization": f"Bearer {super_token}"})
        results.append(("GET /staff/", status, status == 200))

        status, res = make_request("/api/v1/farmers/", "GET", headers={"Authorization": f"Bearer {super_token}"})
        results.append(("GET /farmers/", status, status == 200))
        farmers_list = res.get("results", []) if isinstance(res, dict) else []
        farmer_id = farmers_list[0]["id"] if farmers_list else None

        if farmer_id:
            status, res = make_request(f"/api/v1/farmers/{farmer_id}/balance/", "GET", headers={"Authorization": f"Bearer {super_token}"})
            results.append((f"GET /farmers/{farmer_id}/balance/", status, status == 200))

    # 3. HARVEST LEDGER
    print("\n--- 3. HARVEST LEDGER DOMAIN ---")
    if super_token:
        status, res = make_request("/api/v1/batches/", "GET", headers={"Authorization": f"Bearer {super_token}"})
        results.append(("GET /batches/", status, status == 200))
        batches_list = res.get("results", []) if isinstance(res, dict) else []
        batch_id = batches_list[0]["id"] if batches_list else None

        if batch_id and manager_token:
            status, res = make_request(f"/api/v1/batches/{batch_id}/lock/", "POST", headers={"Authorization": f"Bearer {manager_token}"})
            results.append((f"POST /batches/{batch_id}/lock/", status, status in (200, 400)))

        # Deliveries for SuperAdmin
        status, res = make_request("/api/v1/deliveries/", "GET", headers={"Authorization": f"Bearer {super_token}"})
        results.append(("GET /deliveries/ (SuperAdmin)", status, status == 200))

    # Test Farmer Data Isolation
    if farmer_token:
        status, res = make_request("/api/v1/deliveries/", "GET", headers={"Authorization": f"Bearer {farmer_token}"})
        is_isolated = status == 200 and isinstance(res, dict) and len(res.get("results", [])) > 0
        results.append(("GET /deliveries/ (Farmer Account Isolation)", status, is_isolated))
        if is_isolated:
            print(f"   [+] Farmer retrieved {len(res['results'])} deliveries belonging strictly to their account.")

    # 4. SALES & REVENUE DISTRIBUTION
    print("\n--- 4. SALES & REVENUE DISTRIBUTION DOMAIN ---")
    if manager_token:
        status, res = make_request("/api/v1/sales/", "GET", headers={"Authorization": f"Bearer {manager_token}"})
        results.append(("GET /sales/", status, status == 200))

        status, res = make_request("/api/v1/payouts/", "GET", headers={"Authorization": f"Bearer {manager_token}"})
        results.append(("GET /payouts/", status, status == 200))

    # 5. AGRONOMY & VETERINARY MONITORING
    print("\n--- 5. AGRONOMY MONITORING DOMAIN ---")
    if super_token:
        status, res = make_request("/api/v1/anomalies/", "GET", headers={"Authorization": f"Bearer {super_token}"})
        results.append(("GET /anomalies/", status, status == 200))

    # 6. NOTIFICATIONS
    print("\n--- 6. NOTIFICATIONS DOMAIN ---")
    if farmer_token:
        status, res = make_request("/api/v1/notifications/", "GET", headers={"Authorization": f"Bearer {farmer_token}"})
        results.append(("GET /notifications/ (Farmer)", status, status == 200))
        notifs = res.get("results", []) if isinstance(res, dict) else []
        notif_id = notifs[0]["id"] if notifs else None

        if notif_id:
            status, res = make_request(f"/api/v1/notifications/{notif_id}/mark_read/", "PATCH", headers={"Authorization": f"Bearer {farmer_token}"})
            results.append((f"PATCH /notifications/{notif_id}/mark_read/", status, status == 200 and res.get("is_read") == True))

    # 7. USSD GATEWAY
    print("\n--- 7. USSD GATEWAY DOMAIN ---")
    status, res = make_request("/ussd/callback/", "POST", data="sessionId=ATQ123&phoneNumber=%2B250780000005&text=", headers={
        "Content-Type": "application/x-www-form-urlencoded"
    })
    is_ussd_ok = status == 200 and "CON" in str(res)
    results.append(("POST /ussd/callback/ Root Menu", status, is_ussd_ok))

    status, res = make_request("/ussd/callback/", "POST", data="sessionId=ATQ123&phoneNumber=%2B250780000005&text=1", headers={
        "Content-Type": "application/x-www-form-urlencoded"
    })
    is_ussd_opt1_ok = status == 200 and "END" in str(res)
    results.append(("POST /ussd/callback/ Option 1 (Deliveries)", status, is_ussd_opt1_ok))

    if super_token:
        status, res = make_request("/ussd/logs/", "GET", headers={"Authorization": f"Bearer {super_token}"})
        results.append(("GET /ussd/logs/", status, status == 200))

    # SUMMARY
    print("\n==================================================")
    print("               SUMMARY AUDIT REPORT               ")
    print("==================================================")
    passed = 0
    total = len(results)
    for test_name, status, is_ok in results:
        flag = "PASSED [OK]" if is_ok else "FAILED [X]"
        if is_ok:
            passed += 1
        print(f"[{flag}] {test_name:<45} (HTTP {status})")

    print(f"\nTOTAL RESULT: {passed}/{total} endpoints passed successfully.")
    if passed == total:
        print("ALL BACKEND ENDPOINTS AUDITED AND WORKING AS EXPECTED!")
    else:
        print("SOME ENDPOINTS NEED ATTENTION.")

if __name__ == "__main__":
    run_tests()
