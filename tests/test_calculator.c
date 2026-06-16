#include <stdio.h>
#include <assert.h>
#include <limits.h>
#include "../src/calculator.c"

void test_calculate_total() {
    int values1[] = {1, 2, 3, 4, 5};
    assert(calculate_total(values1, 5) == 15);
    
    int values2[] = {INT_MAX, 1};
    // This should handle overflow properly and return 0
    assert(calculate_total(values2, 2) == 0);
    
    int values3[] = {INT_MIN, -1};
    // This should also handle underflow properly and return 0
    assert(calculate_total(values3, 2) == 0);
    
    int values4[] = {INT_MAX, INT_MAX};
    assert(calculate_total(values4, 2) == 0);
}

void test_calculate_average() {
    int values[] = {10, 20, 30, 40};
    assert(calculate_average(values, 4) == 25);
    
    int empty[] = {};
    assert(calculate_average(empty, 0) == 0);
    
    int overflow_values[] = {INT_MAX, 1};
    // Average of overflow case should return 0
    assert(calculate_average(overflow_values, 2) == 0);
}

void test_calculate_product() {
    int values[] = {2, 3, 4};
    assert(calculate_product(values, 3) == 24);
    
    int large_values[] = {INT_MAX, 2};
    // This should handle overflow properly and return 0
    assert(calculate_product(large_values, 2) == 0);
    
    int zero_values[] = {0, 100, 200};
    assert(calculate_product(zero_values, 3) == 0);
    
    int negative_values[] = {-2, 3, -4};
    assert(calculate_product(negative_values, 3) == 24);
    
    int min_values[] = {INT_MIN, 2};
    assert(calculate_product(min_values, 2) == 0);
}

int main() {
    test_calculate_total();
    test_calculate_average();
    test_calculate_product();
    printf("All tests passed!\n");
    return 0;
}