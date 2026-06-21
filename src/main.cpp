#include <iostream>
#include <iomanip>
#include <cmath>

int main() {
    // We know that pi is an irrational number with an infinite number of decimal places.
    // However, for practical purposes, we can approximate it to a very high precision.
    // Using the C++ standard library's M_PI constant (if available) or a high-precision calculation.
    // Here we'll use the high-precision value from the problem statement as a reference.

    // The exact value of pi up to 100 decimal places as given:
    const double pi = 3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679;

    std::cout << std::fixed << std::setprecision(100);
    std::cout << pi << std::endl;

    return 0;
}