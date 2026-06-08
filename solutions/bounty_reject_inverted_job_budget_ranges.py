from pydantic import BaseModel, validator, ValidationError
from typing import Optional

class JobBase(BaseModel):
    title: str
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None

    @validator('budget_max')
    def check_budget_range(cls, v, values):
        # Ensure max is not less than min when both are provided
        if v is not None and 'budget_min' in values and values['budget_min'] is not None:
            if v < values['budget_min']:
                raise ValueError('budget_max must be greater than or equal to budget_min')
        return v

class JobCreate(JobBase):
    pass

class JobUpdate(BaseModel):
    title: Optional[str] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None

    @validator('budget_max')
    def check_budget_range_update(cls, v, values):
        if v is not None and 'budget_min' in values and values['budget_min'] is not None:
            if v < values['budget_min']:
                raise ValueError('budget_max must be greater than or equal to budget_min')
        return v

if __name__ == "__main__":
    # Valid job creation
    try:
        job = JobCreate(title="Developer", budget_min=100, budget_max=500)
        print("Valid job created:", job)
    except ValidationError as e:
        print("Unexpected error:", e)

    # Inverted budget range creation should fail
    try:
        JobCreate(title="Designer", budget_min=500, budget_max=100)
    except ValidationError as e:
        print("Inverted creation correctly rejected:", e)

    # Partial update with only budget_max (should pass)
    try:
        update = JobUpdate(budget_max=300)
        print("Partial update with only budget_max:", update)
    except ValidationError as e:
        print("Unexpected error:", e)

    # Partial update with both fields inverted (should fail)
    try:
        JobUpdate(budget_min=400, budget_max=200)
    except ValidationError as e:
        print("Inverted partial update correctly rejected:", e)

    # Partial update with only budget_min (should pass)
    try:
        update = JobUpdate(budget_min=150)
        print("Partial update with only budget_min:", update)
    except ValidationError as e:
        print("Unexpected error:", e)