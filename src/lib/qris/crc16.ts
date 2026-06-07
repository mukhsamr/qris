/**
 * CRC16-CCITT (XMODEM) checksum untuk QRIS.
 * Polynomial: 0x1021, Initial: 0xFFFF
 *
 * QRIS menggunakan CRC16-CCITT dengan result di-hex dan di-upper-case, 4 digit.
 */
export function crc16(data: string): string {
  let crc = 0xffff;

  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
    }
  }

  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Validasi CRC payload QRIS.
 * Asumsikan payload memiliki tag 63 di 4 karakter terakhir.
 * Return true jika CRC valid.
 */
export function isValidCRC(fullPayload: string): boolean {
  if (fullPayload.length < 8) return false;

  // 4 karakter terakhir adalah tag "63" + 2 digit length "04"
  const payloadWithoutCRC = fullPayload.slice(0, -8); // hilangkan "6304XXXX"
  const actualCRC = fullPayload.slice(-4);
  const expectedCRC = crc16(payloadWithoutCRC + "6304");

  return actualCRC === expectedCRC;
}
