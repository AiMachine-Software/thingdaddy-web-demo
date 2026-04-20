/**
 * GS1 EPC TDS Binary Decoder — reverse hex to identifier fields.
 */

import {
  buildSgtinElementString,
  buildCpiElementString,
  buildGiaiElementString,
  buildGsrnElementString,
} from './element-string'
import {
  buildSgtinUri,
  buildCpiUri,
  buildGiaiUri,
  buildGsrnUri,
} from './epc-uri'
import {
  buildSgtinTagUri,
  buildCpiTagUri,
  buildGiaiTagUri,
  buildGsrnTagUri,
} from './epc-tag-uri'

export interface DecodedEpc {
  scheme: 'sgtin-96' | 'sgtin-198' | 'giai-96' | 'cpi-96' | 'gsrn-96'
  header: string
  filter: number
  partition: number
  companyPrefix: string
  indicatorAndItemRef?: string
  serial?: string
  assetRef?: string
  serviceRef?: string
  partRef?: string
  epcPureIdentityUri: string
  epcTagUri: string
  gs1ElementString: string
}

interface PartitionEntry {
  partition: number
  companyPrefixBits: number
  companyPrefixDigits: number
  referenceBits: number
  referenceDigits: number
}

const SGTIN_PARTITION_TABLE: PartitionEntry[] = [
  { partition: 0, companyPrefixBits: 40, companyPrefixDigits: 12, referenceBits: 4, referenceDigits: 1 },
  { partition: 1, companyPrefixBits: 37, companyPrefixDigits: 11, referenceBits: 7, referenceDigits: 2 },
  { partition: 2, companyPrefixBits: 34, companyPrefixDigits: 10, referenceBits: 10, referenceDigits: 3 },
  { partition: 3, companyPrefixBits: 30, companyPrefixDigits: 9, referenceBits: 14, referenceDigits: 4 },
  { partition: 4, companyPrefixBits: 27, companyPrefixDigits: 8, referenceBits: 17, referenceDigits: 5 },
  { partition: 5, companyPrefixBits: 24, companyPrefixDigits: 7, referenceBits: 20, referenceDigits: 6 },
  { partition: 6, companyPrefixBits: 20, companyPrefixDigits: 6, referenceBits: 24, referenceDigits: 7 },
]

const GIAI_PARTITION_TABLE: PartitionEntry[] = [
  { partition: 0, companyPrefixBits: 40, companyPrefixDigits: 12, referenceBits: 42, referenceDigits: 13 },
  { partition: 1, companyPrefixBits: 37, companyPrefixDigits: 11, referenceBits: 45, referenceDigits: 14 },
  { partition: 2, companyPrefixBits: 34, companyPrefixDigits: 10, referenceBits: 48, referenceDigits: 15 },
  { partition: 3, companyPrefixBits: 30, companyPrefixDigits: 9, referenceBits: 52, referenceDigits: 16 },
  { partition: 4, companyPrefixBits: 27, companyPrefixDigits: 8, referenceBits: 55, referenceDigits: 17 },
  { partition: 5, companyPrefixBits: 24, companyPrefixDigits: 7, referenceBits: 58, referenceDigits: 18 },
  { partition: 6, companyPrefixBits: 20, companyPrefixDigits: 6, referenceBits: 62, referenceDigits: 19 },
]

const GSRN_PARTITION_TABLE: PartitionEntry[] = [
  { partition: 0, companyPrefixBits: 40, companyPrefixDigits: 12, referenceBits: 18, referenceDigits: 5 },
  { partition: 1, companyPrefixBits: 37, companyPrefixDigits: 11, referenceBits: 21, referenceDigits: 6 },
  { partition: 2, companyPrefixBits: 34, companyPrefixDigits: 10, referenceBits: 24, referenceDigits: 7 },
  { partition: 3, companyPrefixBits: 30, companyPrefixDigits: 9, referenceBits: 28, referenceDigits: 8 },
  { partition: 4, companyPrefixBits: 27, companyPrefixDigits: 8, referenceBits: 31, referenceDigits: 9 },
  { partition: 5, companyPrefixBits: 24, companyPrefixDigits: 7, referenceBits: 34, referenceDigits: 10 },
  { partition: 6, companyPrefixBits: 20, companyPrefixDigits: 6, referenceBits: 38, referenceDigits: 11 },
]

const CPI_PARTITION_TABLE: PartitionEntry[] = [
  { partition: 0, companyPrefixBits: 40, companyPrefixDigits: 12, referenceBits: 11, referenceDigits: 3 },
  { partition: 1, companyPrefixBits: 37, companyPrefixDigits: 11, referenceBits: 14, referenceDigits: 4 },
  { partition: 2, companyPrefixBits: 34, companyPrefixDigits: 10, referenceBits: 17, referenceDigits: 5 },
  { partition: 3, companyPrefixBits: 30, companyPrefixDigits: 9, referenceBits: 21, referenceDigits: 6 },
  { partition: 4, companyPrefixBits: 27, companyPrefixDigits: 8, referenceBits: 24, referenceDigits: 7 },
  { partition: 5, companyPrefixBits: 24, companyPrefixDigits: 7, referenceBits: 27, referenceDigits: 8 },
  { partition: 6, companyPrefixBits: 20, companyPrefixDigits: 6, referenceBits: 31, referenceDigits: 9 },
]

/** Convert hex string to binary string */
function hexToBinary(hex: string): string {
  let binary = ''
  for (const ch of hex) {
    binary += parseInt(ch, 16).toString(2).padStart(4, '0')
  }
  return binary
}

/** Read integer from binary substring */
function readBits(binary: string, offset: number, length: number): bigint {
  return BigInt('0b' + binary.substring(offset, offset + length))
}

