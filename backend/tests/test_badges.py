import pytest
from fastapi.testclient import TestClient

def test_get_user_badges(client: TestClient, auth_headers: dict):
    response = client.get("/api/v1/badges/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "badges" in data
    assert "level" in data
    assert "current_streak" in data
    assert "unlocked_count" in data
    assert "total_count" in data
    assert len(data["badges"]) >= 10
    
    # Check structure of a badge item
    first_badge = data["badges"][0]
    assert "id" in first_badge
    assert "title" in first_badge
    assert "tier" in first_badge
    assert "is_unlocked" in first_badge
    assert "progress_pct" in first_badge
