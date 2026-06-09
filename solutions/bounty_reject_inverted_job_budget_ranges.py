from pydantic import BaseModel, validator, ValidationError
from typing import Optional

class JobBase(BaseModel):
    title: str
    budgetMin: Optional[float] = None
    budgetMax: Optional[float] = None

    @validator('budgetMax')
    def check_budget_range(cls, v, values):
        # Ensure budgetMax is not less than budgetMin when both are provided
        if 'budgetMin' in values and values['budgetMin'] is not None:
            if v is not None and v < values['budgetMin']:
                raise ValueError('budgetMax must be greater than or equal to budgetMin')
        return v

    @validator('budgetMin')
    def check_budget_min(cls, v, values):
        # Ensure budgetMin is not greater than budgetMax when both are provided
        if 'budgetMax' in values and values['budgetMax'] is not None:
            if v is not None and v > values['budgetMax']:
                raise ValueError('budgetMin must be less than or equal to budgetMax')
        return v

class JobCreate(JobBase):
    # Creation model; title required, budgets optional but validated if both present
    pass

class JobUpdate(JobBase):
    # Update model; all fields optional for partial updates, validation runs only when both are present
    pass

def test():
    # Valid job creation
    try:
        job = JobCreate(title="Developer", budgetMin=100, budgetMax=500)
        print("Valid creation:", job)
    except ValidationError as e:
        print("Unexpected error:", e)

    # Inverted job creation should fail
    try:
        job = JobCreate(title="Designer", budgetMin=500, budgetMax=100)
        print("Invalid creation succeeded (should not happen):", job)
    except ValidationError as e:
        print("Inverted creation correctly rejected:", e)

    # Partial update with only budgetMin
    try:
        update = JobUpdate(budgetMin=200)
        print("Partial update with only budgetMin:", update)
    except ValidationError as e:
        print("Unexpected error:", e)

    # Partial update with only budgetMax
    try:
        update = JobUpdate(budgetMax=800)
        print("Partial update with only budgetMax:", update)
    except ValidationError as e:
        print("Unexpected error:", e)

    # Partial update with both inverted should fail
    try:
        update = JobUpdate(budgetMin=600, budgetMax=400)
        print("Partial update with both inverted succeeded (should not happen):", update)
    except ValidationError as e:
        print("Partial update inverted correctly rejected:", e)

    # Partial update with both valid
    try:
        update = JobUpdate(budgetMin=300, budgetMax=700)
        print("Partial update with both valid:", update)
    except ValidationError as e:
        print("Unexpected error:", e)

if __name__ == "__main__":
    test()