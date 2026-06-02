/**
 * Calculate PI to specified decimal places using the Machin-like formula
 * pi/4 = 4*arctan(1/5) - arctan(1/239)
 * 
 * Uses the Chudnovsky algorithm for high precision
 */

// Calculate PI using the Bailey-Borwein-Plouffe formula
// which is simple and allows arbitrary precision
function calculatePi(decimalPlaces) {
  // Use Machin's formula with BigInt for arbitrary precision
  const precision = decimalPlaces + 10; // Extra digits for rounding
  
  // arctan(1/x) = sum_{k=0}^{inf} (-1)^k / ((2k+1) * x^(2k+1))
  function arctan(x, precision) {
    let result = 0n;
    const xBig = BigInt(x);
    let power = xBig;
    let sign = 1n;
    
    for (let k = 0n; k < BigInt(precision); k++) {
      const term = sign * power / BigInt(2n * k + 1n);
      result += term;
      power = power * xBig * xBig;
      sign = -sign;
    }
    
    return result;
  }
  
  // pi = 16 * arctan(1/5) - 4 * arctan(1/239)
  const arctan5 = arctan(5, precision);
  const arctan239 = arctan(239, precision);
  
  const pi = 16n * arctan5 - 4n * arctan239;
  
  // Convert to decimal string
  const piStr = pi.toString();
  const formatted = piStr[0] + "." + piStr.substring(1, decimalPlaces + 1);
  
  return formatted;
}

export function computePi(decimalPlaces = 100) {
  if (typeof decimalPlaces !== "number" || decimalPlaces < 1 || decimalPlaces > 10000000) {
    throw new Error("decimalPlaces must be between 1 and 10,000,000");
  }
  
  return {
    value: calculatePi(decimalPlaces),
    decimals: decimalPlaces,
    formula: "Machin-like (BBP-derived)"
  };
}
