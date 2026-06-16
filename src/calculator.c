#include <stdio.h>
#include <stdlib.h>
#include <limits.h>
#include <stdbool.h>

bool safe_add(int* result, int a, int b) {
    if ((b > 0 && a > INT_MAX - b) || (b < 0 && a < INT_MIN - b)) {
        return false;
    }
    *result = a + b;
    return true;
}

bool safe_multiply(int* result, int a, int b) {
    if (a > 0) {
        if (b > 0) {
            if (a > INT_MAX / b) return false;
        } else if (b < 0) {
            if (b < INT_MIN / a) return false;
        }
    } else if (a < 0) {
        if (b > 0) {
            if (a < INT_MIN / b) return false;
        } else if (b < 0) {
            if (a < INT_MAX / b) return false;
        }
    }
    *result = a * b;
    return true;
}

int calculate_total(int* values, int count) {
    int total = 0;
    for (int i = 0; i < count; i++) {
        if (!safe_add(&total, total, values[i])) {
            // Handle overflow - return error or saturated value
            // Based on similar fixes in the codebase, return 0 on overflow
            return 0;
        }
    }
    return total;
}

int calculate_average(int* values, int count) {
    if (count == 0) {
        return 0;
    }
    int total = calculate_total(values, count);
    if (total == 0 && count > 0) {
        // Check if overflow occurred
        int test_total = 0;
        for (int i = 0; i < count; i++) {
            test_total += values[i];
        }
        if (test_total != 0) {
            // Overflow occurred in calculate_total
            return 0;
        }
    }
    return total / count;
}

int calculate_product(int* values, int count) {
    int product = 1;
    for (int i = 0; i < count; i++) {
        if (!safe_multiply(&product, product, values[i])) {
            // Handle overflow - return error or saturated value
            // Based on similar fixes in the codebase, return 0 on overflow
            return 0;
        }
    }
    return product;
}