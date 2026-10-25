from typing import Optional, Dict, Any


class JobValidationError(Exception):
    """Custom exception for job validation errors."""
    pass


def validate_job_budget_range(job_data: Dict[str, Any]) -> None:
    """
    Validates that the job's budget range is not inverted.

    Args:
        job_data (Dict[str, Any]): The job data containing budget fields.

    Raises:
        JobValidationError: If the budget range is inverted (min > max).
    """
    min_budget: Optional[float] = job_data.get("budget_min")
    max_budget: Optional[float] = job_data.get("budget_max")

    if min_budget is not None and max_budget is not None:
        if min_budget > max_budget:
            raise JobValidationError(
                f"Invalid budget range: budget_min ({min_budget}) "
                f"cannot be greater than budget_max ({max_budget})."
            )


def validate_job(job_data: Dict[str, Any]) -> None:
    """
    Validates a job posting, including budget range.

    Args:
        job_data (Dict[str, Any]): The job data to validate.

    Raises:
        JobValidationError: If any validation fails.
    """
    # ... other validation logic can be placed here ...

    # Validate budget range
    validate_job_budget_range(job_data)

    # ... further validation logic ...


# --- TESTS ---

def test_validate_job_budget_range():
    # Valid range
    job1 = {"budget_min": 100, "budget_max": 200}
    try:
        validate_job_budget_range(job1)
    except JobValidationError:
        assert False, "Should not raise for valid range"

    # Equal min and max
    job2 = {"budget_min": 150, "budget_max": 150}
    try:
        validate_job_budget_range(job2)
    except JobValidationError:
        assert False, "Should not raise for equal min and max"

    # Inverted range
    job3 = {"budget_min": 300, "budget_max": 200}
    try:
        validate_job_budget_range(job3)
        assert False, "Should raise for inverted range"
    except JobValidationError:
        pass

    # Missing min
    job4 = {"budget_max": 200}
    try:
        validate_job_budget_range(job4)
    except JobValidationError:
        assert False, "Should not raise if min is missing"

    # Missing max
    job5 = {"budget_min": 200}
    try:
        validate_job_budget_range(job5)
    except JobValidationError:
        assert False, "Should not raise if max is missing"

    # Both missing
    job6 = {}
    try:
        validate_job_budget_range(job6)
    except JobValidationError:
        assert False, "Should not raise if both are missing"

    print("All tests passed.")


if __name__ == "__main__":
    test_validate_job_budget_range()