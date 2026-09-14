export function safeMediaUrl(value: string) {
  const trimmed = value.trim();
  if (trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.includes("\\")) return trimmed;
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

export function isVkPageUrl(value: string) {
  try {
    const { hostname } = new URL(value);
    return ["vk.com", "vk.ru"].some((host) => hostname === host || hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}
