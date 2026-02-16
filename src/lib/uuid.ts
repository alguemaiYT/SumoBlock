const cryptoImpl = typeof globalThis.crypto !== "undefined" ? globalThis.crypto : undefined;

function getRandomBytes() {
  const bytes = new Uint8Array(16);

  if (cryptoImpl && typeof cryptoImpl.getRandomValues === "function") {
    cryptoImpl.getRandomValues(bytes);
    return bytes;
  }

  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Math.floor(Math.random() * 256);
  }

  return bytes;
}

function formatHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Creates a RFC4122-compliant version 4 UUID that works even on browsers
 * that do not yet expose `crypto.randomUUID`.
 */
export function createUuid(): string {
  if (cryptoImpl && typeof cryptoImpl.randomUUID === "function") {
    return cryptoImpl.randomUUID();
  }

  const bytes = getRandomBytes();
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = formatHex(bytes);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
