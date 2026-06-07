import { isValidCRC } from "./crc16";
import { parseQRIS } from "./parse";

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validasi payload QRIS secara umum.
 */
export function validateQRIS(payload: string): ValidationResult {
  if (!payload || payload.length === 0) {
    return { valid: false, error: "Payload QRIS kosong" };
  }

  // Cek panjang minimum
  if (payload.length < 20) {
    return { valid: false, error: "Payload QRIS terlalu pendek" };
  }

  const tags = parseQRIS(payload);

  // Cek Payload Format Indicator (tag 00) harus "01"
  if (!tags["00"] || tags["00"] !== "01") {
    return {
      valid: false,
      error: 'Payload Format Indicator (tag 00) tidak valid, harus "01"',
    };
  }

  // Cek Point of Initiation Method (tag 01) harus "11" (static) atau "12" (dynamic)
  if (!tags["01"] || !["11", "12"].includes(tags["01"])) {
    return {
      valid: false,
      error: 'Point of Initiation Method (tag 01) tidak valid, harus "11" atau "12"',
    };
  }

  // Cek Country Code (tag 58) harus "ID"
  if (!tags["58"] || tags["58"] !== "ID") {
    return {
      valid: false,
      error: 'Country Code (tag 58) tidak valid, harus "ID"',
    };
  }

  // Cek Merchant Name (tag 59) — optional tapi baiknya ada
  if (!tags["59"]) {
    return {
      valid: false,
      error: "Merchant Name (tag 59) tidak ditemukan",
    };
  }

  // Cek Transaction Currency (tag 53) harus "360" (IDR)
  if (!tags["53"] || tags["53"] !== "360") {
    return {
      valid: false,
      error: 'Transaction Currency (tag 53) tidak valid, harus "360" (IDR)',
    };
  }

  // Cek CRC
  if (!isValidCRC(payload)) {
    return { valid: false, error: "CRC checksum tidak valid" };
  }

  return { valid: true };
}

/**
 * Cek apakah ini static QRIS (tag 01 = "11").
 */
export function isStaticQRIS(payload: string): boolean {
  const tags = parseQRIS(payload);
  return tags["01"] === "11";
}
