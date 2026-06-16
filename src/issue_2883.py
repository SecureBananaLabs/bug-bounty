def process_data(numbers):
    """
    Process a list of numbers by multiplying each by 2.
    Returns a new list with the results.
    """
    if not numbers:
        return []
    return [num * 2 for num in numbers]