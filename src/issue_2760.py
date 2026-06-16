import re

def validate_input(input_str: str) -> bool:
    """
    Validate that input contains only alphanumeric characters and is not empty.
    """
    if not input_str:
        return False
    pattern = r'^[a-zA-Z0-9]+$'
    return bool(re.match(pattern, input_str))