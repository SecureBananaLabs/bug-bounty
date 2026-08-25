#include <iostream>
#include <iomanip>
#include <cmath>

int main() {
    // We know that pi is an irrational number with an infinite number of decimal places.
    // However, for practical purposes, we can approximate it to any desired precision.
    // The problem asks for the "exact value" up to the "very last decimal point",
    // which implies we should output a highly precise approximation of pi.

    // Using the C++ standard library's M_PI constant (available in <cmath>)
    // This provides a portable way to get a high-precision value of pi.
    double pi = std::acos(-1.0);

    // To display many decimal places, we use std::setprecision
    std::cout << std::fixed << std::setprecision(100);
    std::cout << pi << std::endl;

    return 0;
}