import { validateQRIS, isStaticQRIS, type ValidationResult } from "./validate";
import { buildDynamicQRIS } from "./build";
import { extractInfo, type QRISInfo } from "./parse";

export interface GenerateResult {
  success: boolean;
  payload?: string;
  error?: string;
}

/**
 * Generate QRIS dinamis dari static payload dan amount.
 * Pure function — bisa dipakai dari mana saja: UI, server, internal binding, external API.
 */
export function generateDynamicQRIS(
  staticPayload: string,
  amount: number,
): GenerateResult {
  // Validasi amount
  if (!Number.isInteger(amount) || amount <= 0) {
    return { success: false, error: "Nominal harus integer positif" };
  }

  if (amount > 99_999_999_999) {
    return { success: false, error: "Nominal terlalu besar (max 99 milyar)" };
  }

  // Validasi payload
  const validation = validateQRIS(staticPayload);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error ?? "Payload QRIS tidak valid",
    };
  }

  // Cek apakah static QRIS
  if (!isStaticQRIS(staticPayload)) {
    return {
      success: false,
      error: "QRIS sudah dynamic, tidak perlu konversi",
    };
  }

  try {
    const payload = buildDynamicQRIS(staticPayload, amount);
    return { success: true, payload };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal generate QRIS",
    };
  }
}

export { validateQRIS, isStaticQRIS, extractInfo };
export type { ValidationResult, QRISInfo };
