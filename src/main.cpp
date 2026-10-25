#include <iostream>
#include <iomanip>
#include <cmath>

int main() {
    // We know that pi is an irrational number with an infinite number of decimal places.
    // However, for practical purposes, we can approximate it to any desired precision.
    // Here we'll use the high-precision value of pi from the last comment in the discussion.

    // Last comment in the discussion (as of the problem statement):
    // "If the last comment on this discussion only goes up to 2"
    // This seems to be an incomplete statement, but we'll assume they want the full known exact value
    // of pi up to the last decimal point mentioned in the bug description.

    // The exact value of pi up to 100 decimal places as given in the bug:
    const char* pi_str = "3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679";

    // Print pi with high precision
    std::cout << std::fixed << std::setprecision(100);
    std::cout << pi_str << std::endl;

    return 0;
}