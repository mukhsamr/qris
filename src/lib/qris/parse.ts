/**
 * Parse helper — baca satu TLV entry dari offset tertentu.
 * Return [tag, length, value, nextOffset] atau null jika parse gagal.
 */
export interface TLVParsed {
  tag: string;
  length: number;
  value: string;
  raw: string;
}

export function parseTLVAt(payload: string, offset: number): TLVParsed | null {
  if (offset + 4 > payload.length) return null;

  const tag = payload.slice(offset, offset + 2);
  const lenStr = payload.slice(offset + 2, offset + 4);
  const len = parseInt(lenStr, 10);

  if (isNaN(len) || offset + 4 + len > payload.length) return null;

  const value = payload.slice(offset + 4, offset + 4 + len);
  const raw = payload.slice(offset, offset + 4 + len);

  return { tag, length: len, value, raw };
}

/**
 * Parse nested TLV — untuk tag 26–51 yang valuenya adalah TLV structure.
 * Tag "00" (globally unique ID) dalam nested TLV menentukan provider.
 */
export function parseNestedTLV(value: string): Record<string, string> {
  const result: Record<string, string> = {};
  let offset = 0;

  while (offset < value.length) {
    const entry = parseTLVAt(value, offset);
    if (!entry) break;
    result[entry.tag] = entry.value;
    offset += entry.raw.length;
  }

  return result;
}

/**
 * Parse seluruh payload QRIS menjadi map tag → value.
 * Tag 63 (CRC) juga disertakan.
 */
export function parseQRIS(payload: string): Record<string, string> {
  const result: Record<string, string> = {};
  let offset = 0;

  while (offset < payload.length) {
    const entry = parseTLVAt(payload, offset);
    if (!entry) break;
    result[entry.tag] = entry.value;
    offset += entry.raw.length;
  }

  return result;
}

/**
 * Ekstrak informasi merchant dari payload QRIS.
 */
export interface QRISInfo {
  payloadFormat: string;
  initiationMethod: string;
  merchantName: string;
  merchantCity: string;
  postalCode: string;
  merchantCategoryCode: string;
  transactionCurrency: string;
  countryCode: string;
  acquirerId: string;
  issuerId: string;
}

export function extractInfo(payload: string): QRISInfo | null {
  const tags = parseQRIS(payload);

  return {
    payloadFormat: tags["00"] ?? "",
    initiationMethod: tags["01"] ?? "",
    merchantName: tags["59"] ?? "",
    merchantCity: tags["60"] ?? "",
    postalCode: tags["61"] ?? "",
    merchantCategoryCode: tags["52"] ?? "",
    transactionCurrency: tags["53"] ?? "",
    countryCode: tags["58"] ?? "",
    acquirerId: tags["26"] ? parseNestedTLV(tags["26"])["00"] ?? "" : "",
    issuerId: tags["51"] ? parseNestedTLV(tags["51"])["00"] ?? "" : "",
  };
}
