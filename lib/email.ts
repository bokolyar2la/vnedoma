import net from "node:net";
import tls from "node:tls";
import { randomUUID } from "node:crypto";

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

type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromEmail: string;
  fromName: string;
  configurationSet: string;
};

type SmtpConnection = {
  socket: net.Socket | tls.TLSSocket;
  readResponse: () => Promise<string>;
};

const DEFAULT_SMTP_HOST = "postbox.cloud.yandex.net";
const DEFAULT_SMTP_PORT = 465;
const SMTP_TIMEOUT_MS = 10000;

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

function getSmtpConfig(): SmtpConfig {
  const port = Number(getEnv("POSTBOX_SMTP_PORT")) || DEFAULT_SMTP_PORT;

  return {
    host: getEnv("POSTBOX_SMTP_HOST") || DEFAULT_SMTP_HOST,
    port,
    secure: (getEnv("POSTBOX_SMTP_SECURE") || String(port === 465)).toLowerCase() !== "false",
    user: getEnv("POSTBOX_SMTP_USER") || getEnv("POSTBOX_API_KEY_ID"),
    password: getEnv("POSTBOX_SMTP_PASSWORD") || getEnv("POSTBOX_API_KEY"),
    fromEmail: getEnv("POSTBOX_FROM_EMAIL") || getEnv("EMAIL_FROM"),
    fromName: getEnv("POSTBOX_FROM_NAME") || "Vlyudi",
    configurationSet: getEnv("POSTBOX_CONFIGURATION_SET")
  };
}

export function isEmailConfigured() {
  const config = getSmtpConfig();

  return Boolean(config.host && config.user && config.password && config.fromEmail);
}

export function getEmailConfigDiagnostics() {
  const config = getSmtpConfig();

  return {
    host: config.host,
    port: config.port,
    secure: config.secure,
    hasUser: Boolean(config.user),
    hasPassword: Boolean(config.password),
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

function encodeHeader(value: string) {
  const safeValue = value.replace(/[\r\n]+/g, " ").trim();

  if (/^[\x20-\x7e]*$/.test(safeValue)) {
    return safeValue;
  }

  return `=?UTF-8?B?${Buffer.from(safeValue, "utf8").toString("base64")}?=`;
}

function encodeAddress(email: string, name?: string) {
  const safeEmail = email.replace(/[\r\n<>]+/g, "").trim();
  const safeName = name?.replace(/[\r\n]+/g, " ").trim();

  return safeName ? `${encodeHeader(safeName)} <${safeEmail}>` : safeEmail;
}

function encodeBody(value: string) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/.{1,76}/g, "$&\r\n")
    .trimEnd();
}

function dotStuff(message: string) {
  return message.replace(/^\./gm, "..");
}

