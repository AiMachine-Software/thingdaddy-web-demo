import { describe, it, expect } from 'vitest'
import {
  encodeSgtin96,
  encodeGiai96,
  encodeGsrn96,
  encodeCpi96,
  encodeToHex,
} from '../binary-encoder'

describe('encodeSgtin96', () => {
  it('encodes with 7-digit prefix (partition 5)', () => {
    // Company Prefix: 0614141 (7 digits → partition 5)
    // Indicator+ItemRef: "0812345"
    // Serial: "6789"
    const hex = encodeSgtin96('0614141', '0812345', '6789', 3)
    // Should be 24 hex chars (96 bits)
    expect(hex).toHaveLength(24)
    // Header should be 0x30 = 00110000
    // First hex char pair should start with '3' (0011....)
    expect(hex.substring(0, 2)).toBe('30')
  })

  it('encodes with 6-digit prefix (partition 6)', () => {
    const hex = encodeSgtin96('061414', '01234567', '100', 0)
    expect(hex).toHaveLength(24)
    expect(hex.substring(0, 2)).toBe('30')
  })

  it('encodes with 12-digit prefix (partition 0)', () => {
    const hex = encodeSgtin96('061414100000', '05', '999', 0)
    expect(hex).toHaveLength(24)
    expect(hex.substring(0, 2)).toBe('30')
  })

  it('produces different output for different serials', () => {
    const hex1 = encodeSgtin96('0614141', '0812345', '1')
    const hex2 = encodeSgtin96('0614141', '0812345', '2')
    expect(hex1).not.toBe(hex2)
    // Only serial bits differ — first portion should be the same
    expect(hex1.substring(0, 14)).toBe(hex2.substring(0, 14))
  })

  it('throws for invalid prefix length', () => {
    expect(() => encodeSgtin96('12345', '01', '1')).toThrow('Invalid company prefix length')
  })

  it('throws for serial exceeding 38-bit max', () => {
    // 2^38 = 274877906944
    expect(() => encodeSgtin96('0614141', '0812345', '274877906944')).toThrow('exceeds SGTIN-96 max')
  })

  it('accepts serial at 38-bit max boundary', () => {
    const hex = encodeSgtin96('0614141', '0812345', '274877906943')
    expect(hex).toHaveLength(24)
  })
})

describe('encodeGiai96', () => {
  it('encodes with 7-digit prefix (partition 5)', () => {
    const hex = encodeGiai96('0614141', '32', 0)
    expect(hex).toHaveLength(24)
    expect(hex.substring(0, 2)).toBe('34')
  })

  it('encodes with 6-digit prefix (partition 6)', () => {
    const hex = encodeGiai96('061414', '1234567890123456789', 0)
    expect(hex).toHaveLength(24)
    expect(hex.substring(0, 2)).toBe('34')
  })

  it('produces different output for different asset refs', () => {
    const hex1 = encodeGiai96('0614141', '100')
    const hex2 = encodeGiai96('0614141', '200')
    expect(hex1).not.toBe(hex2)
  })

  it('throws for invalid prefix length', () => {
    expect(() => encodeGiai96('1234', '1')).toThrow('Invalid company prefix length')
  })
})

describe('encodeGsrn96', () => {
  it('encodes with 7-digit prefix (partition 5)', () => {
    const hex = encodeGsrn96('0614141', '1234567890', 0)
    expect(hex).toHaveLength(24)
    expect(hex.substring(0, 2)).toBe('2D')
  })

  it('has reserved 24 zero bits at end', () => {
    const hex = encodeGsrn96('0614141', '1234567890', 0)
    // Last 6 hex chars (24 bits) should be all zeros
    expect(hex.substring(18, 24)).toBe('000000')
  })

  it('encodes with 12-digit prefix (partition 0)', () => {
    const hex = encodeGsrn96('061414100000', '5', 0)
    expect(hex).toHaveLength(24)
    expect(hex.substring(0, 2)).toBe('2D')
  })
})

describe('encodeCpi96', () => {
  it('encodes with 7-digit prefix and numeric part ref', () => {
    const hex = encodeCpi96('0614141', '999', '12345', 0)
    expect(hex).toHaveLength(24)
    expect(hex.substring(0, 2)).toBe('3C')
  })

  it('returns warning for alphanumeric part reference', () => {
    const result = encodeCpi96('0614141', '999ABC', '12345', 0)
    expect(result).toBe('ALPHANUMERIC_CPI_REQUIRES_VAR_ENCODING')
  })

  it('throws for serial exceeding 31-bit max', () => {
    // 2^31 = 2147483648
    expect(() => encodeCpi96('0614141', '999', '2147483648')).toThrow('exceeds CPI-96 max')
  })

  it('accepts serial at 31-bit max boundary', () => {
    const hex = encodeCpi96('0614141', '999', '2147483647')
    expect(hex).toHaveLength(24)
  })
})

describe('encodeToHex (tag URI wrapper)', () => {
  it('parses and encodes SGTIN-96 tag URI', () => {
    const hex = encodeToHex('urn:epc:tag:sgtin-96:3.0614141.0812345.6789')
    expect(hex).toHaveLength(24)
    expect(hex.substring(0, 2)).toBe('30')
    // Should match direct call
    expect(hex).toBe(encodeSgtin96('0614141', '0812345', '6789', 3))
  })

  it('parses and encodes GIAI-96 tag URI', () => {
    const hex = encodeToHex('urn:epc:tag:giai-96:0.0614141.32')
    expect(hex).toHaveLength(24)
    expect(hex).toBe(encodeGiai96('0614141', '32', 0))
  })

  it('parses and encodes GSRN-96 tag URI', () => {
    const hex = encodeToHex('urn:epc:tag:gsrn-96:0.0614141.1234567890')
    expect(hex).toHaveLength(24)
    expect(hex).toBe(encodeGsrn96('0614141', '1234567890', 0))
  })

  it('encodes SGTIN-198 tag URI', () => {
    const result = encodeToHex('urn:epc:tag:sgtin-198:0.0614141.0812345.6789')
    expect(result).toHaveLength(50) // 198 bits → 200 bits padded → 50 hex chars
    expect(result.substring(0, 2)).toBe('36') // SGTIN-198 header
  })

  it('returns message for unsupported tag sizes', () => {
    const result = encodeToHex('urn:epc:tag:giai-202:0.0614141.32')
    expect(result).toContain('not implemented')
  })

  it('returns message for invalid URIs', () => {
    const result = encodeToHex('invalid')
    expect(result).toContain('invalid')
  })
})
