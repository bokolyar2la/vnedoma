import { createHash, createHmac } from "node:crypto";

type ServiceEmailInput = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string | string[];
};

type EmailSendResult =
  | { status: "sent" }
  | { status: "skipped"; reason: "missing_config" | "missing_recipient" };

type PostboxApiConfig = {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  fromEmail: string;
  fromName: string;
  configurationSet: string;
};

const DEFAULT_POSTBOX_ENDPOINT = "https://postbox.cloud.yandex.net";
const DEFAULT_POSTBOX_REGION = "ru-central1";
const POSTBOX_SERVICE = "ses";
const POSTBOX_TIMEOUT_MS = 8000;

function getEnv(name: string) {
  return process.env[name]?.trim() || "";
}

function normalizeAddressList(value?: string | string[]) {
  if (!value) {
    return [];
  }

  const values = Array.isArray(value) ? value : [value];

  return values
    .flatMap((item) => item.split(","))
    .map((item) => item.trim())
    .filter(Boolean);
}

function getPostboxApiConfig(): PostboxApiConfig {
  return {
    endpoint: getEnv("POSTBOX_API_ENDPOINT") || DEFAULT_POSTBOX_ENDPOINT,
    region: getEnv("POSTBOX_REGION") || DEFAULT_POSTBOX_REGION,
    accessKeyId: getEnv("POSTBOX_ACCESS_KEY_ID") || getEnv("POSTBOX_ACCESS_KEY"),
    secretAccessKey: getEnv("POSTBOX_SECRET_ACCESS_KEY"),
    fromEmail: getEnv("POSTBOX_FROM_EMAIL") || getEnv("EMAIL_FROM"),
    fromName: getEnv("POSTBOX_FROM_NAME") || "Vlyudi",
    configurationSet: getEnv("POSTBOX_CONFIGURATION_SET")
  };
}

export function isEmailConfigured() {
  const config = getPostboxApiConfig();

  return Boolean(
    config.endpoint &&
      config.region &&
      config.accessKeyId &&
      config.secretAccessKey &&
      config.fromEmail
  );
}

export function getEmailConfigDiagnostics() {
  const config = getPostboxApiConfig();

  return {
    endpoint: config.endpoint,
    region: config.region,
    hasAccessKeyId: Boolean(config.accessKeyId),
    hasSecretAccessKey: Boolean(config.secretAccessKey),
    fromEmail: config.fromEmail || null
  };
}

export function getAppBaseUrl() {
  return (process.env.APP_BASE_URL || "https://vlyudi.ru").replace(/\/+$/, "");
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });
}

export function textToHtml(text: string) {
  const paragraphs = text
    .split("\n")
    .map((line) =>
      line.trim()
        ? `<p style="margin:0 0 12px;">${escapeHtml(line)}</p>`
        : `<div style="height:8px;"></div>`
    )
    .join("");

  return `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.55;color:#172126;">${paragraphs}</div>`;
}

function encodeSenderAddress(email: string, name: string) {
  const safeEmail = email.replace(/[\r\n<>]+/g, "").trim();
  const safeName = name.replace(/[\r\n"]+/g, " ").trim();

  return safeName ? `"${safeName}" <${safeEmail}>` : safeEmail;
}

function sha256Hex(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function hmac(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value, "utf8").digest();
}

function getSignatureKey(secretAccessKey: string, dateStamp: string, region: string) {
  const dateKey = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const regionKey = hmac(dateKey, region);
  const serviceKey = hmac(regionKey, POSTBOX_SERVICE);

  return hmac(serviceKey, "aws4_request");
}

function toAmzDate(date: Date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function buildPostboxPayload(
  input: ServiceEmailInput,
  config: PostboxApiConfig,
  toAddresses: string[]
) {
  return {
    FromEmailAddress: encodeSenderAddress(config.fromEmail, config.fromName),
    Destination: {
      ToAddresses: toAddresses
    },
    ReplyToAddresses: normalizeAddressList(input.replyTo),
    Content: {
      Simple: {
        Subject: {
          Data: input.subject,
          Charset: "UTF-8"
        },
        Body: {
          Text: {
            Data: input.text,
            Charset: "UTF-8"
          },
          Html: {
            Data: input.html || textToHtml(input.text),
            Charset: "UTF-8"
          }
        }
      }
    },
    ...(config.configurationSet ? { ConfigurationSetName: config.configurationSet } : {})
  };
}

function signPostboxRequest(
  method: string,
  url: URL,
  body: string,
  config: PostboxApiConfig
) {
  const now = new Date();
  const amzDate = toAmzDate(now);
  const dateStamp = amzDate.slice(0, 8);
  const canonicalUri = url.pathname;
  const canonicalQueryString = "";
  const canonicalHeaders = [
    "content-type:application/json",
    `host:${url.host}`,
    `x-amz-date:${amzDate}`
  ].join("\n");
  const signedHeaders = "content-type;host;x-amz-date";
  const payloadHash = sha256Hex(body);
  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    "",
    signedHeaders,
    payloadHash
  ].join("\n");
  const credentialScope = `${dateStamp}/${config.region}/${POSTBOX_SERVICE}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest)
  ].join("\n");
  const signingKey = getSignatureKey(config.secretAccessKey, dateStamp, config.region);
  const signature = createHmac("sha256", signingKey)
    .update(stringToSign, "utf8")
    .digest("hex");

  return {
    "Content-Type": "application/json",
    "X-Amz-Date": amzDate,
    Authorization: [
      `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}`,
      `SignedHeaders=${signedHeaders}`,
      `Signature=${signature}`
    ].join(", ")
  };
}

async function sendViaPostboxApi(
  input: ServiceEmailInput,
  config: PostboxApiConfig,
  toAddresses: string[]
) {
  const url = new URL("/v2/email/outbound-emails", config.endpoint);
  const body = JSON.stringify(buildPostboxPayload(input, config, toAddresses));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), POSTBOX_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: signPostboxRequest("POST", url, body, config),
      body,
      signal: controller.signal
    });

    if (!response.ok) {
      const responseBody = await response.text().catch(() => "");

      throw new Error(
        `Postbox API request failed: ${response.status} ${response.statusText} ${responseBody}`
      );
    }
  } finally {
    clearTimeout(timeout);
  }
}

export async function sendServiceEmail(
  input: ServiceEmailInput
): Promise<EmailSendResult> {
  const config = getPostboxApiConfig();
  const toAddresses = normalizeAddressList(input.to);

  if (!toAddresses.length) {
    return { status: "skipped", reason: "missing_recipient" };
  }

  if (!isEmailConfigured()) {
    console.warn("Service email missing Postbox API config", getEmailConfigDiagnostics());
    return { status: "skipped", reason: "missing_config" };
  }

  await sendViaPostboxApi(input, config, toAddresses);
  console.info("Service email sent", {
    toCount: toAddresses.length,
    subject: input.subject,
    endpoint: config.endpoint,
    region: config.region,
    fromEmail: config.fromEmail
  });

  return { status: "sent" };
}
