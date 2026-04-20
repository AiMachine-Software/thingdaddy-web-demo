/**
 * GS1 EPC TDS Binary Encoding for 96-bit tags.
 * Implements SGTIN-96, GIAI-96, GSRN-96, CPI-96 per GS1 EPC Tag Data Standard.
 */

interface PartitionEntry {
  partition: number
  companyPrefixBits: number
  companyPrefixDigits: number
  referenceBits: number
  referenceDigits: number
}

// SGTIN-96: Header(8) + Filter(3) + Partition(3) + CP(M) + ItemRef(N) = 44 bits + Serial(38) = 96
const SGTIN_PARTITION_TABLE: PartitionEntry[] = [
  { partition: 0, companyPrefixBits: 40, companyPrefixDigits: 12, referenceBits: 4, referenceDigits: 1 },
  { partition: 1, companyPrefixBits: 37, companyPrefixDigits: 11, referenceBits: 7, referenceDigits: 2 },
  { partition: 2, companyPrefixBits: 34, companyPrefixDigits: 10, referenceBits: 10, referenceDigits: 3 },
  { partition: 3, companyPrefixBits: 30, companyPrefixDigits: 9, referenceBits: 14, referenceDigits: 4 },
  { partition: 4, companyPrefixBits: 27, companyPrefixDigits: 8, referenceBits: 17, referenceDigits: 5 },
  { partition: 5, companyPrefixBits: 24, companyPrefixDigits: 7, referenceBits: 20, referenceDigits: 6 },
  { partition: 6, companyPrefixBits: 20, companyPrefixDigits: 6, referenceBits: 24, referenceDigits: 7 },
]

// GIAI-96: Header(8) + Filter(3) + Partition(3) + CP(M) + IAR(N) = 82 bits total
const GIAI_PARTITION_TABLE: PartitionEntry[] = [
  { partition: 0, companyPrefixBits: 40, companyPrefixDigits: 12, referenceBits: 42, referenceDigits: 13 },
  { partition: 1, companyPrefixBits: 37, companyPrefixDigits: 11, referenceBits: 45, referenceDigits: 14 },
  { partition: 2, companyPrefixBits: 34, companyPrefixDigits: 10, referenceBits: 48, referenceDigits: 15 },
  { partition: 3, companyPrefixBits: 30, companyPrefixDigits: 9, referenceBits: 52, referenceDigits: 16 },
  { partition: 4, companyPrefixBits: 27, companyPrefixDigits: 8, referenceBits: 55, referenceDigits: 17 },
  { partition: 5, companyPrefixBits: 24, companyPrefixDigits: 7, referenceBits: 58, referenceDigits: 18 },
  { partition: 6, companyPrefixBits: 20, companyPrefixDigits: 6, referenceBits: 62, referenceDigits: 19 },
]

// GSRN-96: Header(8) + Filter(3) + Partition(3) + CP(M) + SR(N) = 58 bits + Reserved(24) = 96
// Per GS1 TDS, GSRN Company Prefix + Service Reference = 17 digits total (before check digit)
const GSRN_PARTITION_TABLE: PartitionEntry[] = [
  { partition: 0, companyPrefixBits: 40, companyPrefixDigits: 12, referenceBits: 18, referenceDigits: 5 },
  { partition: 1, companyPrefixBits: 37, companyPrefixDigits: 11, referenceBits: 21, referenceDigits: 6 },
  { partition: 2, companyPrefixBits: 34, companyPrefixDigits: 10, referenceBits: 24, referenceDigits: 7 },
  { partition: 3, companyPrefixBits: 30, companyPrefixDigits: 9, referenceBits: 28, referenceDigits: 8 },
  { partition: 4, companyPrefixBits: 27, companyPrefixDigits: 8, referenceBits: 31, referenceDigits: 9 },
  { partition: 5, companyPrefixBits: 24, companyPrefixDigits: 7, referenceBits: 34, referenceDigits: 10 },
  { partition: 6, companyPrefixBits: 20, companyPrefixDigits: 6, referenceBits: 38, referenceDigits: 11 },
]

// CPI-96: Header(8) + Filter(3) + Partition(3) + CP(M) + CPR(N) = 53 bits + Serial(31) = 96
const CPI_PARTITION_TABLE: PartitionEntry[] = [
  { partition: 0, companyPrefixBits: 40, companyPrefixDigits: 12, referenceBits: 11, referenceDigits: 3 },
  { partition: 1, companyPrefixBits: 37, companyPrefixDigits: 11, referenceBits: 14, referenceDigits: 4 },
  { partition: 2, companyPrefixBits: 34, companyPrefixDigits: 10, referenceBits: 17, referenceDigits: 5 },
  { partition: 3, companyPrefixBits: 30, companyPrefixDigits: 9, referenceBits: 21, referenceDigits: 6 },
  { partition: 4, companyPrefixBits: 27, companyPrefixDigits: 8, referenceBits: 24, referenceDigits: 7 },
  { partition: 5, companyPrefixBits: 24, companyPrefixDigits: 7, referenceBits: 27, referenceDigits: 8 },
  { partition: 6, companyPrefixBits: 20, companyPrefixDigits: 6, referenceBits: 31, referenceDigits: 9 },
]