function buildMimeMessage(input: ServiceEmailInput, config: SmtpConfig, toAddresses: string[]) {
  const boundary = `vlyudi-${randomUUID()}`;
  const html = input.html || textToHtml(input.text);
  const replyToAddresses = normalizeAddressList(input.replyTo);
  const headers = [
    `From: ${encodeAddress(config.fromEmail, config.fromName)}`,
    `To: ${toAddresses.map((address) => encodeAddress(address)).join(", ")}`,
    replyToAddresses.length
      ? `Reply-To: ${replyToAddresses.map((address) => encodeAddress(address)).join(", ")}`
      : null,
    `Subject: ${encodeHeader(input.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${randomUUID()}@vlyudi.ru>`,
    config.configurationSet ? `X-SES-CONFIGURATION-SET: ${encodeHeader(config.configurationSet)}` : null,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`
  ].filter((line): line is string => Boolean(line));

  return [
    ...headers,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    encodeBody(input.text),
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    encodeBody(html),
    `--${boundary}--`,
    ""
  ].join("\r\n");
}

function createSmtpConnection(socket: net.Socket | tls.TLSSocket): SmtpConnection {
  let buffer = "";
  const waiters: Array<{
    resolve: (response: string) => void;
    reject: (error: Error) => void;
    timer: NodeJS.Timeout;
  }> = [];

  socket.setEncoding("utf8");
  socket.setTimeout(SMTP_TIMEOUT_MS);
  socket.on("data", (chunk) => {
    buffer += chunk.toString();
    flushResponses();
  });
  socket.on("error", rejectWaiters);
  socket.on("timeout", () => {
    socket.destroy();
    rejectWaiters(new Error("SMTP connection timed out"));
  });

  function rejectWaiters(error: Error) {
    while (waiters.length) {
      const waiter = waiters.shift();
      if (waiter) {
        clearTimeout(waiter.timer);
        waiter.reject(error);
      }
    }
  }

  function takeResponse() {
    const lines: string[] = [];

    while (buffer.includes("\n")) {
      const index = buffer.indexOf("\n");
      const line = buffer.slice(0, index).replace(/\r$/, "");
      buffer = buffer.slice(index + 1);
      lines.push(line);

      if (/^\d{3} /.test(line)) {
        return lines.join("\n");
      }
    }

    if (lines.length) {
      buffer = `${lines.join("\r\n")}\r\n${buffer}`;
    }

    return null;
  }

  function flushResponses() {
    while (waiters.length) {
      const response = takeResponse();

      if (!response) {
        return;
      }

      const waiter = waiters.shift();
      if (waiter) {
        clearTimeout(waiter.timer);
        waiter.resolve(response);
      }
    }
  }

  return {
    socket,
    readResponse() {
      const response = takeResponse();

      if (response) {
        return Promise.resolve(response);
      }

      return new Promise<string>((resolve, reject) => {
        const timer = setTimeout(() => {
          const index = waiters.findIndex((waiter) => waiter.timer === timer);

          if (index >= 0) {
            waiters.splice(index, 1);
          }

          reject(new Error("SMTP response timed out"));
        }, SMTP_TIMEOUT_MS);

        waiters.push({ resolve, reject, timer });
      });
    }
  };
}

function connectSocket(config: SmtpConfig) {
  return new Promise<net.Socket | tls.TLSSocket>((resolve, reject) => {
    const options = {
      host: config.host,
      port: config.port,
      servername: config.host
    };
    const socket = config.secure ? tls.connect(options) : net.connect(options);

    socket.once(config.secure ? "secureConnect" : "connect", () => resolve(socket));
    socket.once("error", reject);
    socket.setTimeout(SMTP_TIMEOUT_MS, () => {
      socket.destroy();
      reject(new Error("SMTP connection timed out"));
    });
  });
}

function upgradeToTls(connection: SmtpConnection, config: SmtpConfig) {
  return new Promise<SmtpConnection>((resolve, reject) => {
    const secureSocket = tls.connect({
      socket: connection.socket,
      servername: config.host
    });

    secureSocket.once("secureConnect", () => resolve(createSmtpConnection(secureSocket)));
    secureSocket.once("error", reject);
  });
}

async function sendSmtpCommand(
  connection: SmtpConnection,
  command: string | null,
  expectedCodes: number[]
) {
  const responsePromise = connection.readResponse();

  if (command !== null) {
    connection.socket.write(`${command}\r\n`);
  }

  const response = await responsePromise;
  const code = Number(response.slice(0, 3));

  if (!expectedCodes.includes(code)) {
    throw new Error(`Unexpected SMTP response: ${response}`);
  }

  return response;
}

async function authenticate(connection: SmtpConnection, config: SmtpConfig) {
  try {
    await sendSmtpCommand(
      connection,
      `AUTH PLAIN ${Buffer.from(`\0${config.user}\0${config.password}`).toString("base64")}`,
      [235]
    );
    return;
  } catch (error) {
    console.warn("SMTP AUTH PLAIN failed, retrying AUTH LOGIN", error);
  }

  await sendSmtpCommand(connection, "AUTH LOGIN", [334]);
  await sendSmtpCommand(connection, Buffer.from(config.user).toString("base64"), [334]);
  await sendSmtpCommand(connection, Buffer.from(config.password).toString("base64"), [235]);
}

async function sendViaSmtp(input: ServiceEmailInput, config: SmtpConfig, toAddresses: string[]) {
  let connection = createSmtpConnection(await connectSocket(config));

  try {
    await sendSmtpCommand(connection, null, [220]);
    await sendSmtpCommand(connection, "EHLO vlyudi.ru", [250]);

    if (!config.secure) {
      await sendSmtpCommand(connection, "STARTTLS", [220]);
      connection = await upgradeToTls(connection, config);
      await sendSmtpCommand(connection, "EHLO vlyudi.ru", [250]);
    }

    await authenticate(connection, config);
    await sendSmtpCommand(connection, `MAIL FROM:<${config.fromEmail}>`, [250]);

    for (const address of toAddresses) {
      await sendSmtpCommand(connection, `RCPT TO:<${address}>`, [250, 251]);
    }

    await sendSmtpCommand(connection, "DATA", [354]);
    await sendSmtpCommand(
      connection,
      `${dotStuff(buildMimeMessage(input, config, toAddresses))}\r\n.`,
      [250]
    );
    await sendSmtpCommand(connection, "QUIT", [221]);
  } finally {
    connection.socket.end();
  }
}

export async function sendServiceEmail(
  input: ServiceEmailInput
): Promise<EmailSendResult> {
  const config = getSmtpConfig();
  const toAddresses = normalizeAddressList(input.to);

  if (!toAddresses.length) {
    return { status: "skipped", reason: "missing_recipient" };
  }

  if (!isEmailConfigured()) {
    console.warn("Service email missing SMTP config", getEmailConfigDiagnostics());
    return { status: "skipped", reason: "missing_config" };
  }

  await sendViaSmtp(input, config, toAddresses);
  console.info("Service email sent", {
    toCount: toAddresses.length,
    subject: input.subject,
    host: config.host,
    port: config.port,
    secure: config.secure,
    fromEmail: config.fromEmail
  });

  return { status: "sent" };
}
