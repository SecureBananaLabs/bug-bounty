from typing import Any, Dict, List, Optional

# Constants for input validation
MAX_QUERY_LENGTH = 256  # Set a reasonable maximum length for search queries

def is_valid_query(query: Optional[str]) -> bool:
    """
    Validates the search query input.

    Args:
        query (Optional[str]): The search query string.

    Returns:
        bool: True if the query is valid, False otherwise.
    """
    if query is None:
        return False
    if not isinstance(query, str):
        return False
    if not query.strip():
        return False
    if len(query) > MAX_QUERY_LENGTH:
        return False
    return True

def search_database(query: str) -> List[Dict[str, Any]]:
    """
    Dummy search function. Replace with actual search logic.

    Args:
        query (str): The validated search query.

    Returns:
        List[Dict[str, Any]]: List of search results.
    """
    # Placeholder implementation
    # In production, replace with actual search logic
    return [{"result": f"Found result for '{query}'"}]

def search_endpoint(request_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Secure search endpoint implementation with input validation and length limit.

    Args:
        request_data (Dict[str, Any]): The incoming request data containing the 'query'.

    Returns:
        Dict[str, Any]: The response dictionary.
    """
    query = request_data.get("query")

    if not is_valid_query(query):
        return {
            "status": "error",
            "message": (
                "Invalid search query. "
                f"Query must be a non-empty string up to {MAX_QUERY_LENGTH} characters."
            )
        }

    # Proceed with search if input is valid
    results = search_database(query)
    return {
        "status": "success",
        "results": results
    }

# --- TESTS ---

def _test_search_endpoint() -> None:
    """
    Runs basic tests for the search_endpoint function.
    """
    # Test: Valid query
    valid_query = "banana"
    response = search_endpoint({"query": valid_query})
    assert response["status"] == "success"
    assert isinstance(response["results"], list)

    # Test: Empty query
    response = search_endpoint({"query": ""})
    assert response["status"] == "error"

    # Test: Query too long
    long_query = "a" * (MAX_QUERY_LENGTH + 1)
    response = search_endpoint({"query": long_query})
    assert response["status"] == "error"

    # Test: Query is None
    response = search_endpoint({"query": None})
    assert response["status"] == "error"

    # Test: Query missing
    response = search_endpoint({})
    assert response["status"] == "error"

    # Test: Query is not a string
    response = search_endpoint({"query": 123})
    assert response["status"] == "error"

if __name__ == "__main__":
    _test_search_endpoint()