function findPartition(table: PartitionEntry[], companyPrefixDigits: number): PartitionEntry {
  const entry = table.find((e) => e.companyPrefixDigits === companyPrefixDigits)
  if (!entry) {
    throw new Error(
      `Invalid company prefix length: ${companyPrefixDigits} digits. Must be 6–12.`,
    )
  }
  return entry
}

/** Convert a non-negative integer to a binary string of exact bit length */
function toBitString(value: number | bigint, bits: number): string {
  const big = typeof value === 'bigint' ? value : BigInt(value)
  if (big < 0n) throw new Error('Value must be non-negative')
  const max = (1n << BigInt(bits)) - 1n
  if (big > max) throw new Error(`Value ${big} exceeds ${bits}-bit max (${max})`)
  return big.toString(2).padStart(bits, '0')
}

/** Convert a binary string (e.g. 96 chars of '0'/'1') to uppercase hex */
function binaryToHex(binary: string): string {
  let hex = ''
  for (let i = 0; i < binary.length; i += 4) {
    hex += parseInt(binary.substring(i, i + 4), 2).toString(16)
  }
  return hex.toUpperCase()
}

/**
 * Encode SGTIN-96.
 * @param companyPrefix 6–12 digit GS1 Company Prefix
 * @param indicatorAndItemRef Indicator digit prepended to item reference as a single numeric string
 * @param serial Serial number (numeric string, max 2^38 - 1)
 * @param filter Filter value 0–7 (default 0)
 */
export function encodeSgtin96(
  companyPrefix: string,
  indicatorAndItemRef: string,
  serial: string,
  filter: number = 0,
): string {
  const entry = findPartition(SGTIN_PARTITION_TABLE, companyPrefix.length)
  const serialNum = BigInt(serial)
  const maxSerial = (1n << 38n) - 1n
  if (serialNum > maxSerial) {
    throw new Error(`Serial ${serial} exceeds SGTIN-96 max (${maxSerial})`)
  }

  const bits =
    toBitString(0x30, 8) +
    toBitString(filter, 3) +
    toBitString(entry.partition, 3) +
    toBitString(BigInt(companyPrefix), entry.companyPrefixBits) +
    toBitString(BigInt(indicatorAndItemRef), entry.referenceBits) +
    toBitString(serialNum, 38)

  return binaryToHex(bits)
}

/**
 * Encode GIAI-96.
 * @param companyPrefix 6–12 digit GS1 Company Prefix
 * @param assetRef Numeric individual asset reference
 * @param filter Filter value 0–7 (default 0)
 */
export function encodeGiai96(
  companyPrefix: string,
  assetRef: string,
  filter: number = 0,
): string {
  const entry = findPartition(GIAI_PARTITION_TABLE, companyPrefix.length)

  const bits =
    toBitString(0x34, 8) +
    toBitString(filter, 3) +
    toBitString(entry.partition, 3) +
    toBitString(BigInt(companyPrefix), entry.companyPrefixBits) +
    toBitString(BigInt(assetRef), entry.referenceBits)

  return binaryToHex(bits)
}

/**
 * Encode GSRN-96.
 * @param companyPrefix 6–12 digit GS1 Company Prefix
 * @param serviceRef Numeric service reference
 * @param filter Filter value 0–7 (default 0)
 */
export function encodeGsrn96(
  companyPrefix: string,
  serviceRef: string,
  filter: number = 0,
): string {
  const entry = findPartition(GSRN_PARTITION_TABLE, companyPrefix.length)

  const bits =
    toBitString(0x2d, 8) +
    toBitString(filter, 3) +
    toBitString(entry.partition, 3) +
    toBitString(BigInt(companyPrefix), entry.companyPrefixBits) +
    toBitString(BigInt(serviceRef), entry.referenceBits) +
    toBitString(0, 24) // Reserved

  return binaryToHex(bits)
}

/**
 * Encode CPI-96. Only numeric part references are supported in 96-bit.
 * @param companyPrefix 6–12 digit GS1 Company Prefix
 * @param partRef Numeric component/part reference
 * @param serial Numeric serial (max 2^31 - 1)
 * @param filter Filter value 0–7 (default 0)
 */
