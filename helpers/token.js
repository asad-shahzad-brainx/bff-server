import crypto from "crypto";

const secret = Buffer.from(
  "2be10af2a68e0a5fc6b4c86c95a05de07a51e2a7de3c7eb9748a81a60b8f63c3",
  "hex"
);

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
