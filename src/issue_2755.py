def process_data(data):
    """
    Process a list of numbers by squaring each element.
    
    Args:
        data: List of numbers
        
    Returns:
        List of squared numbers
        
    Raises:
        TypeError: If input is not a list or contains non-numeric values
    """
    if not isinstance(data, list):
        raise TypeError("Input must be a list")
    
    result = []
    for item in data:
        if not isinstance(item, (int, float)):
            raise TypeError("All elements must be numbers")
        result.append(item * item)
    
    return result