const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function normalizeSecret(input: string): string {
  return input.replace(/[\s=\-]/g, '').toUpperCase();
}

export function decodeBase32(input: string): Uint8Array {
  const cleaned = normalizeSecret(input);
  if (!cleaned) return new Uint8Array(0);

  const output: number[] = [];
  let buffer = 0;
  let bitsLeft = 0;

  for (const char of cleaned) {
    const value = BASE32_ALPHABET.indexOf(char);
    if (value === -1) continue;

    buffer = (buffer << 5) | value;
    bitsLeft += 5;

    if (bitsLeft >= 8) {
      bitsLeft -= 8;
      output.push((buffer >> bitsLeft) & 0xff);
    }
  }

  return new Uint8Array(output);
}

function counterToBytes(counter: number): Uint8Array {
  const bytes = new Uint8Array(8);
  let value = counter;
  for (let i = 7; i >= 0; i -= 1) {
    bytes[i] = value & 0xff;
    value = Math.floor(value / 256);
  }
  return bytes;
}

async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const keyBuffer = key.buffer.slice(key.byteOffset, key.byteOffset + key.byteLength) as ArrayBuffer;
  const messageBuffer = message.buffer.slice(message.byteOffset, message.byteOffset + message.byteLength) as ArrayBuffer;

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageBuffer);
  return new Uint8Array(signature);
}

function dynamicTruncate(hmac: Uint8Array, digits: number): string {
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const mod = 10 ** digits;
  return (binary % mod).toString().padStart(digits, '0');
}

export async function generateTOTP(
  secret: string,
  options?: { digits?: number; period?: number; time?: number }
): Promise<string | null> {
  const digits = options?.digits ?? 6;
  const period = options?.period ?? 30;
  const time = options?.time ?? Date.now();
  const key = decodeBase32(secret);

  if (key.length === 0) return null;

  const counter = Math.floor(time / 1000 / period);
  const hmac = await hmacSha1(key, counterToBytes(counter));
  return dynamicTruncate(hmac, digits);
}

export function getRemainingSeconds(period = 30, time = Date.now()): number {
  return period - (Math.floor(time / 1000) % period);
}

export function parseOtpAuthUri(uri: string): {
  secret: string;
  label?: string;
  issuer?: string;
  digits?: number;
  period?: number;
} | null {
  try {
    const url = new URL(uri.trim());
    if (url.protocol !== 'otpauth:' || url.hostname !== 'totp') return null;

    const secret = url.searchParams.get('secret');
    if (!secret) return null;

    const rawLabel = decodeURIComponent(url.pathname.slice(1));
    const issuer = url.searchParams.get('issuer') || undefined;
    const digits = Number(url.searchParams.get('digits') || '6');
    const period = Number(url.searchParams.get('period') || '30');

    return {
      secret: normalizeSecret(secret),
      label: issuer || rawLabel.split(':').pop() || rawLabel || undefined,
      issuer,
      digits: Number.isFinite(digits) ? digits : 6,
      period: Number.isFinite(period) ? period : 30,
    };
  } catch {
    return null;
  }
}

export function isValidSecret(secret: string): boolean {
  const cleaned = normalizeSecret(secret);
  if (cleaned.length < 8) return false;
  return [...cleaned].every((char) => BASE32_ALPHABET.includes(char));
}
