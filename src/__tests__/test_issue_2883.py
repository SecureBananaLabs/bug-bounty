import pytest
from src.issue_2883 import process_data

def test_process_data_basic():
    data = [1, 2, 3, 4, 5]
    result = process_data(data)
    assert result == [2, 4, 6, 8, 10]

def test_process_data_empty():
    data = []
    result = process_data(data)
    assert result == []

def test_process_data_negative():
    data = [-1, 0, 3]
    result = process_data(data)
    assert result == [-2, 0, 6]

def test_process_data_large():
    data = [1000, 2000]
    result = process_data(data)
    assert result == [2000, 4000]