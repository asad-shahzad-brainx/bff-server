import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET;

if (!ENCRYPTION_SECRET) {
  throw new Error("ENCRYPTION_SECRET environment variable is required");
}

if (ENCRYPTION_SECRET.length !== 64) {
  throw new Error(
    "ENCRYPTION_SECRET must be exactly 64 hex characters (32 bytes) for AES-256"
  );
}

const secret = Buffer.from(ENCRYPTION_SECRET, "hex");

export function encryptToken(id) {
  const iv = crypto.randomBytes(8);
  const fullIv = Buffer.concat([iv, iv]);

  const cipher = crypto.createCipheriv("aes-256-cbc", secret, fullIv);
  let encrypted = cipher.update(id.toString(), "utf8");
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  const token = Buffer.concat([iv, encrypted]).toString("hex");
  return token;
}

export function decryptToken(token) {
  const buffer = Buffer.from(token, "hex");
  const iv = buffer.subarray(0, 8);
  const fullIv = Buffer.concat([iv, iv]);

  const encrypted = buffer.subarray(8);
  const decipher = crypto.createDecipheriv("aes-256-cbc", secret, fullIv);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString("utf8");
}
