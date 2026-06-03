/**
 * High-precision PI calculator using Bailey-Borwein-Plouffe formula
 * Can calculate PI to arbitrary precision
 */

export function calculatePI(precision = 100) {
  // Use BigInt for integer arithmetic to avoid floating point errors
  const scale = BigInt(10) ** BigInt(precision + 10);
  
  // Bailey-Borwein-Plouffe formula
  // PI = sum_{k=0}^{infinity} [1/16^k * (4/(8k+1) - 2/(8k+4) - 1/(8k+5) - 1/(8k+6))]
  
  let pi = BigInt(0);
  
  for (let k = 0; k < precision * 2; k++) {
    const k8 = BigInt(8 * k);
    
    // Calculate each term
    const term1 = (BigInt(4) * scale) / (k8 + BigInt(1));
    const term2 = (BigInt(2) * scale) / (k8 + BigInt(4));
    const term3 = scale / (k8 + BigInt(5));
    const term4 = scale / (k8 + BigInt(6));
    
    // Multiply by 1/16^k
    const divisor = BigInt(16) ** BigInt(k);
    const term = (term1 - term2 - term3 - term4) / divisor;
    
    pi += term;
  }
  
  // Convert to string
  const piStr = pi.toString();
  
  // Format as "3.14159..."
  return piStr[0] + '.' + piStr.slice(1, precision + 1);
}

/**
 * Chudnovsky algorithm for faster convergence
 * More efficient for high precision calculations
 */
export function calculatePIChudnovsky(precision = 100) {
  const C = 426880 * Math.sqrt(10005);
  const scale = BigInt(10) ** BigInt(precision + 10);
  
  let sum = BigInt(0);
  let factorial = BigInt(1);
  let power = BigInt(1);
  
  for (let k = 0; k < precision / 14 + 1; k++) {
    const k6 = 6 * k;
    const num = factorial * BigInt(13591409 + 545140134 * k);
    const den = power * factorial;
    
    sum += (k % 2 === 0 ? BigInt(1) : BigInt(-1)) * num / den;
    
    // Update factorial and power for next iteration
    factorial *= BigInt(k6 + 1) * BigInt(k6 + 2) * BigInt(k6 + 3) * BigInt(k6 + 4) * BigInt(k6 + 5) * BigInt(k6 + 6);
    power *= BigInt(640320) ** BigInt(3);
  }
  
  const pi = (C * scale) / sum;
  const piStr = pi.toString();
  
  return piStr[0] + '.' + piStr.slice(1, precision + 1);
}

/**
 * Verify PI calculation
 */
export function verifyPI(calculatedPI) {
  // Known PI to 1000 digits for verification
  const knownPI = "3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679821480865132823066470938446095505822317253594081284811174502841027019385211055596446229489549303819644288109756659334461284756482337867831652712019091456485669234603486104543266482133936072602491412737245870066063155881748815209209628292540917153643678925903600113305305488204665213841469519415116094330572703657595919530921861173819326117931051185480744623799627495673518857527248912279381830119491298336733624406566430860213949463952247371907021798609437027705392171762931767523846748184676694051320005681271452635608277857713427577896091736371787214684409012249534301465495853710507922796892589235420199561121290219608640344181598136297747713099605187072113499999983729780499510597317328160963185950244594553469083026425223082533446850352619311881710100031378387528865875332083814206171776691473035982534904287554687311595628638823537875937519577818577805321712268066130019278766111959092164201989";

  // Compare calculated PI with known PI
  const minLength = Math.min(calculatedPI.length, knownPI.length);
  let matchingDigits = 0;
  
  for (let i = 0; i < minLength; i++) {
    if (calculatedPI[i] === knownPI[i]) {
      matchingDigits++;
    } else {
      break;
    }
  }
  
  return {
    matchingDigits,
    totalDigits: calculatedPI.length,
    accuracy: (matchingDigits / calculatedPI.length * 100).toFixed(2)
  };
}
