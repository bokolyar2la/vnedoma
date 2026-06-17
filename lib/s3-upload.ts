"use server";

import { createHash, createHmac, randomUUID } from "node:crypto";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"]
]);

type S3Config = {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl: string;
};

function getConfig(): S3Config | null {
  const endpoint = process.env.S3_ENDPOINT?.replace(/\/+$/, "");
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return {
    endpoint,
    bucket,
    accessKeyId,
    secretAccessKey,
    region: process.env.S3_REGION || "ru-1",
    publicBaseUrl:
      process.env.S3_PUBLIC_BASE_URL?.replace(/\/+$/, "") || `${endpoint}/${bucket}`
  };
}

function hmac(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value, "utf8").digest();
}

function hash(value: Buffer | string) {
  return createHash("sha256").update(value).digest("hex");
}

function getSigningKey(secretAccessKey: string, dateStamp: string, region: string) {
  const dateKey = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const regionKey = hmac(dateKey, region);
  const serviceKey = hmac(regionKey, "s3");
  return hmac(serviceKey, "aws4_request");
}

function encodeKeyPart(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

function buildObjectKey(file: File, extension: string) {
  const safeName = file.name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const name = safeName || "cover";
  return `activities/${new Date().toISOString().slice(0, 10)}/${Date.now()}-${randomUUID()}-${name}.${extension}`;
}

export async function uploadActivityImage(formData: FormData) {
  const value = formData.get("imageFile");

  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  const extension = ALLOWED_IMAGE_TYPES.get(value.type);

  if (!extension) {
    throw new Error("Можно загрузить только JPG, PNG или WEBP.");
  }

  if (value.size > MAX_IMAGE_SIZE) {
    throw new Error("Изображение должно быть не больше 5 МБ.");
  }

  const config = getConfig();

  if (!config) {
    throw new Error("S3-хранилище не настроено на сервере.");
  }

  const bytes = Buffer.from(await value.arrayBuffer());
  const objectKey = buildObjectKey(value, extension);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const endpointUrl = new URL(config.endpoint);
  const canonicalUri = `/${config.bucket}/${objectKey.split("/").map(encodeKeyPart).join("/")}`;
  const payloadHash = hash(bytes);
  const canonicalHeaders = [
    `content-type:${value.type}`,
    `host:${endpointUrl.host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`
  ].join("\n");
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = [
    "PUT",
    canonicalUri,
    "",
    `${canonicalHeaders}\n`,
    signedHeaders,
    payloadHash
  ].join("\n");
  const credentialScope = `${dateStamp}/${config.region}/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    hash(canonicalRequest)
  ].join("\n");
  const signature = createHmac(
    "sha256",
    getSigningKey(config.secretAccessKey, dateStamp, config.region)
  )
    .update(stringToSign, "utf8")
    .digest("hex");
  const authorization = [
    `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signature}`
  ].join(", ");
  const uploadUrl = `${config.endpoint}${canonicalUri}`;
  const response = await fetch(uploadUrl, {
    method: "PUT",
    body: bytes,
    headers: {
      Authorization: authorization,
      "Content-Type": value.type,
      "X-Amz-Content-Sha256": payloadHash,
      "X-Amz-Date": amzDate
    }
  });

  if (!response.ok) {
    throw new Error("Не удалось загрузить изображение в S3.");
  }

  return `${config.publicBaseUrl}/${objectKey
    .split("/")
    .map(encodeKeyPart)
    .join("/")}`;
}
