#include <iostream>
#include <iomanip>
#include <cmath>

int main() {
    // We know that pi is an irrational number with an infinite number of decimal places.
    // However, for practical purposes, we can approximate it to a very high precision.
    // Using the C++ standard library's M_PI constant (if available) or a high-precision calculation.

    // If M_PI is not available, we can use a high-precision approximation.
    // Here we'll use the value up to 50 decimal places for demonstration.
    const double pi = 3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679;

    std::cout << std::fixed << std::setprecision(50);
    std::cout << "PI = " << pi << std::endl;

    return 0;
}