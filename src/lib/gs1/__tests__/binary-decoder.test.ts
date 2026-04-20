import { describe, it, expect } from 'vitest'
import { decodeEpcHex } from '../binary-decoder'
import { encodeSgtin96, encodeSgtin198, encodeGiai96, encodeGsrn96, encodeCpi96 } from '../binary-encoder'

describe('decodeEpcHex', () => {
  describe('SGTIN-96 roundtrip', () => {
    it('decodes encoded SGTIN-96 with 7-digit prefix', () => {
      const hex = encodeSgtin96('0614141', '035001', '7654', 3)
      const decoded = decodeEpcHex(hex)
      expect(decoded.scheme).toBe('sgtin-96')
      expect(decoded.filter).toBe(3)
      expect(decoded.companyPrefix).toBe('0614141')
      expect(decoded.indicatorAndItemRef).toBe('035001')
      expect(decoded.serial).toBe('7654')
    })

    it('decodes encoded SGTIN-96 with 6-digit prefix', () => {
      const hex = encodeSgtin96('061414', '0123456', '100', 0)
      const decoded = decodeEpcHex(hex)
      expect(decoded.scheme).toBe('sgtin-96')
      expect(decoded.companyPrefix).toBe('061414')
      expect(decoded.indicatorAndItemRef).toBe('0123456')
      expect(decoded.serial).toBe('100')
    })

    it('reconstructs EPC URIs correctly', () => {
      const hex = encodeSgtin96('0614141', '035001', '7654', 0)
      const decoded = decodeEpcHex(hex)
      expect(decoded.epcPureIdentityUri).toContain('urn:epc:id:sgtin:0614141')
      expect(decoded.epcTagUri).toContain('urn:epc:tag:sgtin-96')
      expect(decoded.gs1ElementString).toContain('(01)')
    })
  })

  describe('SGTIN-198 roundtrip', () => {
    it('decodes encoded SGTIN-198 with alphanumeric serial', () => {
      const hex = encodeSgtin198('0614141', '035001', 'ABC-123', 0)
      const decoded = decodeEpcHex(hex)
      expect(decoded.scheme).toBe('sgtin-198')
      expect(decoded.companyPrefix).toBe('0614141')
      expect(decoded.indicatorAndItemRef).toBe('035001')
      expect(decoded.serial).toBe('ABC-123')
    })

    it('decodes SGTIN-198 with numeric serial', () => {
      const hex = encodeSgtin198('0614141', '035001', '99999', 2)
      const decoded = decodeEpcHex(hex)
      expect(decoded.scheme).toBe('sgtin-198')
      expect(decoded.filter).toBe(2)
      expect(decoded.serial).toBe('99999')
    })
  })

  describe('GIAI-96 roundtrip', () => {
    it('decodes encoded GIAI-96', () => {
      const hex = encodeGiai96('0614141', '32', 0)
      const decoded = decodeEpcHex(hex)
      expect(decoded.scheme).toBe('giai-96')
      expect(decoded.companyPrefix).toBe('0614141')
      expect(decoded.assetRef).toBe('32')
    })

    it('decodes GIAI-96 with larger asset ref', () => {
      const hex = encodeGiai96('0345678', '999999', 1)
      const decoded = decodeEpcHex(hex)
      expect(decoded.scheme).toBe('giai-96')
      expect(decoded.filter).toBe(1)
      expect(decoded.companyPrefix).toBe('0345678')
      expect(decoded.assetRef).toBe('999999')
    })
  })

  describe('GSRN-96 roundtrip', () => {
    it('decodes encoded GSRN-96', () => {
      const hex = encodeGsrn96('0614141', '1234567890', 0)
      const decoded = decodeEpcHex(hex)
      expect(decoded.scheme).toBe('gsrn-96')
      expect(decoded.companyPrefix).toBe('0614141')
      expect(decoded.serviceRef).toBe('1234567890')
    })
  })

  describe('CPI-96 roundtrip', () => {
    it('decodes encoded CPI-96', () => {
      const hex = encodeCpi96('0614141', '999', '12345', 0)
      const decoded = decodeEpcHex(hex)
      expect(decoded.scheme).toBe('cpi-96')
      expect(decoded.companyPrefix).toBe('0614141')
      expect(decoded.partRef).toBe('999')
      expect(decoded.serial).toBe('12345')
    })
  })

  describe('error handling', () => {
    it('throws for unknown header', () => {
      expect(() => decodeEpcHex('FF00000000000000000000000')).toThrow('Unknown EPC header')
    })
  })
})
