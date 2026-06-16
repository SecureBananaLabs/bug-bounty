import pytest
from src.issue_2755 import process_data

def test_process_data():
    # Test with valid input
    result = process_data([1, 2, 3])
    assert result == [1, 4, 9]
    
    # Test with empty list
    result = process_data([])
    assert result == []
    
    # Test with negative numbers
    result = process_data([-2, -1, 0, 1, 2])
    assert result == [4, 1, 0, 1, 4]

def test_process_data_invalid_input():
    # Test with non-list input
    with pytest.raises(TypeError):
        process_data("not a list")
    
    # Test with list containing non-numbers
    with pytest.raises(TypeError):
        process_data([1, "two", 3])