export function encodeCpi96(
  companyPrefix: string,
  partRef: string,
  serial: string,
  filter: number = 0,
): string {
  if (/[^0-9]/.test(partRef)) {
    return 'ALPHANUMERIC_CPI_REQUIRES_VAR_ENCODING'
  }

  const entry = findPartition(CPI_PARTITION_TABLE, companyPrefix.length)
  const serialNum = BigInt(serial)
  const maxSerial = (1n << 31n) - 1n
  if (serialNum > maxSerial) {
    throw new Error(`Serial ${serial} exceeds CPI-96 max (${maxSerial})`)
  }

  const bits =
    toBitString(0x3c, 8) +
    toBitString(filter, 3) +
    toBitString(entry.partition, 3) +
    toBitString(BigInt(companyPrefix), entry.companyPrefixBits) +
    toBitString(BigInt(partRef), entry.referenceBits) +
    toBitString(serialNum, 31)

  return binaryToHex(bits)
}

/**
 * Encode SGTIN-198. Same partition as SGTIN-96 but serial is 140 bits (20 × 7-bit ASCII chars).
 * Header: 0x36. Total: 8+3+3+44+140 = 198 bits → 50 hex chars (with 2 padding bits).
 */
export function encodeSgtin198(
  companyPrefix: string,
  indicatorAndItemRef: string,
  serial: string,
  filter: number = 0,
): string {
  const entry = findPartition(SGTIN_PARTITION_TABLE, companyPrefix.length)
  if (serial.length > 20) {
    throw new Error(`Serial "${serial}" exceeds SGTIN-198 max of 20 characters`)
  }

  let bits =
    toBitString(0x36, 8) +
    toBitString(filter, 3) +
    toBitString(entry.partition, 3) +
    toBitString(BigInt(companyPrefix), entry.companyPrefixBits) +
    toBitString(BigInt(indicatorAndItemRef), entry.referenceBits)

  // Encode serial as 7-bit ASCII (20 chars × 7 bits = 140 bits)
  for (let i = 0; i < 20; i++) {
    const charCode = i < serial.length ? serial.charCodeAt(i) : 0
    bits += toBitString(charCode, 7)
  }

  // 198 bits → need 200 bits for 50 hex chars, pad with 2 zero bits
  bits += '00'

  return binaryToHex(bits)
}

/** Unified dispatcher by scheme name */
export function encodeEpcBinary(
  scheme: 'sgtin-96' | 'giai-96' | 'gsrn-96' | 'cpi-96',
  params: {
    companyPrefix: string
    indicatorAndItemRef?: string
    assetRef?: string
    serviceRef?: string
    partRef?: string
    serial?: string
    filter?: number
  },
): string {
  const f = params.filter ?? 0
  switch (scheme) {
    case 'sgtin-96':
      return encodeSgtin96(params.companyPrefix, params.indicatorAndItemRef!, params.serial!, f)
    case 'giai-96':
      return encodeGiai96(params.companyPrefix, params.assetRef!, f)
    case 'gsrn-96':
      return encodeGsrn96(params.companyPrefix, params.serviceRef!, f)
    case 'cpi-96':
      return encodeCpi96(params.companyPrefix, params.partRef!, params.serial!, f)
  }
}

/**
 * Convenience wrapper: parses an EPC Tag URI and dispatches to the right 96-bit encoder.
 * Falls back to a placeholder for non-96-bit tag sizes.
 */
export function encodeToHex(tagUri: string): string {
  // Parse: urn:epc:tag:{scheme}-{size}:{filter}.{fields...}
  const match = tagUri.match(
    /^urn:epc:tag:(\w+)-(\d+|var):(\d+)\.(.+)$/,
  )
  if (!match) return '(invalid tag URI)'

  const [, scheme, sizeStr, filterStr, fields] = match
  const filter = Number(filterStr)

  // 96-bit and 198-bit encoding supported
  if (sizeStr !== '96' && sizeStr !== '198') {
    return `(${scheme}-${sizeStr} binary encoding not implemented)`
  }

  const parts = fields.split('.')

  try {
    switch (scheme) {
      case 'sgtin': {
        const [cp, ir, serial] = parts
        if (sizeStr === '198') {
          return encodeSgtin198(cp, ir, serial, filter)
        }
        return encodeSgtin96(cp, ir, serial, filter)
      }
      case 'giai': {
        // fields: companyPrefix.assetRef
        const [cp, ar] = parts
        return encodeGiai96(cp, ar, filter)
      }
      case 'gsrn': {
        // fields: companyPrefix.serviceRef
        const [cp, sr] = parts
        return encodeGsrn96(cp, sr, filter)
      }
      case 'cpi': {
        // fields: companyPrefix.partRef.serial
        const [cp, pr, serial] = parts
        return encodeCpi96(cp, pr, serial, filter)
      }
      default:
        return `(unsupported scheme: ${scheme})`
    }
  } catch (e) {
    return `(encoding error: ${e instanceof Error ? e.message : String(e)})`
  }
}
