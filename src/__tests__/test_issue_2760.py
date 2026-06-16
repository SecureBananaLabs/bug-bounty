import unittest
from src.issue_2760 import validate_input

class TestIssue2760(unittest.TestCase):
    def test_valid_input(self):
        self.assertTrue(validate_input("abc123"))
        self.assertTrue(validate_input("test"))
    
    def test_invalid_input_empty(self):
        self.assertFalse(validate_input(""))
    
    def test_invalid_input_special_chars(self):
        self.assertFalse(validate_input("abc@123"))
        self.assertFalse(validate_input("test!"))

if __name__ == '__main__':
    unittest.main()