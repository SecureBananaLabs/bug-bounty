"""
search_query_sanitizer.py
Sanitizes and validates the `q` search parameter for GET /api/search.

Fix for: https://github.com/SecureBananaLabs/bug-bounty/issues/844
Ref:     https://github.com/SecureBananaLabs/bug-bounty/issues/838
"""

MAX_QUERY_LENGTH = 200


class SearchQueryError(ValueError):
    """Raised when a search query fails validation."""
    pass


def sanitize_search_query(raw_q) -> str:
    """
    Coerce, validate, and sanitize a search query value.

    Handles the two main failure modes in GET /api/search:
      1. `q` arrives as a list  (e.g. ?q=one&q=two  → req.query.q is ['one','two'])
      2. `q` is longer than MAX_QUERY_LENGTH characters

    Args:
        raw_q: The raw value of req.query.q — may be str, list, or None.

    Returns:
        A clean, stripped string ready to pass into globalSearch().

    Raises:
        SearchQueryError: If the query is empty after stripping, or too long.
    """
    # --- 1. Coerce list → string (take first non-empty element) ---
    if isinstance(raw_q, (list, tuple)):
        candidates = [v for v in raw_q if isinstance(v, str) and v.strip()]
        raw_q = candidates[0] if candidates else ""

    # --- 2. Ensure we have a string ---
    if not isinstance(raw_q, str):
        raw_q = ""

    # --- 3. Strip whitespace ---
    q = raw_q.strip()

    # --- 4. Reject empty ---
    if not q:
        raise SearchQueryError("Search query must not be empty.")

    # --- 5. Enforce length cap ---
    if len(q) > MAX_QUERY_LENGTH:
        raise SearchQueryError(
            f"Search query exceeds maximum length of {MAX_QUERY_LENGTH} characters "
            f"(got {len(q)})."
        )

    return q


# ---------------------------------------------------------------------------
# Express/Flask middleware example
# ---------------------------------------------------------------------------
def search_middleware(req_query: dict) -> str:
    """
    Drop-in helper for the /api/search route handler.

    Usage (Flask):
        from search_query_sanitizer import search_middleware, SearchQueryError

        @app.route('/api/search')
        def search():
            try:
                q = search_middleware(request.args)
            except SearchQueryError as e:
                return jsonify({"error": str(e)}), 400
            results = global_search(q)
            return jsonify(results)
    """
    raw = req_query.get("q", "")
    return sanitize_search_query(raw)


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import sys

    OK = "\033[32mPASS\033[0m"
    FAIL = "\033[31mFAIL\033[0m"
    errors = 0

    cases = [
        # (input,          expect_value,  expect_error)
        ("hello",          "hello",       None),
        ("  spaces  ",     "spaces",      None),
        (["one", "two"],   "one",         None),
        (["", "second"],   "second",      None),
        ("",               None,          SearchQueryError),
        ("   ",            None,          SearchQueryError),
        (None,             None,          SearchQueryError),
        ("x" * 201,        None,          SearchQueryError),
        ("x" * 200,        "x" * 200,    None),
    ]

    for raw, expected, exc_type in cases:
        try:
            result = sanitize_search_query(raw)
            if exc_type:
                print(f"{FAIL}  expected {exc_type.__name__} for {repr(raw)!r:.40}")
                errors += 1
            elif result != expected:
                print(f"{FAIL}  {repr(raw)!r:.30} → {repr(result)!r} (expected {repr(expected)!r})")
                errors += 1
            else:
                print(f"{OK}   {repr(raw)!r:.40} → {repr(result)!r:.30}")
        except SearchQueryError as e:
            if exc_type is SearchQueryError:
                print(f"{OK}   {repr(raw)!r:.40} → SearchQueryError: {e}")
            else:
                print(f"{FAIL}  unexpected SearchQueryError for {repr(raw)!r:.40}: {e}")
                errors += 1

    print()
    if errors:
        print(f"{errors} test(s) FAILED.")
        sys.exit(1)
    else:
        print("All tests passed.")
