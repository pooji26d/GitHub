"""AAA-style tests for the activities endpoints."""


def test_get_activities_returns_structure(client):
    # Arrange (client fixture)

    # Act
    resp = client.get("/activities")

    # Assert
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data
    assert "participants" in data["Chess Club"]


def test_signup_adds_participant(client):
    # Arrange
    activity = "Chess Club"
    email = "newstudent@mergington.edu"

    # Act
    resp = client.post(f"/activities/{activity}/signup", params={"email": email})

    # Assert
    assert resp.status_code == 200
    assert "Signed up" in resp.json().get("message", "")

    # Verify participant was added
    activities = client.get("/activities").json()
    assert email in activities[activity]["participants"]


def test_duplicate_signup_returns_400(client):
    # Arrange
    activity = "Chess Club"
    email = "michael@mergington.edu"  # initially present

    # Act
    resp = client.post(f"/activities/{activity}/signup", params={"email": email})

    # Assert
    assert resp.status_code == 400
    assert "already" in resp.json().get("detail", "").lower()
