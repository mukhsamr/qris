import { crc16 } from "./crc16";
import type { TLVParsed } from "./parse";
import { parseTLVAt } from "./parse";

/**
 * Build single TLV entry: tag (2) + length decimal 2-digit + value.
 */
export function buildTLV(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${tag}${len}${value}`;
}

/**
 * Build tag 54 (Transaction Amount) — wajib integer, max 13 digit.
 */
export function buildAmountTag(amount: number): string {
  const amtStr = String(amount);
  if (amtStr.length > 13) {
    throw new Error("Amount terlalu besar (max 13 digit)");
  }
  return buildTLV("54", amtStr);
}

/**
 * Generate payload QRIS dinamis dari static payload + amount.
 *
 * Flow:
 * 1. Hapus tag 63 (CRC lama) dari akhir
 * 2. Hapus tag 54 jika sudah ada
 * 3. Ubah tag 01 dari "0211" (static) ke "0212" (dynamic)
 * 4. Sisipkan tag 54 dengan amount baru
 * 5. Hitung CRC baru dan tambahkan tag 63
 */
export function buildDynamicQRIS(staticPayload: string, amount: number): string {
  const entries = parseTopLevelEntries(staticPayload);
  const crcEntry = entries.at(-1);

  if (!crcEntry || crcEntry.tag !== "63" || crcEntry.length !== 4) {
    throw new Error("Payload QRIS harus memiliki tag CRC valid di akhir");
  }

  const amountTag = buildAmountTag(amount);
  const bodyEntries = entries
    .slice(0, -1)
    .filter((entry) => entry.tag !== "54")
    .map((entry) => {
      if (entry.tag === "01") {
        return buildTLV("01", "12");
      }

      return entry.raw;
    });

  const body = insertBeforeTag(bodyEntries.join(""), amountTag, ["58", "59", "60", "61", "62"]);

  const checksum = crc16(body + "6304");
  const crcTag = `6304${checksum}`;

  return body + crcTag;
}

function parseTopLevelEntries(payload: string): TLVParsed[] {
  const entries: TLVParsed[] = [];
  let offset = 0;

  while (offset < payload.length) {
    const entry = parseTLVAt(payload, offset);
    if (!entry) {
      throw new Error("Payload QRIS tidak dapat diparse");
    }

    entries.push(entry);
    offset += entry.raw.length;
  }

  return entries;
}

/**
 * Sisipkan tagVal sebelum salah satu tag di targetTags.
 * Jika tidak ditemukan, append di akhir.
 */
function insertBeforeTag(
  payload: string,
  tagVal: string,
  targetTags: string[],
): string {
  let result = "";
  let offset = 0;

  while (offset < payload.length) {
    const entry = parseTLVAt(payload, offset);
    if (!entry) {
      result += payload.slice(offset);
      break;
    }

    if (targetTags.includes(entry.tag)) {
      // Sisipkan sebelum tag ini
      result += tagVal + entry.raw;
      offset += entry.raw.length;
      // Append semua sisanya
      result += payload.slice(offset);
      return result;
    } else {
      result += entry.raw;
      offset += entry.raw.length;
    }
  }

  // Tidak ketemu target, append di akhir
  return payload + tagVal;
}