function findPartitionByValue(table: PartitionEntry[], partition: number): PartitionEntry {
  const entry = table.find((e) => e.partition === partition)
  if (!entry) throw new Error(`Invalid partition value: ${partition}`)
  return entry
}

/**
 * Decode an EPC hex string back to identifier fields.
 */
export function decodeEpcHex(hex: string): DecodedEpc {
  const cleanHex = hex.replace(/\s/g, '').toUpperCase()
  const binary = hexToBinary(cleanHex)

  const headerByte = Number(readBits(binary, 0, 8))
  const headerHex = headerByte.toString(16).toUpperCase().padStart(2, '0')
  const filter = Number(readBits(binary, 8, 3))
  const partition = Number(readBits(binary, 11, 3))

  switch (headerByte) {
    case 0x30: { // SGTIN-96
      const entry = findPartitionByValue(SGTIN_PARTITION_TABLE, partition)
      const cp = readBits(binary, 14, entry.companyPrefixBits).toString().padStart(entry.companyPrefixDigits, '0')
      const ir = readBits(binary, 14 + entry.companyPrefixBits, entry.referenceBits).toString().padStart(entry.referenceDigits, '0')
      const serial = readBits(binary, 58, 38).toString()
      const indicator = ir.charAt(0)
      const itemRef = ir.substring(1)
      return {
        scheme: 'sgtin-96',
        header: headerHex,
        filter,
        partition,
        companyPrefix: cp,
        indicatorAndItemRef: ir,
        serial,
        epcPureIdentityUri: buildSgtinUri(cp, indicator, itemRef, serial),
        epcTagUri: buildSgtinTagUri(cp, indicator, itemRef, serial, filter, 96),
        gs1ElementString: buildSgtinElementString(cp, indicator, itemRef, serial),
      }
    }

    case 0x36: { // SGTIN-198
      const entry = findPartitionByValue(SGTIN_PARTITION_TABLE, partition)
      const cp = readBits(binary, 14, entry.companyPrefixBits).toString().padStart(entry.companyPrefixDigits, '0')
      const ir = readBits(binary, 14 + entry.companyPrefixBits, entry.referenceBits).toString().padStart(entry.referenceDigits, '0')
      // Serial: 140 bits = 20 × 7-bit ASCII chars
      let serial = ''
      const serialStart = 58
      for (let i = 0; i < 20; i++) {
        const charCode = Number(readBits(binary, serialStart + i * 7, 7))
        if (charCode === 0) break
        serial += String.fromCharCode(charCode)
      }
      const indicator = ir.charAt(0)
      const itemRef = ir.substring(1)
      return {
        scheme: 'sgtin-198',
        header: headerHex,
        filter,
        partition,
        companyPrefix: cp,
        indicatorAndItemRef: ir,
        serial,
        epcPureIdentityUri: buildSgtinUri(cp, indicator, itemRef, serial),
        epcTagUri: buildSgtinTagUri(cp, indicator, itemRef, serial, filter, 198),
        gs1ElementString: buildSgtinElementString(cp, indicator, itemRef, serial),
      }
    }

    case 0x34: { // GIAI-96
      const entry = findPartitionByValue(GIAI_PARTITION_TABLE, partition)
      const cp = readBits(binary, 14, entry.companyPrefixBits).toString().padStart(entry.companyPrefixDigits, '0')
      const assetRef = readBits(binary, 14 + entry.companyPrefixBits, entry.referenceBits).toString()
      return {
        scheme: 'giai-96',
        header: headerHex,
        filter,
        partition,
        companyPrefix: cp,
        assetRef,
        epcPureIdentityUri: buildGiaiUri(cp, assetRef),
        epcTagUri: buildGiaiTagUri(cp, assetRef, filter, 96),
        gs1ElementString: buildGiaiElementString(cp, assetRef),
      }
    }

    case 0x2d: { // GSRN-96
      const entry = findPartitionByValue(GSRN_PARTITION_TABLE, partition)
      const cp = readBits(binary, 14, entry.companyPrefixBits).toString().padStart(entry.companyPrefixDigits, '0')
      const serviceRef = readBits(binary, 14 + entry.companyPrefixBits, entry.referenceBits).toString().padStart(entry.referenceDigits, '0')
      return {
        scheme: 'gsrn-96',
        header: headerHex,
        filter,
        partition,
        companyPrefix: cp,
        serviceRef,
        epcPureIdentityUri: buildGsrnUri(cp, serviceRef),
        epcTagUri: buildGsrnTagUri(cp, serviceRef, filter),
        gs1ElementString: buildGsrnElementString(cp, serviceRef),
      }
    }

    case 0x3c: { // CPI-96
      const entry = findPartitionByValue(CPI_PARTITION_TABLE, partition)
      const cp = readBits(binary, 14, entry.companyPrefixBits).toString().padStart(entry.companyPrefixDigits, '0')
      const partRef = readBits(binary, 14 + entry.companyPrefixBits, entry.referenceBits).toString()
      const serial = readBits(binary, 14 + entry.companyPrefixBits + entry.referenceBits, 31).toString()
      return {
        scheme: 'cpi-96',
        header: headerHex,
        filter,
        partition,
        companyPrefix: cp,
        partRef,
        serial,
        epcPureIdentityUri: buildCpiUri(cp, partRef, serial),
        epcTagUri: buildCpiTagUri(cp, partRef, serial, filter, 96),
        gs1ElementString: buildCpiElementString(cp, partRef, serial),
      }
    }

    default:
      throw new Error(`Unknown EPC header: 0x${headerHex} (decimal ${headerByte})`)
  }
}
