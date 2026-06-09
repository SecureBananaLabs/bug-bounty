from typing import Optional
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, model_validator, ValidationError
from fastapi.testclient import TestClient

app = FastAPI()


class JobBase(BaseModel):
    title: str
    budgetMin: Optional[float] = None
    budgetMax: Optional[float] = None

    @model_validator(mode="after")
    def check_budget_range(self) -> "JobBase":
        if (
            self.budgetMin is not None
            and self.budgetMax is not None
            and self.budgetMax < self.budgetMin
        ):
            raise ValueError("budgetMax must be greater than or equal to budgetMin")
        return self


class JobCreate(JobBase):
    pass


class JobUpdate(JobBase):
    # All fields optional for partial update; validation still runs if both are present
    title: Optional[str] = None
    budgetMin: Optional[float] = None
    budgetMax: Optional[float] = None


# In-memory storage for demo
jobs_db = {}
next_job_id = 1


@app.post("/jobs", status_code=status.HTTP_201_CREATED)
def create_job(job: JobCreate):
    global next_job_id
    job_id = next_job_id
    next_job_id += 1
    jobs_db[job_id] = job
    return {"id": job_id, **job.model_dump()}


@app.patch("/jobs/{job_id}")
def update_job(job_id: int, job_update: JobUpdate):
    if job_id not in jobs_db:
        raise HTTPException(status_code=404, detail="Job not found")
    stored = jobs_db[job_id]
    update_data = job_update.model_dump(exclude_unset=True)
    updated = stored.copy(update=update_data)
    # Re‑validate the combined object
    try:
        validated = JobBase(**updated.model_dump())
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=e.errors())
    jobs_db[job_id] = validated
    return {"id": job_id, **validated.model_dump()}


# Simple test/demo
if __name__ == "__main__":
    client = TestClient(app)

    # Valid creation
    resp = client.post("/jobs", json={"title": "Dev", "budgetMin": 100, "budgetMax": 500})
    assert resp.status_code == 201
    job_id = resp.json()["id"]
    print("Created job:", resp.json())

    # Invalid creation (inverted budget)
    resp = client.post(
        "/jobs", json={"title": "Bad", "budgetMin": 500, "budgetMax": 100}
    )
    assert resp.status_code == 422
    print("Rejected invalid creation:", resp.json())

    # Valid partial update (only budgetMin)
    resp = client.patch(f"/jobs/{job_id}", json={"budgetMin": 200})
    assert resp.status_code == 200
    print("Updated job (only budgetMin):", resp.json())

    # Invalid partial update (both fields present and inverted)
    resp = client.patch(
        f"/jobs/{job_id}", json={"budgetMin": 500, "budgetMax": 100}
    )
    assert resp.status_code == 422
    print("Rejected invalid partial update:", resp.json())

    # Valid partial update (both fields present and correct)
    resp = client.patch(
        f"/jobs/{job_id}", json={"budgetMin": 150, "budgetMax": 400}
    )
    assert resp.status_code == 200
    print("Updated job (both fields correct):", resp.json())

    print("All tests passed.")