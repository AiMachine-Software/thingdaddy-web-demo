/**
 * GS1 modulo-10 check digit calculator.
 * Used for GTIN-14, SSCC, GLN, GSRN, etc.
 */
export function calculateCheckDigit(digits: string): number {
  let sum = 0
  const len = digits.length
  for (let i = 0; i < len; i++) {
    const digit = Number(digits[len - 1 - i])
    // Odd positions (from right, 1-indexed) multiply by 3, even by 1
    sum += i % 2 === 0 ? digit * 3 : digit
  }
  return (10 - (sum % 10)) % 10
}
