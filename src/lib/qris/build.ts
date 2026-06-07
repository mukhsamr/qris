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
  // 1. Strip old CRC (tag 63 — selalu 8 karakter terakhir: "6304XXXX")
  if (staticPayload.length < 8) {
    throw new Error("Payload QRIS terlalu pendek");
  }
  let body = staticPayload.slice(0, -8);

  // 2. Remove existing tag 54 if present
  body = removeTag(body, "54");

  // 3. Change tag 01 from static "0211" to dynamic "0212"
  body = body.replace("010211", "010212");

  // 4. Insert tag 54 (amount) before tag 58 or at the position after tag 53/52/51 area
  const amountTag = buildAmountTag(amount);
  body = insertBeforeTag(body, amountTag, ["58", "59", "60", "61", "62"]);

  // 5. Calculate CRC
  const checksum = crc16(body + "6304");
  const crcTag = `6304${checksum}`;

  return body + crcTag;
}

/**
 * Hapus single TLV entry by tag.
 */
function removeTag(payload: string, targetTag: string): string {
  let result = "";
  let offset = 0;

  while (offset < payload.length) {
    const entry = parseTLVAt(payload, offset);
    if (!entry) {
      // Tidak bisa parse — tambahkan sisa
      result += payload.slice(offset);
      break;
    }

    if (entry.tag !== targetTag) {
      result += entry.raw;
    }
    offset += entry.raw.length;
  }

  return result;
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
