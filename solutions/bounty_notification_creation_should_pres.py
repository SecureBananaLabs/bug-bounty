# notification_service.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional
import uuid
from fastapi.testclient import TestClient

app = FastAPI(title="Notification Service")

# In‑memory storage for demonstration
_notifications: List[Dict[str, Any]] = []


class NotificationCreate(BaseModel):
    """Fields a client may send when creating a notification.
    The service will ignore `id` and `read` if present."""
    id: Optional[str] = None          # client‑supplied id – ignored
    read: Optional[bool] = None       # client‑supplied read flag – ignored
    # Allow any additional payload fields (title, message, etc.)
    # Using a dict to capture arbitrary data.
    payload: Dict[str, Any] = Field(default_factory=dict)


class Notification(BaseModel):
    """Stored notification representation."""
    id: str
    read: bool
    payload: Dict[str, Any]


def _generate_id() -> str:
    """Generate a server‑owned unique identifier."""
    return str(uuid.uuid4())


@app.post("/notifications", response_model=Notification, status_code=201)
def create_notification(request: NotificationCreate) -> Notification:
    """Create a new notification.
    - Ignores client‑provided `id` and `read`.
    - Always generates a new server id.
    - Always sets `read` to False.
    """
    server_id = _generate_id()
    # Merge client payload, ensuring we do not accidentally overwrite id/read
    stored_payload = dict(request.payload)
    notification = Notification(
        id=server_id,
        read=False,
        payload=stored_payload,
    )
    _notifications.append(notification.dict())
    return notification


@app.get("/notifications", response_model=List[Notification])
def list_notifications() -> List[Notification]:
    """Return all stored notifications (for testing/demo)."""
    return [Notification(**n) for n in _notifications]


# Simple test/demo when run directly
if __name__ == "__main__":
    # Run the server
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)


# Example usage with TestClient (can be run as a script)
def _demo():
    client = TestClient(app)

    # 1. Client tries to set custom id and read=true
    resp = client.post(
        "/notifications",
        json={
            "id": "client-id-123",
            "read": True,
            "payload": {"title": "Hello", "message": "World"},
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    # Server must have overridden id and read
    assert data["id"] != "client-id-123"
    assert isinstance(data["id"], str) and len(data["id"]) > 0
    assert data["read"] is False
    assert data["payload"] == {"title": "Hello", "message": "World"}
    print("Test 1 passed:", data)

    # 2. Client omits id and read
    resp = client.post(
        "/notifications",
        json={"payload": {"title": "Foo", "message": "Bar"}},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["read"] is False
    assert data["payload"] == {"title": "Foo", "message": "Bar"}
    print("Test 2 passed:", data)

    # 3. List all notifications
    resp = client.get("/notifications")
    assert resp.status_code == 200
    listed = resp.json()
    assert len(listed) == 2
    print("All notifications:", listed)


if __name__ == "__demo__":
    _demo()  # This block won't run in normal execution; kept for reference
    # To run the demo, call: python -c "from notification_service import _demo; _demo()" 
```