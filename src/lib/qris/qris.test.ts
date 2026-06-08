import { describe, expect, test } from "bun:test";
import { buildTLV } from "./build";
import { crc16, isValidCRC } from "./crc16";
import { generateDynamicQRIS, isStaticQRIS, validateQRIS } from "./generate";
import { parseQRIS } from "./parse";

function withCrc(body: string): string {
  return `${body}6304${crc16(`${body}6304`)}`;
}

function staticPayload(extra = ""): string {
  return withCrc(
    [
      buildTLV("00", "01"),
      buildTLV("01", "11"),
      buildTLV("52", "0000"),
      buildTLV("53", "360"),
      extra,
      buildTLV("58", "ID"),
      buildTLV("59", "MERCHANT"),
      buildTLV("60", "JAKARTA"),
    ].join("")
  );
}

describe("QRIS CRC", () => {
  test("validates CRC and rejects tampered payloads", () => {
    const payload = staticPayload();

    expect(isValidCRC(payload)).toBe(true);
    expect(isValidCRC(`${payload.slice(0, -1)}0`)).toBe(false);
  });
});

describe("generateDynamicQRIS", () => {
  test("converts a static QRIS payload to dynamic", () => {
    const result = generateDynamicQRIS(staticPayload(), 15000);

    expect(result.success).toBe(true);
    expect(typeof result.payload).toBe("string");
    expect(validateQRIS(result.payload!).valid).toBe(true);
    expect(isStaticQRIS(result.payload!)).toBe(false);

    const tags = parseQRIS(result.payload!);
    expect(tags["01"]).toBe("12");
    expect(tags["54"]).toBe("15000");
  });

  test("replaces an existing amount tag", () => {
    const payload = withCrc(
      [
        buildTLV("00", "01"),
        buildTLV("01", "11"),
        buildTLV("52", "0000"),
        buildTLV("53", "360"),
        buildTLV("54", "1000"),
        buildTLV("58", "ID"),
        buildTLV("59", "MERCHANT"),
        buildTLV("60", "JAKARTA"),
      ].join("")
    );
    const result = generateDynamicQRIS(payload, 25000);

    expect(result.success).toBe(true);
    expect(parseQRIS(result.payload!)["54"]).toBe("25000");
  });

  test("does not mutate 010211 inside another TLV value", () => {
    const result = generateDynamicQRIS(staticPayload(buildTLV("62", "010211")), 15000);

    expect(result.success).toBe(true);
    expect(parseQRIS(result.payload!)["62"]).toBe("010211");
  });
});
