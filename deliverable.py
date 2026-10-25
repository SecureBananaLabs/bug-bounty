from typing import Optional, Tuple


class JobValidationError(Exception):
    """Custom exception for job validation errors."""
    pass


def validate_budget_range(budget_min: Optional[float], budget_max: Optional[float]) -> None:
    """
    Validates that the budget range is not inverted.

    Args:
        budget_min (Optional[float]): The minimum budget value.
        budget_max (Optional[float]): The maximum budget value.

    Raises:
        JobValidationError: If the budget range is inverted (min > max).
    """
    if budget_min is not None and budget_max is not None:
        if budget_min > budget_max:
            raise JobValidationError(
                f"Invalid budget range: minimum ({budget_min}) exceeds maximum ({budget_max})."
            )


def validate_job_posting(
    title: str,
    description: str,
    budget_min: Optional[float],
    budget_max: Optional[float],
    other_fields: Optional[dict] = None
) -> None:
    """
    Validates a job posting, including budget range.

    Args:
        title (str): Job title.
        description (str): Job description.
        budget_min (Optional[float]): Minimum budget.
        budget_max (Optional[float]): Maximum budget.
        other_fields (Optional[dict]): Other job fields.

    Raises:
        JobValidationError: If any validation fails.
    """
    if not title or not title.strip():
        raise JobValidationError("Job title is required.")
    if not description or not description.strip():
        raise JobValidationError("Job description is required.")
    validate_budget_range(budget_min, budget_max)
    # Additional validations can be added here.


# --- TESTS ---

def test_validate_budget_range() -> None:
    # Valid ranges
    validate_budget_range(100, 200)
    validate_budget_range(100, 100)
    validate_budget_range(None, 100)
    validate_budget_range(100, None)
    validate_budget_range(None, None)

    # Inverted range
    try:
        validate_budget_range(200, 100)
        assert False, "Expected JobValidationError for inverted range"
    except JobValidationError as e:
        assert "minimum (200)" in str(e)

def test_validate_job_posting() -> None:
    # Valid job
    validate_job_posting(
        title="Security Researcher",
        description="Find vulnerabilities.",
        budget_min=50,
        budget_max=100
    )

    # Inverted budget
    try:
        validate_job_posting(
            title="Security Researcher",
            description="Find vulnerabilities.",
            budget_min=200,
            budget_max=100
        )
        assert False, "Expected JobValidationError for inverted budget"
    except JobValidationError as e:
        assert "minimum (200)" in str(e)

    # Missing title
    try:
        validate_job_posting(
            title="",
            description="Find vulnerabilities.",
            budget_min=50,
            budget_max=100
        )
        assert False, "Expected JobValidationError for missing title"
    except JobValidationError as e:
        assert "title is required" in str(e)

    # Missing description
    try:
        validate_job_posting(
            title="Security Researcher",
            description="",
            budget_min=50,
            budget_max=100
        )
        assert False, "Expected JobValidationError for missing description"
    except JobValidationError as e:
        assert "description is required" in str(e)


if __name__ == "__main__":
    test_validate_budget_range()
    test_validate_job_posting()
    print("All tests passed.")