import { v4 as uuidv4 } from "uuid";

// Generates a secure-ish base62 key with a prefix. Demo only.
export function generateApiKey(prefix = "sk-test", length = 24) {
  // Create random bytes and map to url-safe/base62-ish characters
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let body = "";
  for (let i = 0; i < length; i++) {
    body += alphabet[bytes[i] % alphabet.length];
  }
  const raw = `${prefix}-${body}`;
  const last4 = raw.slice(-4);
  const secretId = uuidv4();
  return { raw, last4, secretId };
}
