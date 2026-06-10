const urlLikePattern = /^[a-z0-9-]+(\.[a-z0-9-]+)+([/?#].*)?$/i;

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeContactUrlInput(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const firstPart = trimmed.split(/[\s,]+/)[0];

  if (firstPart.startsWith("@") && firstPart.length > 1) {
    return `https://t.me/${firstPart.slice(1)}`;
  }

  if (isHttpUrl(firstPart)) {
    return firstPart;
  }

  const withoutProtocol = firstPart.replace(/^\/+/, "");

  if (urlLikePattern.test(withoutProtocol)) {
    return `https://${withoutProtocol}`;
  }

  return trimmed;
}
