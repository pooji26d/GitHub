from copy import deepcopy
import pytest
from fastapi.testclient import TestClient
import src.app as app_module

# Snapshot original in-memory activities so tests can restore state
_ORIGINAL_ACTIVITIES = deepcopy(app_module.activities)


@pytest.fixture
def client():
    """Return a TestClient for the FastAPI app."""
    return TestClient(app_module.app)


@pytest.fixture(autouse=True)
def reset_state():
    """Reset the app's in-memory `activities` before and after each test."""
    app_module.activities.clear()
    app_module.activities.update(deepcopy(_ORIGINAL_ACTIVITIES))
    yield
    app_module.activities.clear()
    app_module.activities.update(deepcopy(_ORIGINAL_ACTIVITIES))
