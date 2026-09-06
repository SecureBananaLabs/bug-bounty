pub fn calculate_pi() -> f64 {
    // Using Leibniz formula for PI: PI/4 = 1 - 1/3 + 1/5 - 1/7 + ...
    // We'll sum a large number of terms to get a precise approximation.
    let mut pi = 0.0;
    let mut sign = 1.0;
    let mut term = 1.0;
    let mut n = 0;

    // Summing 10^7 terms for high precision
    while n < 10_000_000 {
        pi += sign * term;
        n += 1;
        term = 1.0 / (2.0 * n + 1.0);
        sign *= -1.0;
    }

    4.0 * pi
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_pi() {
        let pi = calculate_pi();
        // A rough check: PI should be around 3.141592653589793
        assert!((pi - 3.141592653589793).abs() < 1e-10);
    }
}