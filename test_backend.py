"""
Smoke tests for the Supply Chain Intelligence API.

Validates that every endpoint responds 200 and returns the expected shape, by
calling a running server. Start the API first, then run this from the root:

    # terminal 1
    cd backend && python -m uvicorn main:app --port 8000
    # terminal 2
    python test_backend.py

Override the target with BASE_URL (e.g. a deployed instance).
"""

import os
import sys

import requests

BASE = os.getenv("BASE_URL", "http://127.0.0.1:8000")


def _get(path):
    return requests.get(f"{BASE}{path}", timeout=40)


def _post(path, body):
    return requests.post(f"{BASE}{path}", json=body, timeout=40)


def test_health():
    r = _get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_executive_summary():
    r = _get("/api/executive-summary")
    assert r.status_code == 200
    data = r.json()
    for key in ["total_revenue", "total_expenses", "net_surplus", "operating_margin_pct",
                "health_score", "risk_level", "liquidity_ratio", "net_worth"]:
        assert key in data, f"missing {key}"


def test_trends():
    r = _get("/api/trends?months=12")
    assert r.status_code == 200
    rows = r.json()
    assert isinstance(rows, list) and rows
    assert {"period", "revenue", "expenses", "surplus"} <= set(rows[0])


def test_forecasts():
    for path in ["/api/forecast/revenue", "/api/forecast/expense"]:
        r = _get(f"{path}?periods=6")
        assert r.status_code == 200
        data = r.json()
        assert "forecast" in data and len(data["forecast"]) == 6
        assert {"period", "forecast", "lower", "upper"} <= set(data["forecast"][0])


def test_vendors():
    r = _get("/api/vendors?limit=5")
    assert r.status_code == 200
    rows = r.json()
    assert rows and {"vendor", "spend", "transactions", "risk_tier"} <= set(rows[0])


def test_expense_breakdown_and_variance():
    r1 = _get("/api/expense-breakdown")
    assert r1.status_code == 200 and r1.json()
    assert {"category", "amount", "share_pct", "yoy_change_pct"} <= set(r1.json()[0])

    r2 = _get("/api/budget-variance")
    assert r2.status_code == 200 and r2.json()
    assert {"category", "planned", "actual", "variance"} <= set(r2.json()[0])


def test_financial_position():
    r = _get("/api/financial-position")
    assert r.status_code == 200
    assert {"total_assets", "total_liabilities", "net_worth", "liquidity_ratio"} <= set(r.json())


def test_anomalies():
    r = _get("/api/anomalies?threshold=2.5")
    assert r.status_code == 200
    assert "anomalies" in r.json() and "total_count" in r.json()


def test_scenario():
    r = _get("/api/scenario?enrollment_change=10&fee_change=5")
    assert r.status_code == 200
    data = r.json()
    assert {"baseline", "projected", "impact"} <= set(data)
    assert "surplus_change" in data["impact"]


def test_ai_endpoints():
    r1 = _get("/api/ai/executive-summary")
    assert r1.status_code == 200
    data = r1.json()
    assert "observations" in data and "actions" in data
    assert data["source"] in ("openrouter", "rule-based")

    r2 = _post("/api/ai/ask", {"question": "Why are expenses increasing?"})
    assert r2.status_code == 200
    assert "answer" in r2.json()


def test_validation_guards():
    assert _get("/api/forecast/revenue?periods=999").status_code == 400
    assert _post("/api/ai/ask", {"question": ""}).status_code == 400


if __name__ == "__main__":
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    passed = 0
    for t in tests:
        try:
            t()
            print(f"  PASS  {t.__name__}")
            passed += 1
        except Exception as e:  # noqa: BLE001
            print(f"  FAIL  {t.__name__}: {e}")
    print(f"\n{passed}/{len(tests)} tests passed")
    sys.exit(0 if passed == len(tests) else 1)
