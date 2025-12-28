
from fastapi.testclient import TestClient
from backend.main import app
import sys
import os

# Add backend to path if needed (though running from root usually works if backend is a package)
sys.path.append(os.getcwd())

client = TestClient(app)

def test_financial_position_endpoints():
    print("Testing /financial-position/summary...")
    response = client.get("/financial-position/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_assets" in data
    assert "total_liabilities" in data
    assert "net_worth" in data
    print(f" Financial Position: {data}")

    print("Testing /assets...")
    response = client.get("/assets")
    assert response.status_code == 200
    assets = response.json()
    assert isinstance(assets, list)
    if len(assets) > 0:
        assert "asset_id" in assets[0]
        assert "value" in assets[0]
    print(f" Assets found: {len(assets)}")
    
    print("Testing /liabilities...")
    response = client.get("/liabilities")
    assert response.status_code == 200
    liabilities = response.json()
    assert isinstance(liabilities, list)
    if len(liabilities) > 0:
        assert "liability_id" in liabilities[0]
    print(f" Liabilities found: {len(liabilities)}")

def test_ml_endpoints():
    print("Testing /analytics/forecast/revenue?months=12...")
    response = client.get("/analytics/forecast/revenue?months=12")
    if response.status_code != 200:
        print(f"FAILED. Status: {response.status_code}, Body: {response.text}")
    assert response.status_code == 200
    forecast = response.json()
    assert isinstance(forecast, list)
    # Check if forecast has content (might be empty if not enough data, but we generated 5 years)
    if len(forecast) > 0:
        assert "date" in forecast[0]
        assert "predicted_amount" in forecast[0]
    print(f" Revenue Forecast points: {len(forecast)}")

    print("Testing /analytics/anomalies...")
    response = client.get("/analytics/anomalies")
    assert response.status_code == 200
    anomalies = response.json()
    assert "anomalies" in anomalies
    assert "total_count" in anomalies
    print(f" Anomalies detected: {anomalies['total_count']}")

    print("Testing /analytics/recommendations...")
    response = client.get("/analytics/recommendations")
    assert response.status_code == 200
    recs = response.json()
    assert "recommendations" in recs
    print(f" Recommendations: {len(recs['recommendations'])}")

def test_scenario_endpoint():
    print("Testing /analytics/scenario...")
    # Test valid case
    params = "?enrollment_change=10&fee_change=5&grant_change=0&salary_change=5"
    response = client.get(f"/analytics/scenario{params}")
    assert response.status_code == 200, f"Scenario failed: {response.text}"
    
    data = response.json()
    assert "baseline" in data
    assert "projected" in data
    assert "impact" in data
    
    impact = data['impact']
    assert "revenue_change" in impact
    assert "expense_change" in impact
    assert "surplus_change" in impact
    assert "impact_summary" in impact
    
    # Check logic: +Enrol +Fee should increase revenue
    assert impact['revenue_change'] > 0
    
    print(f" Scenario Analysis Test Passed. Impact: {impact['impact_summary']}")



def test_correlation_endpoint():
    print("Testing /analytics/correlation...")
    response = client.get("/analytics/correlation")
    assert response.status_code == 200
    data = response.json()
    assert "correlations" in data
    corrs = data['correlations']
    
    # Check for keys I added
    required_keys = ['student_revenue', 'faculty_salary', 'utility_students', 'budget_utilization']
    for k in required_keys:
        assert k in corrs, f"Missing correlation key: {k}"
        # Values should be float
        val = corrs[k]
        assert isinstance(val, (int, float)), f"Value for {k} is not a number: {val}"
        
    print(f" Correlation data valid. Keys: {list(corrs.keys())}")


if __name__ == "__main__":
    try:
        test_financial_position_endpoints()
        test_ml_endpoints()
        test_scenario_endpoint()
        test_correlation_endpoint()
        print("✅ ALL BACKEND TESTS PASSED")
    except AssertionError as e:
        print(f"❌ TEST FAILED: {e}")
    except Exception as e:
        print(f"❌ ERROR: {e}")
